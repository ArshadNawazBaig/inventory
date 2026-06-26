import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Avatar, AvatarGroup } from './avatar';

describe('Avatar', () => {
  it('renders initials derived from the name', () => {
    render(<Avatar name="Jane Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('derives initials from a single-word name', () => {
    render(<Avatar name="Acme" />);
    expect(screen.getByText('AC')).toBeInTheDocument();
  });

  it('exposes role="img" with the name as accessible name', () => {
    render(<Avatar name="Jane Doe" />);
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument();
  });

  it('renders a custom fallback', () => {
    render(<Avatar name="Jane" fallback={<span>★</span>} />);
    expect(screen.getByText('★')).toBeInTheDocument();
  });

  it('renders a status dot with a visually-hidden label', () => {
    render(<Avatar name="Jane" status="online" />);
    expect(screen.getByText('online')).toBeInTheDocument();
  });

  it('forwards the ref to the root', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(<Avatar name="Jane" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('has no accessibility violations when named', async () => {
    const { container } = render(<Avatar name="Jane Doe" status="online" />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

describe('AvatarGroup', () => {
  it('renders up to max avatars then a +N overflow', () => {
    render(
      <AvatarGroup max={3}>
        <Avatar name="One Person" />
        <Avatar name="Two Person" />
        <Avatar name="Three Person" />
        <Avatar name="Four Person" />
        <Avatar name="Five Person" />
      </AvatarGroup>,
    );
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '2 more' })).toBeInTheDocument();
  });

  it('renders all avatars when under max', () => {
    render(
      <AvatarGroup max={5}>
        <Avatar name="One Person" />
        <Avatar name="Two Person" />
      </AvatarGroup>,
    );
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });
});
