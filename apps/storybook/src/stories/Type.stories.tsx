import type { Meta, StoryObj } from '@storybook/react';
import { Type } from '@repo/ui';

const meta = {
  component: Type,
  title: 'Components/Type',
} satisfies Meta<typeof Type>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Hello Figma',
  },
};

export const Small: Story = {
  args: {
    children: 'Small text',
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    children: 'Large text',
    size: 'large',
  },
};

export const Bold: Story = {
  args: {
    children: 'Bold text',
    weight: 'bold',
  },
};

export const Inverse: Story = {
  args: {
    children: 'Inverse text',
    inverse: true,
  },
};
