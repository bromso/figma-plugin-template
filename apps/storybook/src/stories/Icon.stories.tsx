import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '@repo/ui';

const meta = {
  component: Icon,
  title: 'Components/Icon',
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    iconName: 'search',
  },
};

export const Alert: Story = {
  args: {
    iconName: 'alert',
  },
};

export const Spinner: Story = {
  args: {
    iconName: 'spinner',
    spin: true,
  },
};

export const Colored: Story = {
  args: {
    iconName: 'star-on',
    colorName: 'blue',
  },
};
