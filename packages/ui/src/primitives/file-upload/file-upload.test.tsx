import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { FileUpload } from './file-upload';
import { formatBytes, type UploadFile } from './use-file-upload';

/** A File with a controllable `size` (File.size is otherwise derived from content). */
function makeFile(name: string, type: string, size = 10): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function dropzoneFor(input: HTMLElement): HTMLElement {
  return input.closest('label') as HTMLElement;
}

describe('formatBytes', () => {
  it('formats sizes with units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('FileUpload', () => {
  it('adds files selected via browse and calls onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FileUpload onChange={onChange} />);
    const input = screen.getByLabelText('Upload files');
    await user.upload(input, makeFile('a.txt', 'text/plain'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0]?.[0] as UploadFile[];
    expect(arg).toHaveLength(1);
    expect(arg[0]?.file.name).toBe('a.txt');
    expect(screen.getByText('a.txt')).toBeInTheDocument();
  });

  it('adds files via drag-and-drop', () => {
    const onChange = vi.fn();
    render(<FileUpload onChange={onChange} />);
    const dropzone = dropzoneFor(screen.getByLabelText('Upload files'));
    fireEvent.drop(dropzone, { dataTransfer: { files: [makeFile('b.csv', 'text/csv')], types: ['Files'] } });

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByText('b.csv')).toBeInTheDocument();
  });

  it('rejects files over maxSize (not added, reported, shown inline)', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<FileUpload maxSize={1024} onReject={onReject} />);
    await user.upload(screen.getByLabelText('Upload files'), makeFile('big.txt', 'text/plain', 5000));

    expect(onReject).toHaveBeenCalledTimes(1);
    const rejections = onReject.mock.calls[0]?.[0];
    expect(rejections[0].errors[0].code).toBe('file-too-large');
    // Not added to the list (it only appears in the inline rejection alert).
    expect(screen.queryByRole('button', { name: 'Remove big.txt' })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/larger than/i);
  });

  it('rejects files that do not match accept', () => {
    const onReject = vi.fn();
    render(<FileUpload accept="image/*" onReject={onReject} />);
    const dropzone = dropzoneFor(screen.getByLabelText('Upload files'));
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [makeFile('doc.pdf', 'application/pdf')], types: ['Files'] },
    });

    expect(onReject).toHaveBeenCalled();
    expect(onReject.mock.calls[0]?.[0][0].errors[0].code).toBe('file-invalid-type');
    expect(screen.queryByRole('button', { name: 'Remove doc.pdf' })).not.toBeInTheDocument();
  });

  it('rejects files beyond maxFiles', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<FileUpload maxFiles={1} onReject={onReject} />);
    await user.upload(screen.getByLabelText('Upload files'), [
      makeFile('a.txt', 'text/plain'),
      makeFile('b.txt', 'text/plain'),
    ]);

    expect(screen.getByRole('button', { name: 'Remove a.txt' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove b.txt' })).not.toBeInTheDocument();
    const rejections = onReject.mock.calls.at(-1)?.[0];
    expect(rejections[0].errors[0].code).toBe('too-many-files');
  });

  it('replaces the current file in single mode', async () => {
    const user = userEvent.setup();
    render(<FileUpload multiple={false} />);
    const input = screen.getByLabelText('Upload files');
    await user.upload(input, makeFile('first.txt', 'text/plain'));
    expect(screen.getByText('first.txt')).toBeInTheDocument();
    await user.upload(input, makeFile('second.txt', 'text/plain'));
    expect(screen.queryByText('first.txt')).not.toBeInTheDocument();
    expect(screen.getByText('second.txt')).toBeInTheDocument();
  });

  it('removes a file via its remove button', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<FileUpload onRemove={onRemove} />);
    await user.upload(screen.getByLabelText('Upload files'), makeFile('gone.txt', 'text/plain'));
    await user.click(screen.getByRole('button', { name: 'Remove gone.txt' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('gone.txt')).not.toBeInTheDocument();
  });

  it('does nothing when disabled', () => {
    const onChange = vi.fn();
    render(<FileUpload disabled onChange={onChange} />);
    const input = screen.getByLabelText('Upload files');
    expect(input).toBeDisabled();
    fireEvent.drop(dropzoneFor(input), {
      dataTransfer: { files: [makeFile('x.txt', 'text/plain')], types: ['Files'] },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders upload progress and error status from a controlled value', () => {
    const items: UploadFile[] = [
      { id: '1', file: makeFile('up.txt', 'text/plain'), status: 'uploading', progress: 42 },
      { id: '2', file: makeFile('bad.txt', 'text/plain'), status: 'error', error: 'Upload failed' },
    ];
    render(<FileUpload value={items} onChange={() => {}} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('has no accessibility violations (empty and with files)', async () => {
    const { rerender, container } = render(<FileUpload aria-label="Attach documents" />);
    expect((await axe(container)).violations).toEqual([]);

    const items: UploadFile[] = [
      { id: '1', file: makeFile('doc.pdf', 'application/pdf', 2048), status: 'success' },
    ];
    rerender(<FileUpload aria-label="Attach documents" value={items} onChange={() => {}} />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
