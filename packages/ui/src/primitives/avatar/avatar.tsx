'use client';

import {
  Children,
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { UserIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { avatarVariants, avatarStatusVariants } from './avatar.variants';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

const AvatarGroupContext = createContext<{ size: AvatarSize } | null>(null);

const ICON_CLASS: Record<AvatarSize, string> = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-8',
};

/** First + last initial (or first two letters of a single word). */
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export interface AvatarProps
  extends Omit<ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>, 'children'> {
  /** Image URL. Falls back automatically when missing or it fails to load. */
  src?: string;
  /** Image alt text (defaults to `name`). */
  alt?: string;
  /** Provides the accessible name and derives the initials fallback. */
  name?: string;
  /** Override the fallback content (e.g. a custom icon). */
  fallback?: ReactNode;
  /** Box size (24–64px). Inherited from `AvatarGroup` when present. */
  size?: AvatarSize;
  /** `circle` (default) or `square`. */
  shape?: AvatarShape;
  /** Optional status dot. */
  status?: AvatarStatus;
}

/**
 * Avatar — an image with a graceful fallback (initials → user icon). Provide `name`/`alt` to make it
 * meaningful to assistive tech; otherwise it is treated as decorative. Spec: docs/components/avatar.md.
 */
export const Avatar = forwardRef<ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  function Avatar(
    { className, src, alt, name, fallback, size, shape = 'circle', status, ...props },
    ref,
  ) {
    const group = useContext(AvatarGroupContext);
    const resolvedSize = size ?? group?.size ?? 'md';
    const accessibleName = name ?? alt;
    const initials = name ? initialsFromName(name) : '';
    const fallbackContent =
      fallback ??
      (initials !== '' ? (
        initials
      ) : (
        <UserIcon className={ICON_CLASS[resolvedSize]} aria-hidden="true" />
      ));

    return (
      <span className="relative inline-flex shrink-0">
        <AvatarPrimitive.Root
          ref={ref}
          className={cn(
            avatarVariants({ size: resolvedSize, shape }),
            group && 'ring-2 ring-background',
            className,
          )}
          {...(accessibleName ? { role: 'img', 'aria-label': accessibleName } : {})}
          {...props}
        >
          {src ? (
            <AvatarPrimitive.Image
              src={src}
              alt=""
              className="aspect-square size-full object-cover"
            />
          ) : null}
          <AvatarPrimitive.Fallback
            className="flex size-full items-center justify-center"
            aria-hidden="true"
          >
            {fallbackContent}
          </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>
        {status ? (
          <>
            <span className={cn(avatarStatusVariants({ size: resolvedSize, status }))} aria-hidden="true" />
            <span className="sr-only">{status}</span>
          </>
        ) : null}
      </span>
    );
  },
);

export interface AvatarGroupProps extends ComponentPropsWithoutRef<'div'> {
  /** Show up to `max` avatars, then a trailing `+N`. Defaults to showing all. */
  max?: number;
  /** Size applied to all children. */
  size?: AvatarSize;
}

/** Overlapping stack of avatars with a `+N` overflow. Children inherit `size` via context. */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { className, children, max, size = 'md', ...props },
  ref,
) {
  const items = Children.toArray(children);
  const limit = max ?? items.length;
  const visible = items.slice(0, limit);
  const overflow = items.length - visible.length;

  return (
    <AvatarGroupContext.Provider value={{ size }}>
      <div ref={ref} className={cn('flex items-center -space-x-3', className)} {...props}>
        {visible}
        {overflow > 0 ? <Avatar name={`${overflow} more`} fallback={`+${overflow}`} /> : null}
      </div>
    </AvatarGroupContext.Provider>
  );
});
