'use client';

import { useId, type ChangeEvent, type ReactNode } from 'react';
import { FileIcon, UploadCloudIcon, SuccessIcon, ErrorIcon, XIcon, Loader2 } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import {
  formatBytes,
  useFileUpload,
  type FileRejection,
  type UploadFile,
  type UploadStatus,
} from './use-file-upload';

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

  const { files, rejections, dragging, addFiles, remove, dragHandlers } = useFileUpload({
    value,
    defaultValue,
    onChange,
    onReject,
    onRemove,
    accept,
    multiple,
    maxFiles,
    maxSize,
    minSize,
    disabled,
  });

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = ''; // reset so re-selecting the same file re-fires change
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
        {...dragHandlers}
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
