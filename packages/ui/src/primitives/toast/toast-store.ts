'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import type { ToastTone } from './toast.variants';

/** A toast action button (e.g. "Undo"). `altText` is the screen-reader alternative Radix requires. */
export interface ToastActionConfig {
  label: string;
  onClick: () => void;
  altText?: string;
}

export interface ToastOptions {
  description?: ReactNode;
  /** Auto-dismiss after this many ms (default from `<Toaster duration>`); `Infinity` keeps it sticky. */
  duration?: number;
  action?: ToastActionConfig;
  /** Override tone on the base `toast()` (convenience methods set their own). */
  tone?: ToastTone;
  /** Supply to dedupe / replace an existing toast. */
  id?: string;
}

export interface ToastItem {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  tone: ToastTone;
  duration?: number;
  action?: ToastActionConfig;
  /** Controlled open — set false to play the exit animation before removal. */
  open: boolean;
}

const TOAST_LIMIT = 5;
const REMOVE_DELAY = 200; // ms — lets the exit animation play before the item leaves the store

let toasts: ToastItem[] = [];
const EMPTY: ToastItem[] = [];
const listeners = new Set<() => void>();
const removeTimers = new Map<string, ReturnType<typeof setTimeout>>();
let counter = 0;

function emit() {
  for (const listener of listeners) listener();
}

function setToasts(next: ToastItem[]) {
  toasts = next;
  emit();
}

function scheduleRemove(id: string) {
  if (removeTimers.has(id)) return;
  const timer = setTimeout(() => {
    removeTimers.delete(id);
    setToasts(toasts.filter((t) => t.id !== id));
  }, REMOVE_DELAY);
  removeTimers.set(id, timer);
}

function create(title: ReactNode, options: ToastOptions = {}, tone: ToastTone = 'default'): string {
  const id = options.id ?? `toast-${++counter}`;
  const item: ToastItem = {
    id,
    title,
    description: options.description,
    tone: options.tone ?? tone,
    open: true,
    ...(options.duration !== undefined ? { duration: options.duration } : {}),
    ...(options.action !== undefined ? { action: options.action } : {}),
  };
  const exists = toasts.some((t) => t.id === id);
  let next = exists ? toasts.map((t) => (t.id === id ? item : t)) : [...toasts, item];
  if (next.length > TOAST_LIMIT) next = next.slice(next.length - TOAST_LIMIT);
  setToasts(next);
  return id;
}

/** Dismiss one toast (animated), or all when `id` is omitted. */
export function dismissToast(id?: string) {
  for (const t of toasts) {
    if (id === undefined || t.id === id) scheduleRemove(t.id);
  }
  setToasts(toasts.map((t) => (id === undefined || t.id === id ? { ...t, open: false } : t)));
}

/** Hard reset — clears timers and toasts synchronously (e.g. route change / logout). */
export function clearToasts() {
  for (const timer of removeTimers.values()) clearTimeout(timer);
  removeTimers.clear();
  setToasts([]);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function getSnapshot() {
  return toasts;
}
function getServerSnapshot() {
  return EMPTY;
}

/** Subscribe a `<Toaster>` to the toast queue. */
export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export interface ToastApi {
  (title: ReactNode, options?: ToastOptions): string;
  success: (title: ReactNode, options?: ToastOptions) => string;
  error: (title: ReactNode, options?: ToastOptions) => string;
  warning: (title: ReactNode, options?: ToastOptions) => string;
  info: (title: ReactNode, options?: ToastOptions) => string;
  dismiss: (id?: string) => void;
}

/** Imperative toast API — call from anywhere; render with a single mounted `<Toaster />`. */
export const toast: ToastApi = Object.assign(
  (title: ReactNode, options?: ToastOptions) => create(title, options, 'default'),
  {
    success: (title: ReactNode, options?: ToastOptions) => create(title, options, 'success'),
    error: (title: ReactNode, options?: ToastOptions) => create(title, options, 'error'),
    warning: (title: ReactNode, options?: ToastOptions) => create(title, options, 'warning'),
    info: (title: ReactNode, options?: ToastOptions) => create(title, options, 'info'),
    dismiss: dismissToast,
  },
);
