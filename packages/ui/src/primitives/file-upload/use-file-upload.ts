'use client';

import { useRef, useState, type DragEvent } from 'react';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface UploadFile {
  /** Stable id for list keys / removal. */
  id: string;
  /** The underlying browser File. */
  file: File;
  /** Upload lifecycle status (parent-driven; defaults to `'pending'`). */
  status?: UploadStatus;
  /** Upload progress 0–100 (shown while `status === 'uploading'`). */
  progress?: number;
  /** Error message (shown while `status === 'error'`). */
  error?: string;
}

export type FileRejectionCode =
  | 'file-too-large'
  | 'file-too-small'
  | 'file-invalid-type'
  | 'too-many-files';

export interface FileRejection {
  file: File;
  errors: { code: FileRejectionCode; message: string }[];
}

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** Human-readable file size, e.g. `1536` → `"1.5 KB"`. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), UNITS.length - 1);
  const value = bytes / k ** i;
  return `${i === 0 ? value : value.toFixed(1)} ${UNITS[i] ?? 'B'}`;
}

/** Does `file` satisfy the HTML `accept` string (extensions, `type/*` wildcards, exact mime)? */
export function isFileAccepted(file: File, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(`${token.slice(0, token.indexOf('/'))}/`);
    return type === token;
  });
}

export interface UseFileUploadOptions {
  // `| undefined` is explicit so callers can spread optional props straight through under
  // exactOptionalPropertyTypes (passing `value={undefined}` etc. without conditional spreads).
  value?: UploadFile[] | undefined;
  defaultValue?: UploadFile[] | undefined;
  onChange?: ((files: UploadFile[]) => void) | undefined;
  onReject?: ((rejections: FileRejection[]) => void) | undefined;
  onRemove?: ((file: UploadFile) => void) | undefined;
  accept?: string | undefined;
  multiple?: boolean | undefined;
  maxFiles?: number | undefined;
  maxSize?: number | undefined;
  minSize?: number | undefined;
  disabled?: boolean | undefined;
}

export interface UseFileUploadReturn {
  /** Current list (controlled value or internal state). */
  files: UploadFile[];
  /** Files from the most recent add that failed validation. */
  rejections: FileRejection[];
  /** True while a drag is over the zone. */
  dragging: boolean;
  /** Validate + add files (from an input change or a drop). */
  addFiles: (incoming: FileList | File[]) => void;
  /** Remove a file by id. */
  remove: (id: string) => void;
  /** Drag handlers to spread on the drop target (depth-counted to avoid flicker). */
  dragHandlers: {
    onDragEnter: (event: DragEvent<HTMLElement>) => void;
    onDragOver: (event: DragEvent<HTMLElement>) => void;
    onDragLeave: (event: DragEvent<HTMLElement>) => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
  };
}

/**
 * Headless engine shared by File Upload and Image Upload: controlled/uncontrolled list state, client-side
 * validation (type via `accept`, `min`/`maxSize`, `maxFiles`), typed rejections, and depth-counted drag
 * state. Rendering (list vs. thumbnails) lives in the components. Spec: docs/components/file-upload.md.
 */
export function useFileUpload({
  value,
  defaultValue,
  onChange,
  onReject,
  onRemove,
  accept,
  multiple = true,
  maxFiles,
  maxSize,
  minSize,
  disabled = false,
}: UseFileUploadOptions): UseFileUploadReturn {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<UploadFile[]>(defaultValue ?? []);
  const files = isControlled ? value : internal;

  const [dragging, setDragging] = useState(false);
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const dragDepth = useRef(0);
  const idRef = useRef(0);
  const nextId = () => `file-${idRef.current++}`;

  const setFiles = (next: UploadFile[]) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const validate = (file: File): FileRejection['errors'] => {
    const errors: FileRejection['errors'] = [];
    if (accept && !isFileAccepted(file, accept)) {
      errors.push({ code: 'file-invalid-type', message: 'File type is not allowed.' });
    }
    if (maxSize !== undefined && file.size > maxSize) {
      errors.push({ code: 'file-too-large', message: `File is larger than ${formatBytes(maxSize)}.` });
    }
    if (minSize !== undefined && file.size < minSize) {
      errors.push({ code: 'file-too-small', message: `File is smaller than ${formatBytes(minSize)}.` });
    }
    return errors;
  };

  const addFiles = (incoming: FileList | File[]) => {
    if (disabled) return;
    const list = Array.from(incoming);
    if (list.length === 0) return;

    const accepted: UploadFile[] = [];
    const rejected: FileRejection[] = [];
    // Single mode replaces the current file → validate against an empty base, capacity 1.
    const base = multiple ? files : [];
    const cap = multiple ? maxFiles : 1;

    for (const file of list) {
      const errors = validate(file);
      if (cap !== undefined && base.length + accepted.length >= cap) {
        errors.push({
          code: 'too-many-files',
          message: cap === 1 ? 'Only one file is allowed.' : `No more than ${cap} files.`,
        });
      }
      if (errors.length > 0) rejected.push({ file, errors });
      else accepted.push({ id: nextId(), file, status: 'pending' });
    }

    if (accepted.length > 0) setFiles([...base, ...accepted]);
    setRejections(rejected);
    if (rejected.length > 0) onReject?.(rejected);
  };

  const remove = (id: string) => {
    const item = files.find((f) => f.id === id);
    setFiles(files.filter((f) => f.id !== id));
    if (item) onRemove?.(item);
  };

  const dragHandlers = {
    onDragEnter: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (disabled) return;
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      dragDepth.current -= 1;
      if (dragDepth.current <= 0) {
        dragDepth.current = 0;
        setDragging(false);
      }
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (!disabled && event.dataTransfer?.files) addFiles(event.dataTransfer.files);
    },
  };

  return { files, rejections, dragging, addFiles, remove, dragHandlers };
}
