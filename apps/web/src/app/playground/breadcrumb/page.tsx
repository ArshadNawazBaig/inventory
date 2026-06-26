'use client';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from '@stockflow/ui';

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink asChild><Link href="/products">Products</Link></BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Wireless Mouse</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const PROPS: PropRow[] = [
  { name: '<Breadcrumb>', type: '<nav>', description: 'Navigation landmark; labelled "Breadcrumb" (override via aria-label).' },
  { name: '<BreadcrumbList>', type: '<ol>', description: 'The ordered list of crumbs and separators.' },
  { name: '<BreadcrumbItem>', type: '<li>', description: 'Wraps a link, the current page, or an ellipsis.' },
  { name: '<BreadcrumbLink> asChild', type: 'boolean', default: 'false', description: 'Navigable crumb; render onto a framework <Link>.' },
  { name: '<BreadcrumbPage>', type: '<span>', description: 'Current page — non-interactive, aria-current="page".' },
  { name: '<BreadcrumbSeparator>', type: '<li> + children?', description: 'Decorative divider; defaults to a chevron, pass children to override.' },
  { name: '<BreadcrumbEllipsis>', type: '<span>', description: 'Collapsed-crumbs marker; wrap in a DropdownMenu to expose hidden routes.' },
];

export default function BreadcrumbShowcase() {
  return (
    <ShowcasePage
      title="Breadcrumb"
      description="The location trail for the current page — a navigation landmark of links ending in the current page. Composable, server-renderable, token-driven. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Live demo">
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#home">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#inventory">Inventory</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#products">Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Wireless Mouse</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </Block>

      <Section title="Custom separator">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="#settings">Settings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      <Section title="Collapsed (ellipsis → dropdown)">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Show collapsed crumbs"
                  className="flex items-center rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <BreadcrumbEllipsis />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Inventory</DropdownMenuItem>
                  <DropdownMenuItem>Warehouses</DropdownMenuItem>
                  <DropdownMenuItem>Suppliers</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#products">Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Wireless Mouse</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              The last crumb is the <strong>current page</strong> — use{' '}
              <code className="font-mono">BreadcrumbPage</code> (not a link); it gets{' '}
              <code className="font-mono">aria-current=&quot;page&quot;</code>.
            </>,
            <>
              Use real links with <code className="font-mono">asChild</code> for every ancestor; the{' '}
              <code className="font-mono">&lt;nav&gt;</code> + <code className="font-mono">&lt;ol&gt;</code>{' '}
              give correct landmark + list semantics for free.
            </>,
            <>
              Separators are <strong>decorative</strong> (<code className="font-mono">aria-hidden</code>);
              to expose collapsed crumbs, wrap <code className="font-mono">BreadcrumbEllipsis</code> in a{' '}
              <code className="font-mono">DropdownMenu</code> as above.
            </>,
            'Keep it shallow — breadcrumbs reflect hierarchy, not history. Collapse long trails.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
