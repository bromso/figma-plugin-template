import type { Meta, StoryObj } from '@storybook/react';
import { SectionTitle } from '@repo/ui';

const meta = {
  component: SectionTitle,
  title: 'Components/SectionTitle',
} satisfies Meta<typeof SectionTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Design',
  },
};

export const LongTitle: Story = {
  args: {
    children: 'Auto Layout',
  },
};
