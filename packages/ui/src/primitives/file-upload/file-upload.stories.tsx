import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileUpload } from './file-upload';
import type { UploadFile } from './use-file-upload';

const meta: Meta<typeof FileUpload> = {
  title: 'Inputs/FileUpload',
  component: FileUpload,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof FileUpload>;

function makeFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

export const Empty: Story = {
  render: function EmptyStory() {
    const [files, setFiles] = useState<UploadFile[]>([]);
    return <FileUpload value={files} onChange={setFiles} className="max-w-md" />;
  },
};

export const Restricted: Story = {
  render: function RestrictedStory() {
    const [files, setFiles] = useState<UploadFile[]>([]);
    return (
      <FileUpload
        value={files}
        onChange={setFiles}
        accept=".csv,.xlsx"
        maxSize={5 * 1024 * 1024}
        maxFiles={3}
        label="Upload your import file"
        className="max-w-md"
      />
    );
  },
};

export const SingleFile: Story = {
  render: function SingleStory() {
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
  },
};

export const UploadStates: Story = {
  render: () => (
    <FileUpload
      className="max-w-md"
      value={[
        { id: '1', file: makeFile('products.csv', 'text/csv', 1024 * 200), status: 'success' },
        { id: '2', file: makeFile('images.zip', 'application/zip', 1024 * 1024 * 8), status: 'uploading', progress: 64 },
        { id: '3', file: makeFile('broken.xlsx', 'application/vnd.ms-excel', 1024 * 40), status: 'error', error: 'Network error — retry.' },
      ]}
      onChange={() => {}}
    />
  ),
};

export const Disabled: Story = {
  render: () => <FileUpload disabled className="max-w-md" />,
};
