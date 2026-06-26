import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Spinner } from './spinner';
import { Progress } from './progress';
import { LoadingOverlay } from './loading-overlay';

describe('Spinner', () => {
  it('exposes role="status" with the default accessible name', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('accepts a custom label and size', () => {
    render(<Spinner label="Fetching" size="lg" />);
    const spinner = screen.getByRole('status', { name: 'Fetching' });
    expect(spinner).toHaveClass('size-6', 'animate-spin');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Spinner />);
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe('Progress', () => {
  it('is determinate with aria-valuenow when value is given', () => {
    render(<Progress value={40} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps out-of-range values', () => {
    const { rerender } = render(<Progress value={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    rerender(<Progress value={-10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('is indeterminate (no aria-valuenow) when value is omitted', () => {
    render(<Progress />);
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
  });

  it('applies the tone to the indicator', () => {
    render(<Progress value={50} tone="success" />);
    const indicator = screen.getByRole('progressbar').firstChild as HTMLElement;
    expect(indicator).toHaveClass('bg-success');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Progress value={60} label="Uploading" />);
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe('LoadingOverlay', () => {
  it('renders with aria-busy and a message when shown', () => {
    render(<LoadingOverlay label="Loading data" />);
    const overlay = screen.getByRole('status');
    expect(overlay).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading data')).toBeInTheDocument();
  });

  it('renders nothing when show is false', () => {
    render(<LoadingOverlay show={false} label="Hidden" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div className="relative h-40">
        <LoadingOverlay label="Loading data" />
      </div>,
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});
