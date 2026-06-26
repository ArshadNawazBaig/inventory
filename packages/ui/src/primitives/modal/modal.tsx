'use client';

import { type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogSize,
} from '../dialog';

export interface ModalProps {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Called when the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** A single element used to open the modal (wrapped in DialogTrigger `asChild`). */
  trigger?: ReactNode;
  /** Accessible name — required. */
  title: ReactNode;
  /** Supporting text under the title. */
  description?: ReactNode;
  /** Max-width of the surface. */
  size?: DialogSize;
  /** Render the ✕ close button (default true). */
  showClose?: boolean;
  /** Footer actions (e.g. Cancel / Save). */
  footer?: ReactNode;
  /** Body content. */
  children?: ReactNode;
}

/**
 * Modal — a prop-driven preset over {@link Dialog} for the common "title + body + actions" case.
 * Adds no overlay logic; use Dialog parts directly when you need custom structure.
 * Spec: docs/components/modal.md.
 */
export function Modal({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  size,
  showClose,
  footer,
  children,
}: ModalProps) {
  return (
    <Dialog
      {...(open !== undefined ? { open } : {})}
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        {...(size ? { size } : {})}
        {...(showClose !== undefined ? { showClose } : {})}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
