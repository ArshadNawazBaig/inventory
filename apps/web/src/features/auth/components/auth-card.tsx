import type { ReactNode } from 'react';
import { APP } from '@stockflow/config';
import { Card, CardContent, CardHeader, CardTitle } from '@stockflow/ui';

/** Shared chrome for the unauthenticated auth pages — brand mark + titled card + optional footer link. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          SF
        </span>
        <span className="text-lg font-semibold tracking-tight text-foreground">{APP.name}</span>
      </div>
      <Card>
        <CardHeader className="gap-1 text-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
