import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import {
  Navbar,
  NavbarActions,
  NavbarBrand,
  NavbarLink,
  NavbarNav,
  NavbarSpacer,
} from './navbar';

function BasicNavbar() {
  return (
    <Navbar>
      <NavbarBrand asChild>
        <a href="/">StockFlow</a>
      </NavbarBrand>
      <NavbarNav aria-label="Primary">
        <NavbarLink href="/dashboard" active aria-current="page">
          Dashboard
        </NavbarLink>
        <NavbarLink href="/products">Products</NavbarLink>
      </NavbarNav>
      <NavbarSpacer />
      <NavbarActions>
        <button type="button" aria-label="Notifications">
          N
        </button>
      </NavbarActions>
    </Navbar>
  );
}

describe('Navbar', () => {
  it('renders a banner landmark', () => {
    render(<BasicNavbar />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders a labelled navigation region', () => {
    render(<BasicNavbar />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });

  it('marks the active link with data-active', () => {
    render(<BasicNavbar />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('data-active', 'true');
  });

  it('renders the brand as a link via asChild', () => {
    render(<BasicNavbar />);
    expect(screen.getByRole('link', { name: 'StockFlow' })).toHaveAttribute('href', '/');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicNavbar />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
