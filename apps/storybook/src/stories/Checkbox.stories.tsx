import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '@repo/ui';

const meta = {
  component: Checkbox,
  title: 'Components/Checkbox',
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Enable option',
    id: 'checkbox-default',
  },
};

export const Checked: Story = {
  args: {
    children: 'Already checked',
    id: 'checkbox-checked',
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled checkbox',
    id: 'checkbox-disabled',
    disabled: true,
  },
};
