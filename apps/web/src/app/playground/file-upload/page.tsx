'use client';

import { useRef, useState } from 'react';
import { FileUpload, type UploadFile } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { FileUpload, type UploadFile } from '@stockflow/ui';

const [files, setFiles] = useState<UploadFile[]>([]);

<FileUpload
  value={files}
  onChange={setFiles}
  accept=".csv,.xlsx"
  maxSize={5 * 1024 * 1024}
  maxFiles={3}
/>;
// then upload each file (e.g. Cloudinary) and write back status/progress on \`files\``;

const PROPS: PropRow[] = [
  { name: 'value / onChange', type: 'UploadFile[] / fn', description: 'Controlled list (UploadFile = File + id + status/progress). Omit for uncontrolled.' },
  { name: 'onReject / onRemove', type: 'fn', description: 'Files that failed validation · a row removed.' },
  { name: 'accept', type: 'string', description: 'HTML accept — extensions, type/* wildcards, exact mimes.' },
  { name: 'multiple', type: 'boolean', default: 'true', description: 'Allow many files (else each selection replaces the last).' },
  { name: 'maxFiles', type: 'number', description: 'Cap on the number of files (multiple only).' },
  { name: 'maxSize / minSize', type: 'number (bytes)', description: 'Per-file size bounds.' },
  { name: 'disabled / invalid', type: 'boolean', default: 'false', description: 'Disable interaction · error skin.' },
  { name: 'label / description', type: 'ReactNode', description: 'Dropzone primary + hint text (hint defaults from accept/size).' },
];

/** A File with a controllable size, for the static demo. */
function makeFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

export default function FileUploadShowcase() {
  // Interactive demo: simulate uploading each newly-added file → progress → success.
  const [files, setFiles] = useState<UploadFile[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const simulate = (item: UploadFile) => {
    let progress = 0;
    setFiles((cur) => cur.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 0 } : f)));
    timers.current[item.id] = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(timers.current[item.id]);
        delete timers.current[item.id];
        setFiles((cur) => cur.map((f) => (f.id === item.id ? { ...f, status: 'success', progress: 100 } : f)));
      } else {
        setFiles((cur) => cur.map((f) => (f.id === item.id ? { ...f, progress } : f)));
      }
    }, 250);
  };

  const handleChange = (next: UploadFile[]) => {
    setFiles(next);
    next.filter((f) => (f.status ?? 'pending') === 'pending').forEach(simulate);
  };

  return (
    <ShowcasePage
      title="File Upload"
      description="A drag-and-drop dropzone (also click/keyboard to browse) built on native APIs — no react-dropzone. It validates type/size/count up front and renders a removable list with per-file status. It never uploads: the parent drives that (e.g. Cloudinary) and writes back status/progress. Toggle dark mode from the navbar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Live (simulated upload)">
        <FileUpload
          value={files}
          onChange={handleChange}
          accept=".csv,.xlsx,.pdf,image/*"
          maxSize={10 * 1024 * 1024}
          maxFiles={5}
          className="max-w-xl"
        />
        <p className="text-sm text-muted-foreground">
          Drop or browse — each file ramps a progress bar, then resolves to success. Try an over-10 MB file
          or a disallowed type to see rejections.
        </p>
      </Block>

      <div className="grid gap-8 lg:grid-cols-2">
        <Block title="Single file (PDF)">
          <SingleDemo />
        </Block>

        <Block title="Disabled">
          <FileUpload disabled className="max-w-md" />
        </Block>
      </div>

      <Section title="Upload states (static)">
        <FileUpload
          className="w-full max-w-xl"
          value={[
            { id: '1', file: makeFile('products.csv', 'text/csv', 1024 * 200), status: 'success' },
            { id: '2', file: makeFile('images.zip', 'application/zip', 1024 * 1024 * 8), status: 'uploading', progress: 64 },
            { id: '3', file: makeFile('broken.xlsx', 'application/vnd.ms-excel', 1024 * 40), status: 'error', error: 'Network error — retry.' },
          ]}
          onChange={() => {}}
        />
      </Section>

      <Section title="Props">
        <PropsTable rows={PROPS} />
      </Section>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Constrain up front with <code className="font-mono">accept</code>,{' '}
              <code className="font-mono">maxSize</code>, and{' '}
              <code className="font-mono">maxFiles</code> — don’t validate after selection.
            </>,
            <>
              Keep <code className="font-mono">value</code> controlled so you can write back{' '}
              <code className="font-mono">status</code>/<code className="font-mono">progress</code> as the
              upload runs.
            </>,
            'For avatars and product images (preview, crop), use the Image Upload component instead.',
            <>
              <strong>Never trust client validation</strong> — re-check size, type, and scan server-side
              before persisting to Cloudinary.
            </>,
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}

function SingleDemo() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  return (
    <FileUpload
      value={files}
      onChange={setFiles}
      multiple={false}
      accept="application/pdf"
      label="Attach one PDF"
      className="max-w-md"
    />
  );
}
