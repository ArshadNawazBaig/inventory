'use client';

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from '@stockflow/ui';

<Card>
  <CardHeader>
    <CardTitle>Wireless Mouse</CardTitle>
    <CardDescription>SKU-001 · Accessories</CardDescription>
  </CardHeader>
  <CardContent>120 units in stock</CardContent>
  <CardFooter className="justify-end">
    <Button variant="outline" size="sm">Edit</Button>
    <Button size="sm">View</Button>
  </CardFooter>
</Card>

// Clickable card — render a real <a> so it's focusable + keyboard-operable
<Card asChild interactive>
  <a href="/products/1">…</a>
</Card>`;

const PROPS: PropRow[] = [
  { name: 'variant', type: "'default' | 'elevated' | 'ghost'", default: "'default'", description: 'Surface: bordered, shadow, or transparent.' },
  { name: 'interactive', type: 'boolean', default: 'false', description: 'Hover/focus affordance for clickable cards.' },
  { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the surface onto a child (e.g. an <a>).' },
  { name: 'Parts', type: 'CardHeader · CardTitle · CardDescription · CardContent · CardFooter', description: 'Composable sections; each forwards ref + merges className.' },
];

export default function CardShowcase() {
  return (
    <ShowcasePage
      title="Card"
      description="The canonical composable surface (bg-card). Toggle dark mode from the sidebar — it's one step lighter than the page so nested controls read correctly."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Variants">
        <div className="grid gap-4 sm:grid-cols-3">
          {(['default', 'elevated', 'ghost'] as const).map((variant) => (
            <Card key={variant} variant={variant}>
              <CardHeader>
                <CardTitle className="capitalize">{variant}</CardTitle>
                <CardDescription>variant=&quot;{variant}&quot;</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                A {variant} surface.
              </CardContent>
            </Card>
          ))}
        </div>
      </Block>

      <Block title="Composition (with Badge, Avatar, Button)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>USB-C Cable</CardTitle>
                <Badge tone="warning" dot>
                  Low stock
                </Badge>
              </div>
              <CardDescription>SKU-114 · Cables</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              8 units left across 2 warehouses — reorder soon.
            </CardContent>
            <CardFooter className="justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar size="sm" name="Jane Doe" /> Jane Doe
              </span>
              <Button size="sm">Reorder</Button>
            </CardFooter>
          </Card>

          <Card asChild interactive>
            <a href="#product">
              <CardHeader>
                <CardTitle>Clickable card</CardTitle>
                <CardDescription>Renders a real anchor via asChild</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                The whole card is a focusable link — hover and tab to it.
              </CardContent>
            </a>
          </Card>
        </div>
      </Block>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Compose with the parts (<code className="font-mono">CardHeader</code>/
              <code className="font-mono">Title</code>/<code className="font-mono">Description</code>/
              <code className="font-mono">Content</code>/<code className="font-mono">Footer</code>) rather
              than a monolithic prop set.
            </>,
            <>
              For a clickable card use <code className="font-mono">asChild</code> +{' '}
              <code className="font-mono">interactive</code> so it’s a real focusable{' '}
              <code className="font-mono">&lt;a&gt;</code>/<code className="font-mono">&lt;button&gt;</code>{' '}
              — never an <code className="font-mono">onClick</code> on a bare div.
            </>,
            <>
              <code className="font-mono">bg-card</code> is the surface nested controls expect — a default
              Input on a Card reads as a well; use the <code className="font-mono">filled</code> Input on
              the bare page.
            </>,
            'Use ghost to group content without a visible surface; keep one clear primary action per card.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
