import type { Meta, StoryObj } from '@storybook/react';
import { DisclosureItem } from '@repo/ui';

const meta = {
  component: DisclosureItem,
  title: 'Components/DisclosureItem',
} satisfies Meta<typeof DisclosureItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'Expandable Section',
    content: 'Disclosure content goes here.',
  },
};

export const Expanded: Story = {
  args: {
    heading: 'Open by Default',
    content: 'This section is expanded on load.',
    expanded: true,
  },
};

export const Section: Story = {
  args: {
    heading: 'Section Heading',
    content: 'This uses the section style.',
    section: true,
  },
};
