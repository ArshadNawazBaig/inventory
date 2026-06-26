'use client';

import { useEffect, useId, useState, type ChangeEvent, type ReactNode } from 'react';
import { ImageIcon, Plus, XIcon, Loader2, ErrorIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import {
  formatBytes,
  useFileUpload,
  type FileRejection,
  type UploadFile,
} from '../file-upload/use-file-upload';

export interface ImageUploadProps {
  /** Controlled list of selected images. */
  value?: UploadFile[];
  /** Initial list for uncontrolled usage. */
  defaultValue?: UploadFile[];
  /** Fires with the full accepted list after an add or remove. */
  onChange?: (files: UploadFile[]) => void;
  /** Fires with files that failed validation (not added). */
  onReject?: (rejections: FileRejection[]) => void;
  /** Fires when an image is removed. */
  onRemove?: (file: UploadFile) => void;
  /** HTML accept string. Defaults to `'image/*'`. */
  accept?: string;
  /** Allow selecting more than one image. */
  multiple?: boolean;
  /** Max number of images (multiple only). */
  maxFiles?: number;
  /** Max size per image, in bytes. */
  maxSize?: number;
  /** Min size per image, in bytes. */
  minSize?: number;
  /** Disable browsing and dropping. */
  disabled?: boolean;
  /** Error skin. */
  invalid?: boolean;
  /** Preview shape — `circle` for avatars. */
  shape?: 'rectangle' | 'circle';
  /** Primary line inside the empty single dropzone. */
  label?: ReactNode;
  /** Hint line (defaults from `accept`/`maxSize`/`maxFiles`). */
  description?: ReactNode;
  /** Layout overrides on the root. */
  className?: string;
  /** Accessible name for the file input. */
  'aria-label'?: string;
}

/**
 * Object-URL previews for image files, created and revoked inside an effect keyed on `files` — released on
 * removal and unmount (StrictMode-safe; no leaks). Returns a map of file id → blob URL.
 */
function useImagePreviews(files: UploadFile[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const item of files) {
      if (item.file.type.startsWith('image/')) next[item.id] = URL.createObjectURL(item.file);
    }
    setUrls(next);
    return () => {
      for (const url of Object.values(next)) URL.revokeObjectURL(url);
    };
  }, [files]);
  return urls;
}

const tileBase = 'relative size-24 shrink-0 overflow-hidden border border-border bg-muted';
const removeButton = cn(
  'absolute right-1 top-1 z-10 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-colors',
  'hover:bg-background',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'disabled:pointer-events-none disabled:opacity-50',
);

function StatusOverlay({ item }: { item: UploadFile }) {
  const status = item.status ?? 'pending';
  if (status === 'uploading') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/70">
        <Loader2 className="size-5 animate-spin text-foreground" aria-hidden="true" />
        {item.progress !== undefined ? (
          <span
            role="progressbar"
            aria-valuenow={Math.round(item.progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="text-xs font-medium text-foreground"
          >
            {Math.round(item.progress)}%
          </span>
        ) : null}
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-destructive/25"
        title={item.error}
      >
        <ErrorIcon className="size-6 text-destructive" aria-hidden="true" />
        {item.error ? <span className="sr-only">{item.error}</span> : null}
      </div>
    );
  }
  return null;
}

/**
 * ImageUpload — the visual sibling of FileUpload (shares `useFileUpload`): a drag-and-drop image picker
 * with live thumbnail previews. Renders a gallery grid (multiple) with an add tile, or a single
 * avatar/cover preview (`shape="circle"`). Transport-agnostic — the parent uploads (e.g. Cloudinary) and
 * writes back status. Spec: docs/components/image-upload.md.
 */
export function ImageUpload({
  value,
  defaultValue,
  onChange,
  onReject,
  onRemove,
  accept = 'image/*',
  multiple = true,
  maxFiles,
  maxSize,
  minSize,
  disabled = false,
  invalid = false,
  shape = 'rectangle',
  label,
  description,
  className,
  'aria-label': ariaLabel,
}: ImageUploadProps) {
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

  const previews = useImagePreviews(files);
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
  const name = ariaLabel ?? (multiple ? 'Upload images' : 'Upload image');

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = '';
  };

  const fileInput = (
    <input
      id={inputId}
      type="file"
      className="sr-only"
      aria-label={name}
      aria-invalid={invalid || undefined}
      aria-describedby={rejections.length > 0 ? errorsId : undefined}
      disabled={disabled}
      multiple={multiple}
      accept={accept}
      onChange={handleInputChange}
    />
  );

  const hintParts: string[] = [accept === 'image/*' ? 'Images' : accept];
  if (maxSize !== undefined) hintParts.push(`up to ${formatBytes(maxSize)}`);
  if (multiple && maxFiles !== undefined) hintParts.push(`${files.length}/${maxFiles}`);
  const hint = description ?? hintParts.join(' · ');

  const rejectionAlert =
    rejections.length > 0 ? (
      <ul id={errorsId} role="alert" className="space-y-1 text-xs text-destructive">
        {rejections.map((rejection, i) => (
          <li key={`${rejection.file.name}-${i}`}>
            <span className="font-medium">{rejection.file.name}</span>:{' '}
            {rejection.errors.map((e) => e.message).join(' ')}
          </li>
        ))}
      </ul>
    ) : null;

  // ── Single (avatar / cover) ───────────────────────────────────────────────
  if (!multiple) {
    const item = files[0];
    const url = item ? previews[item.id] : undefined;
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <div className="relative h-40 w-40">
          <label
            htmlFor={inputId}
            data-dragging={dragging || undefined}
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            {...dragHandlers}
            className={cn(
              'flex size-full cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden border-2 border-dashed border-input bg-background text-center text-muted-foreground transition-colors',
              radius,
              'hover:bg-accent/40',
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
              'data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5',
              'data-[invalid=true]:border-destructive',
              'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60',
            )}
          >
            {fileInput}
            {item && url ? (
              <img
                src={url}
                alt={item.file.name}
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <>
                <ImageIcon className="size-7" aria-hidden="true" />
                <span className="px-2 text-xs font-medium">
                  {label ?? 'Click or drag an image'}
                </span>
              </>
            )}
            {item ? <StatusOverlay item={item} /> : null}
          </label>
          {item && !disabled ? (
            <button
              type="button"
              aria-label={`Remove ${item.file.name}`}
              onClick={() => remove(item.id)}
              className={removeButton}
            >
              <XIcon className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {rejectionAlert}
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    );
  }

  // ── Multiple (gallery) ────────────────────────────────────────────────────
  const canAdd = !disabled && (maxFiles === undefined || files.length < maxFiles);
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        data-dragging={dragging || undefined}
        {...dragHandlers}
        className={cn(
          'rounded-lg transition-colors',
          dragging &&
            'ring-2 ring-primary ring-offset-2 ring-offset-background data-[dragging=true]:bg-primary/5',
        )}
      >
        <div className="flex flex-wrap gap-3">
          {files.map((item) => {
            const url = previews[item.id];
            return (
              <div key={item.id} className={cn(tileBase, radius)}>
                {url ? (
                  <img src={url} alt={item.file.name} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
                <StatusOverlay item={item} />
                {!disabled ? (
                  <button
                    type="button"
                    aria-label={`Remove ${item.file.name}`}
                    onClick={() => remove(item.id)}
                    className={removeButton}
                  >
                    <XIcon className="size-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            );
          })}

          {canAdd ? (
            <label
              htmlFor={inputId}
              data-dragging={dragging || undefined}
              data-invalid={invalid || undefined}
              className={cn(
                'flex size-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-input text-muted-foreground transition-colors',
                radius,
                'hover:bg-accent/40',
                'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
                'data-[dragging=true]:border-primary',
                'data-[invalid=true]:border-destructive',
              )}
            >
              {fileInput}
              <Plus className="size-5" aria-hidden="true" />
              <span className="text-xs font-medium">Add</span>
            </label>
          ) : null}
        </div>
      </div>
      {rejectionAlert}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
