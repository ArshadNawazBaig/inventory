import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ImageUpload } from './image-upload';
import type { UploadFile } from '../file-upload/use-file-upload';

// jsdom doesn't implement object URLs — stub them and track revocation.
let urlCounter = 0;
const createSpy = vi.fn(() => `blob:mock-${urlCounter++}`);
const revokeSpy = vi.fn();

beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', { value: createSpy, writable: true, configurable: true });
  Object.defineProperty(URL, 'revokeObjectURL', { value: revokeSpy, writable: true, configurable: true });
});
beforeEach(() => {
  urlCounter = 0;
  createSpy.mockClear();
  revokeSpy.mockClear();
});

function makeImage(name: string, size = 1024, type = 'image/png'): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function dropOn(el: HTMLElement, files: File[]) {
  fireEvent.drop(el, { dataTransfer: { files, types: ['Files'] } });
}

describe('ImageUpload', () => {
  it('adds an image via browse and shows a thumbnail', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ImageUpload onChange={onChange} />);
    await user.upload(screen.getByLabelText('Upload images'), makeImage('photo.png'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const thumb = await screen.findByAltText('photo.png');
    expect(thumb).toHaveAttribute('src', expect.stringMatching(/^blob:mock-/));
  });

  it('adds an image via drag-and-drop', async () => {
    const onChange = vi.fn();
    render(<ImageUpload onChange={onChange} />);
    const dropzone = screen.getByLabelText('Upload images').closest('label') as HTMLElement;
    await dropOn(dropzone, [makeImage('dropped.jpg', 2048, 'image/jpeg')]);

    expect(onChange).toHaveBeenCalled();
    expect(await screen.findByAltText('dropped.jpg')).toBeInTheDocument();
  });

  it('rejects a non-image file (default accept="image/*")', async () => {
    const onReject = vi.fn();
    render(<ImageUpload onReject={onReject} />);
    const dropzone = screen.getByLabelText('Upload images').closest('label') as HTMLElement;
    const pdf = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    await dropOn(dropzone, [pdf]);

    expect(onReject).toHaveBeenCalled();
    expect(onReject.mock.calls[0]?.[0][0].errors[0].code).toBe('file-invalid-type');
    expect(screen.queryByAltText('doc.pdf')).not.toBeInTheDocument();
  });

  it('rejects an image over maxSize', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<ImageUpload maxSize={1024} onReject={onReject} />);
    await user.upload(screen.getByLabelText('Upload images'), makeImage('huge.png', 5000));

    expect(onReject.mock.calls[0]?.[0][0].errors[0].code).toBe('file-too-large');
    expect(screen.queryByAltText('huge.png')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/larger than/i);
  });

  it('hides the add tile at maxFiles and rejects extras', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<ImageUpload maxFiles={1} onReject={onReject} />);
    await user.upload(screen.getByLabelText('Upload images'), [
      makeImage('a.png'),
      makeImage('b.png'),
    ]);

    expect(await screen.findByAltText('a.png')).toBeInTheDocument();
    expect(screen.queryByAltText('b.png')).not.toBeInTheDocument();
    // add tile (and its input) gone once full
    expect(screen.queryByLabelText('Upload images')).not.toBeInTheDocument();
    expect(onReject.mock.calls.at(-1)?.[0][0].errors[0].code).toBe('too-many-files');
  });

  it('replaces the current image in single mode and supports a circular shape', async () => {
    const user = userEvent.setup();
    render(<ImageUpload multiple={false} shape="circle" />);
    const input = screen.getByLabelText('Upload image');
    expect(input.closest('label')).toHaveClass('rounded-full');

    await user.upload(input, makeImage('first.png'));
    expect(await screen.findByAltText('first.png')).toBeInTheDocument();
    await user.upload(input, makeImage('second.png'));
    expect(await screen.findByAltText('second.png')).toBeInTheDocument();
    expect(screen.queryByAltText('first.png')).not.toBeInTheDocument();
  });

  it('removes an image and revokes its object URL', async () => {
    const user = userEvent.setup();
    render(<ImageUpload />);
    await user.upload(screen.getByLabelText('Upload images'), makeImage('gone.png'));
    await screen.findByAltText('gone.png');

    await user.click(screen.getByRole('button', { name: 'Remove gone.png' }));
    expect(screen.queryByAltText('gone.png')).not.toBeInTheDocument();
    await waitFor(() => expect(revokeSpy).toHaveBeenCalled());
  });

  it('does nothing when disabled', async () => {
    const onChange = vi.fn();
    render(<ImageUpload multiple={false} disabled onChange={onChange} />);
    const input = screen.getByLabelText('Upload image');
    expect(input).toBeDisabled();
    await dropOn(input.closest('label') as HTMLElement, [makeImage('x.png')]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders upload progress and error status from a controlled value', () => {
    const items: UploadFile[] = [
      { id: '1', file: makeImage('up.png'), status: 'uploading', progress: 30 },
      { id: '2', file: makeImage('bad.png'), status: 'error', error: 'Upload failed' },
    ];
    render(<ImageUpload value={items} onChange={() => {}} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30');
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('has no accessibility violations (empty and with images)', async () => {
    const { rerender, container } = render(<ImageUpload aria-label="Product images" />);
    expect((await axe(container)).violations).toEqual([]);

    const items: UploadFile[] = [{ id: '1', file: makeImage('p.png'), status: 'success' }];
    rerender(<ImageUpload aria-label="Product images" value={items} onChange={() => {}} />);
    await screen.findByAltText('p.png');
    expect((await axe(container)).violations).toEqual([]);
  });
});
