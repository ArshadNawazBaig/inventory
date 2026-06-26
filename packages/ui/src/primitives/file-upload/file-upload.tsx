'use client';

import {
  useId,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import {
  FileIcon,
  UploadCloudIcon,
  SuccessIcon,
  ErrorIcon,
  XIcon,
  Loader2,
} from '@stockflow/icons';
import { cn } from '../../lib/cn';

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

export interface FileUploadProps {
  /** Controlled list of selected files. */
  value?: UploadFile[];
  /** Initial list for uncontrolled usage. */
  defaultValue?: UploadFile[];
  /** Fires with the full accepted list after an add or remove. */
  onChange?: (files: UploadFile[]) => void;
  /** Fires with files that failed validation (not added). */
  onReject?: (rejections: FileRejection[]) => void;
  /** Fires when a row is removed. */
  onRemove?: (file: UploadFile) => void;
  /** HTML accept string, e.g. `"image/*,.pdf,.csv"`. */
  accept?: string;
  /** Allow selecting more than one file. */
  multiple?: boolean;
  /** Max number of files (multiple only). */
  maxFiles?: number;
  /** Max size per file, in bytes. */
  maxSize?: number;
  /** Min size per file, in bytes. */
  minSize?: number;
  /** Disable browsing and dropping. */
  disabled?: boolean;
  /** Error skin (e.g. a form-level required violation). */
  invalid?: boolean;
  /** Primary line inside the dropzone. */
  label?: ReactNode;
  /** Hint line inside the dropzone (defaults from `accept`/`maxSize`). */
  description?: ReactNode;
  /** Layout overrides on the root. */
  className?: string;
  /** Accessible name for the file input. */
  'aria-label'?: string;
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
function isAccepted(file: File, accept: string): boolean {
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

const statusIcon = {
  pending: null,
  uploading: <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />,
  success: <SuccessIcon className="size-4 shrink-0 text-success" aria-hidden="true" />,
  error: <ErrorIcon className="size-4 shrink-0 text-destructive" aria-hidden="true" />,
} satisfies Record<UploadStatus, ReactNode>;

/**
 * FileUpload — a token-skinned drag-and-drop dropzone (also click/keyboard to browse) that collects and
 * validates files (type/size/count) and renders a removable list with per-file status/progress. Transport
 * agnostic: the parent performs the upload (e.g. Cloudinary) and feeds back status. Spec:
 * docs/components/file-upload.md.
 */
export function FileUpload({
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
  invalid = false,
  label,
  description,
  className,
  'aria-label': ariaLabel = 'Upload files',
}: FileUploadProps) {
  const inputId = useId();
  const errorsId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepth = useRef(0);

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<UploadFile[]>(defaultValue ?? []);
  const files = isControlled ? value : internal;

  const [dragging, setDragging] = useState(false);
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const idRef = useRef(0);
  const nextId = () => `file-${idRef.current++}`;

  const setFiles = (next: UploadFile[]) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const validate = (file: File): FileRejection['errors'] => {
    const errors: FileRejection['errors'] = [];
    if (accept && !isAccepted(file, accept)) {
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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    // Reset so selecting the same file again re-fires change.
    event.target.value = '';
  };

  const handleDragEnter = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setDragging(true);
  };
  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };
  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  };
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (!disabled && event.dataTransfer?.files) addFiles(event.dataTransfer.files);
  };

  const hintParts: string[] = [];
  if (accept) hintParts.push(accept);
  if (maxSize !== undefined) hintParts.push(`up to ${formatBytes(maxSize)}`);
  const defaultDescription = hintParts.length > 0 ? hintParts.join(' · ') : 'Any file type';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <label
        htmlFor={inputId}
        data-dragging={dragging || undefined}
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-background p-6 text-center transition-colors',
          'cursor-pointer hover:bg-accent/40',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
          'data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5',
          'data-[invalid=true]:border-destructive',
          'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60 data-[disabled=true]:hover:bg-background',
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={rejections.length > 0 ? errorsId : undefined}
          disabled={disabled}
          multiple={multiple}
          {...(accept ? { accept } : {})}
          onChange={handleInputChange}
        />
        <UploadCloudIcon className="size-8 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            {label ?? (
              <>
                <span className="text-primary">Click to upload</span> or drag and drop
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{description ?? defaultDescription}</p>
        </div>
      </label>

      {rejections.length > 0 ? (
        <ul id={errorsId} role="alert" className="space-y-1 text-xs text-destructive">
          {rejections.map((rejection, i) => (
            <li key={`${rejection.file.name}-${i}`}>
              <span className="font-medium">{rejection.file.name}</span>:{' '}
              {rejection.errors.map((e) => e.message).join(' ')}
            </li>
          ))}
        </ul>
      ) : null}

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((item) => {
            const status = item.status ?? 'pending';
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-md border border-border bg-card p-2.5 text-card-foreground"
              >
                <FileIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{item.file.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {formatBytes(item.file.size)}
                    </span>
                  </div>
                  {status === 'uploading' && item.progress !== undefined ? (
                    <div
                      role="progressbar"
                      aria-valuenow={Math.round(item.progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                      />
                    </div>
                  ) : null}
                  {status === 'error' && item.error ? (
                    <p className="mt-0.5 text-xs text-destructive">{item.error}</p>
                  ) : null}
                </div>
                {statusIcon[status]}
                <button
                  type="button"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() => remove(item.id)}
                  disabled={disabled}
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors',
                    'hover:bg-accent hover:text-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'disabled:pointer-events-none disabled:opacity-50',
                  )}
                >
                  <XIcon className="size-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
