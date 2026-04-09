import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from '@repo/ui';

const meta = {
  component: Radio,
  title: 'Components/Radio',
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Option A',
    id: 'radio-default',
    name: 'radio-group',
  },
};

export const Checked: Story = {
  args: {
    children: 'Selected option',
    id: 'radio-checked',
    name: 'radio-group',
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Unavailable option',
    id: 'radio-disabled',
    name: 'radio-group',
    disabled: true,
  },
};
