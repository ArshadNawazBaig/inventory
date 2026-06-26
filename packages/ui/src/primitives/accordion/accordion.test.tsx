import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

function SingleAccordion() {
  return (
    <Accordion type="single" collapsible defaultValue="shipping">
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Ships in 2–3 business days.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>Return within 30 days.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('renders triggers as buttons inside headings', () => {
    render(<SingleAccordion />);
    expect(screen.getByRole('button', { name: 'Shipping' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Returns' })).toBeInTheDocument();
  });

  it('shows the default-open panel and keeps others collapsed', () => {
    render(<SingleAccordion />);
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Ships in 2–3 business days.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Returns' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText('Return within 30 days.')).not.toBeInTheDocument();
  });

  it('toggles a panel closed when clicked (collapsible single)', async () => {
    render(<SingleAccordion />);
    await userEvent.click(screen.getByRole('button', { name: 'Shipping' }));
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('collapses the open item when another opens (single)', async () => {
    render(<SingleAccordion />);
    await userEvent.click(screen.getByRole('button', { name: 'Returns' }));
    expect(screen.getByRole('button', { name: 'Returns' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByText('Return within 30 days.')).toBeInTheDocument();
  });

  it('allows multiple panels open with type="multiple"', async () => {
    render(
      <Accordion type="multiple" defaultValue={['a']}>
        <AccordionItem value="a">
          <AccordionTrigger>First</AccordionTrigger>
          <AccordionContent>Panel A</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Second</AccordionTrigger>
          <AccordionContent>Panel B</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Second' }));
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SingleAccordion />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
