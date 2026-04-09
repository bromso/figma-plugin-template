import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from '@repo/ui';

const meta = {
  component: IconButton,
  title: 'Components/IconButton',
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    iconProps: {
      iconName: 'search',
    },
  },
};

export const Selected: Story = {
  args: {
    iconProps: {
      iconName: 'star-on',
    },
    selected: true,
  },
};

export const Settings: Story = {
  args: {
    iconProps: {
      iconName: 'settings',
    },
  },
};
