import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Modal } from './modal';

describe('Modal', () => {
  it('opens via the trigger and renders title, description, body, footer', async () => {
    const user = userEvent.setup();
    render(
      <Modal
        trigger={<button type="button">Open</button>}
        title="Edit product"
        description="Update the details."
        footer={<button type="button">Save</button>}
      >
        <p>Body content</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog', { name: 'Edit product' })).toBeInTheDocument();
    expect(screen.getByText('Update the details.')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders open when controlled', () => {
    render(
      <Modal open onOpenChange={() => {}} title="Controlled">
        Body
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Controlled' })).toBeInTheDocument();
  });

  it('forwards the size to the content', () => {
    render(
      <Modal open onOpenChange={() => {}} title="Large" size="lg">
        Body
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl');
  });

  it('omits the footer when not provided', () => {
    render(
      <Modal open onOpenChange={() => {}} title="No footer">
        Body
      </Modal>,
    );
    // The only button present is the ✕ close button.
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('has no accessibility violations when open', async () => {
    render(
      <Modal open onOpenChange={() => {}} title="Edit" description="desc">
        Body
      </Modal>,
    );
    const results = await axe(document.body);
    expect(results.violations).toEqual([]);
  });
});
