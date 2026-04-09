import type { Meta, StoryObj } from '@storybook/react';
import { OnboardingTip } from '@repo/ui';

const meta = {
  component: OnboardingTip,
  title: 'Components/OnboardingTip',
} satisfies Meta<typeof OnboardingTip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    iconProps: {
      iconName: 'smiley',
    },
    children: 'Select a layer to get started.',
  },
};

export const WithWarning: Story = {
  args: {
    iconProps: {
      iconName: 'warning',
    },
    children: 'No layers selected. Please select at least one layer.',
  },
};
