import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Navigation/Pagination',
  component: Pagination,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: function DefaultStory() {
    const [page, setPage] = useState(1);
    return <Pagination page={page} pageCount={5} onPageChange={setPage} />;
  },
};

export const ManyPages: Story = {
  render: function ManyPagesStory() {
    const [page, setPage] = useState(5);
    return <Pagination page={page} pageCount={20} onPageChange={setPage} />;
  },
};

export const Sizes: Story = {
  render: function SizesStory() {
    const [page, setPage] = useState(3);
    return (
      <div className="flex flex-col items-center gap-4">
        <Pagination page={page} pageCount={10} onPageChange={setPage} size="sm" />
        <Pagination page={page} pageCount={10} onPageChange={setPage} size="md" />
        <Pagination page={page} pageCount={10} onPageChange={setPage} size="lg" />
      </div>
    );
  },
};

export const WideWindow: Story = {
  render: function WideWindowStory() {
    const [page, setPage] = useState(10);
    return (
      <Pagination page={page} pageCount={20} onPageChange={setPage} siblingCount={2} />
    );
  },
};

export const NumbersOnly: Story = {
  render: function NumbersOnlyStory() {
    const [page, setPage] = useState(2);
    return <Pagination page={page} pageCount={5} onPageChange={setPage} showPrevNext={false} />;
  },
};
