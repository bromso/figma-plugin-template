import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@repo/ui';

const meta = {
  component: Button,
  title: 'Components/Button',
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Click me',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary',
    tint: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    tint: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    destructive: true,
  },
};
