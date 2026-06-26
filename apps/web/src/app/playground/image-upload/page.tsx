'use client';

import { useState } from 'react';
import { ImageUpload, type UploadFile } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { ImageUpload, type UploadFile } from '@stockflow/ui';

// Product gallery
const [images, setImages] = useState<UploadFile[]>([]);
<ImageUpload value={images} onChange={setImages} maxFiles={6} maxSize={5 * 1024 * 1024} />;

// Avatar
<ImageUpload multiple={false} shape="circle" value={avatar} onChange={setAvatar} />;`;

const PROPS: PropRow[] = [
  { name: 'value / onChange', type: 'UploadFile[] / fn', description: 'Controlled list (UploadFile = File + id + status). Omit for uncontrolled.' },
  { name: 'onReject / onRemove', type: 'fn', description: 'Files that failed validation · an image removed.' },
  { name: 'accept', type: 'string', default: "'image/*'", description: 'Restrict types (e.g. image/png,image/jpeg).' },
  { name: 'multiple', type: 'boolean', default: 'true', description: 'Gallery (true) vs single avatar/cover (false).' },
  { name: 'maxFiles', type: 'number', description: 'Cap (multiple); the add tile hides at the cap.' },
  { name: 'maxSize / minSize', type: 'number (bytes)', description: 'Per-image size bounds.' },
  { name: 'shape', type: "'rectangle' | 'circle'", default: "'rectangle'", description: 'circle ⇒ avatar preview.' },
  { name: 'disabled / invalid', type: 'boolean', default: 'false', description: 'Disable interaction · error skin.' },
];

export default function ImageUploadShowcase() {
  const [gallery, setGallery] = useState<UploadFile[]>([]);
  const [avatar, setAvatar] = useState<UploadFile[]>([]);
  const [cover, setCover] = useState<UploadFile[]>([]);

  return (
    <ShowcasePage
      title="Image Upload"
      description="A drag-and-drop image picker with live thumbnail previews — a product gallery or a single avatar/cover. It shares all selection/validation logic with File Upload (the useFileUpload hook) and adds object-URL previews with a leak-free lifecycle. Toggle dark mode from the navbar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Gallery (multiple)">
        <ImageUpload
          value={gallery}
          onChange={setGallery}
          maxFiles={6}
          maxSize={5 * 1024 * 1024}
          className="max-w-xl"
        />
        <p className="text-sm text-muted-foreground">
          Drop or browse images — thumbnails preview instantly; the add tile hides once you hit 6.
        </p>
      </Block>

      <div className="grid gap-8 lg:grid-cols-2">
        <Block title="Avatar (circle, single)">
          <ImageUpload
            value={avatar}
            onChange={setAvatar}
            multiple={false}
            shape="circle"
            label="Upload avatar"
          />
        </Block>

        <Block title="Cover (rectangle, single)">
          <ImageUpload value={cover} onChange={setCover} multiple={false} label="Cover image" />
        </Block>
      </div>

      <Section title="Upload states (static)">
        <ImageUpload
          className="w-full max-w-xl"
          value={[
            { id: '1', file: makeImage('front.png', 1024 * 300), status: 'success' },
            { id: '2', file: makeImage('side.png', 1024 * 800), status: 'uploading', progress: 55 },
            { id: '3', file: makeImage('back.png', 1024 * 250), status: 'error', error: 'Upload failed' },
          ]}
          onChange={() => {}}
        />
      </Section>

      <Section title="Disabled">
        <ImageUpload disabled multiple={false} shape="circle" label="Upload avatar" />
      </Section>

      <Section title="Props">
        <PropsTable rows={PROPS} />
      </Section>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              <code className="font-mono">accept</code> defaults to{' '}
              <code className="font-mono">image/*</code> — narrow it (e.g.{' '}
              <code className="font-mono">image/png,image/jpeg</code>) when you need specific formats.
            </>,
            <>
              For avatars/logos use <code className="font-mono">multiple={'{false}'}</code> +{' '}
              <code className="font-mono">shape=&quot;circle&quot;</code>; for a product gallery keep it
              multiple with a <code className="font-mono">maxFiles</code> cap.
            </>,
            <>
              Keep <code className="font-mono">value</code> controlled so you can write back{' '}
              <code className="font-mono">status</code>/<code className="font-mono">progress</code> while
              uploading to Cloudinary.
            </>,
            <>
              <strong>Never trust client validation</strong> — re-check type/size and transform
              (resize/strip EXIF) server-side before persisting.
            </>,
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}

/** A fake image File (controllable size) for the static demo. */
function makeImage(name: string, size: number): File {
  const file = new File(['x'], name, { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}
