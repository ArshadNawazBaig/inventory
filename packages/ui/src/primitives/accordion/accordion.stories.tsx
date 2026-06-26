import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

const meta: Meta<typeof Accordion> = {
  title: 'Navigation/Accordion',
  component: Accordion,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Accordion>;

export const Single: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="what" className="w-[28rem]">
      <AccordionItem value="what">
        <AccordionTrigger>What is StockFlow?</AccordionTrigger>
        <AccordionContent>
          An enterprise inventory management platform built on an immutable stock ledger.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="track">
        <AccordionTrigger>How is stock tracked?</AccordionTrigger>
        <AccordionContent>
          Every change is a ledger entry; on-hand quantities are projections of that ledger.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="multi">
        <AccordionTrigger>Is it multi-tenant?</AccordionTrigger>
        <AccordionContent>
          Yes — every record is scoped to an organization for hard tenant isolation.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['a', 'b']} className="w-[28rem]">
      <AccordionItem value="a">
        <AccordionTrigger>Section A</AccordionTrigger>
        <AccordionContent>Both sections can stay open at once.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Section B</AccordionTrigger>
        <AccordionContent>Useful for reference content.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="c">
        <AccordionTrigger>Section C</AccordionTrigger>
        <AccordionContent>Closed by default.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const WithDisabledItem: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[28rem]">
      <AccordionItem value="open">
        <AccordionTrigger>Available</AccordionTrigger>
        <AccordionContent>This section can be opened.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="locked">
        <AccordionTrigger disabled>Locked</AccordionTrigger>
        <AccordionContent>You won’t see this.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
