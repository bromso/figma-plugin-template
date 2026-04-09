import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '@repo/ui';

const meta = {
  component: Switch,
  title: 'Components/Switch',
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Enable feature',
    id: 'switch-default',
  },
};

export const On: Story = {
  args: {
    children: 'Feature enabled',
    id: 'switch-on',
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Locked setting',
    id: 'switch-disabled',
    disabled: true,
  },
};
