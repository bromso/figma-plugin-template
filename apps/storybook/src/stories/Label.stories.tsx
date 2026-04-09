import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '@repo/ui';

const meta = {
  component: Label,
  title: 'Components/Label',
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Layer name',
  },
};
