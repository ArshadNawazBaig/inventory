import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ImageUpload } from './image-upload';
import type { UploadFile } from '../file-upload/use-file-upload';

const meta: Meta<typeof ImageUpload> = {
  title: 'Inputs/ImageUpload',
  component: ImageUpload,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof ImageUpload>;

function makeImage(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

export const Gallery: Story = {
  render: function GalleryStory() {
    const [files, setFiles] = useState<UploadFile[]>([]);
    return (
      <ImageUpload
        value={files}
        onChange={setFiles}
        maxFiles={6}
        maxSize={5 * 1024 * 1024}
        className="max-w-lg"
      />
    );
  },
};

export const Avatar: Story = {
  render: function AvatarStory() {
    const [files, setFiles] = useState<UploadFile[]>([]);
    return (
      <ImageUpload
        value={files}
        onChange={setFiles}
        multiple={false}
        shape="circle"
        label="Upload avatar"
      />
    );
  },
};

export const Cover: Story = {
  render: function CoverStory() {
    const [files, setFiles] = useState<UploadFile[]>([]);
    return <ImageUpload value={files} onChange={setFiles} multiple={false} label="Cover image" />;
  },
};

export const UploadStates: Story = {
  render: () => (
    <ImageUpload
      className="max-w-lg"
      value={[
        { id: '1', file: makeImage('front.png', 'image/png', 1024 * 300), status: 'success' },
        { id: '2', file: makeImage('side.png', 'image/png', 1024 * 800), status: 'uploading', progress: 55 },
        { id: '3', file: makeImage('back.png', 'image/png', 1024 * 250), status: 'error', error: 'Upload failed' },
      ]}
      onChange={() => {}}
    />
  ),
};

export const Disabled: Story = {
  render: () => <ImageUpload disabled multiple={false} label="Upload avatar" shape="circle" />,
};
