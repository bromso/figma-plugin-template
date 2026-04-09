import type { Meta, StoryObj } from '@storybook/react';
import { Select, SelectMenuOption } from '@repo/ui';

const meta = {
  component: Select,
  title: 'Components/Select',
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

type Option = { value: string; label: string };

const defaultOptions: Option[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

export const Default: Story = {
  render: (args) => (
    <Select
      {...args}
      options={defaultOptions}
      render={(option) => (
        <SelectMenuOption key={option.value} value={option.value}>
          {option.label}
        </SelectMenuOption>
      )}
    />
  ),
};

export const ManyOptions: Story = {
  render: (args) => (
    <Select
      {...args}
      options={[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
        { value: 'justify', label: 'Justify' },
      ]}
      render={(option) => (
        <SelectMenuOption key={option.value} value={option.value}>
          {option.label}
        </SelectMenuOption>
      )}
    />
  ),
};
