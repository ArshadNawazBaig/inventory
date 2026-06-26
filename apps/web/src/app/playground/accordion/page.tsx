'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@stockflow/ui';

<Accordion type="single" collapsible defaultValue="shipping">
  <AccordionItem value="shipping">
    <AccordionTrigger>Shipping</AccordionTrigger>
    <AccordionContent>Ships in 2–3 business days.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <AccordionTrigger>Returns</AccordionTrigger>
    <AccordionContent>Return within 30 days.</AccordionContent>
  </AccordionItem>
</Accordion>`;

const PROPS: PropRow[] = [
  { name: '<Accordion> type', type: "'single' | 'multiple'", description: 'One section at a time, or many. Required.' },
  { name: '<Accordion> collapsible', type: 'boolean', default: 'false', description: '(single only) Allow closing the open section.' },
  { name: '<Accordion> value / defaultValue / onValueChange', type: 'string | string[] / … / fn', description: 'Open item(s) — controlled or uncontrolled.' },
  { name: '<AccordionItem> value / disabled', type: 'string / boolean', description: 'Section id; disable an individual section.' },
  { name: '<AccordionTrigger>', type: 'button', description: 'Header toggle (rendered inside an <h3>); chevron rotates on open.' },
  { name: '<AccordionContent>', type: 'region', description: 'Collapsible panel; height-animated (respects reduced-motion).' },
];

const cardClass = 'rounded-xl border border-border bg-card px-4 text-card-foreground';

export default function AccordionShowcase() {
  return (
    <ShowcasePage
      title="Accordion"
      description="Stacked, collapsible sections for progressive disclosure (FAQs, settings groups, detail panels). Radix-backed, height-animated, token-skinned. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Section title="Single (one open at a time)">
        <Accordion
          type="single"
          collapsible
          defaultValue="what"
          className={`w-full max-w-lg ${cardClass}`}
        >
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
          <AccordionItem value="multi" className="border-b-0">
            <AccordionTrigger>Is it multi-tenant?</AccordionTrigger>
            <AccordionContent>
              Yes — every record is scoped to an organization for hard tenant isolation.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="Multiple (independent sections)">
        <Accordion
          type="multiple"
          defaultValue={['a']}
          className={`w-full max-w-lg ${cardClass}`}
        >
          <AccordionItem value="a">
            <AccordionTrigger>Dimensions</AccordionTrigger>
            <AccordionContent>Width, height, depth and weight per variant.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Pricing</AccordionTrigger>
            <AccordionContent>Cost, price and margin by currency.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="c" className="border-b-0">
            <AccordionTrigger>Suppliers</AccordionTrigger>
            <AccordionContent>Preferred supplier, lead time and MOQ.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="Disabled section">
        <Accordion type="single" collapsible className={`w-full max-w-lg ${cardClass}`}>
          <AccordionItem value="open">
            <AccordionTrigger>Available</AccordionTrigger>
            <AccordionContent>This section can be opened.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="locked" className="border-b-0">
            <AccordionTrigger disabled>Locked (insufficient permissions)</AccordionTrigger>
            <AccordionContent>Hidden behind a disabled trigger.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Choose <code className="font-mono">type</code> by intent — <strong>single</strong> for
              mutually-exclusive sections (add <code className="font-mono">collapsible</code> to allow
              all-closed), <strong>multiple</strong> for independent reference content.
            </>,
            <>
              Radix renders each trigger inside a heading and wires{' '}
              <code className="font-mono">aria-expanded</code> /{' '}
              <code className="font-mono">aria-controls</code> — keyboard and screen-reader support are
              built in.
            </>,
            <>
              The chevron rotates with state and the panel height-animates; both honour{' '}
              <code className="font-mono">prefers-reduced-motion</code>.
            </>,
            'Use for progressive disclosure of peer sections — not as a substitute for tabs (peer views) or a multi-step flow (stepper).',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
