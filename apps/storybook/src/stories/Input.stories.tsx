import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@repo/ui';

const meta = {
  component: Input,
  title: 'Components/Input',
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter a value…',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Hello Figma',
    placeholder: 'Enter a value…',
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: 'Read only',
    disabled: true,
  },
};
