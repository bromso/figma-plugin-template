import type { Meta, StoryObj } from '@storybook/react';
import { Disclosure, DisclosureItem } from '@repo/ui';

const meta = {
  component: Disclosure,
  title: 'Components/Disclosure',
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Disclosure
      {...args}
      tips={[
        { heading: 'Section 1', content: 'Content for section 1' },
        { heading: 'Section 2', content: 'Content for section 2' },
        { heading: 'Section 3', content: 'Content for section 3' },
      ]}
      render={(tip) => (
        <DisclosureItem
          key={tip.heading}
          heading={tip.heading}
          content={tip.content}
        />
      )}
    />
  ),
};

export const WithExpanded: Story = {
  render: (args) => (
    <Disclosure
      {...args}
      tips={[
        { heading: 'Expanded by default', content: 'This section starts open' },
        { heading: 'Collapsed section', content: 'Click to expand' },
      ]}
      render={(tip, index) => (
        <DisclosureItem
          key={tip.heading}
          heading={tip.heading}
          content={tip.content}
          expanded={index === 0}
        />
      )}
    />
  ),
};
