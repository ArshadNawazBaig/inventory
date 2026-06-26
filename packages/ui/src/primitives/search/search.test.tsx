import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Search } from './search';

afterEach(() => {
  vi.useRealTimers();
});

describe('Search', () => {
  it('renders an accessible search field with the magnifier icon', () => {
    const { container } = render(<Search />);
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('fires onValueChange immediately but onSearch only after the debounce', () => {
    vi.useFakeTimers();
    const onValueChange = vi.fn();
    const onSearch = vi.fn();
    render(<Search onValueChange={onValueChange} onSearch={onSearch} debounce={300} />);
    const input = screen.getByRole('textbox', { name: 'Search' });

    fireEvent.change(input, { target: { value: 'widget' } });
    expect(onValueChange).toHaveBeenCalledWith('widget');
    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearch).toHaveBeenCalledWith('widget');
  });

  it('flushes onSearch immediately on Enter', () => {
    const onSearch = vi.fn();
    render(<Search onSearch={onSearch} />);
    const input = screen.getByRole('textbox', { name: 'Search' });
    fireEvent.change(input, { target: { value: 'sku-100' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSearch).toHaveBeenCalledWith('sku-100');
  });

  it('clears via the clear button and fires onSearch("")', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<Search defaultValue="abc" onSearch={onSearch} />);
    const input = screen.getByRole('textbox', { name: 'Search' });
    expect(input).toHaveValue('abc');

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(input).toHaveValue('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('clears on Escape', () => {
    render(<Search defaultValue="abc" />);
    const input = screen.getByRole('textbox', { name: 'Search' });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
  });

  it('focuses the field when the shortcut key is pressed', () => {
    render(<Search shortcut="/" />);
    const input = screen.getByRole('textbox', { name: 'Search' });
    expect(screen.getByText('/')).toBeInTheDocument(); // kbd hint while empty
    expect(input).not.toHaveFocus();

    fireEvent.keyDown(document.body, { key: '/' });
    expect(input).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Search defaultValue="abc" />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
