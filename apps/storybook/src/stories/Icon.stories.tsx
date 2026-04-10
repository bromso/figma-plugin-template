import { Icon } from "@repo/ui";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  component: Icon,
  title: "Components/Icon",
  tags: ["autodocs"],
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    iconName: "info",
  },
};

export const Plus: Story = {
  args: {
    iconName: "plus",
  },
};

export const Star: Story = {
  args: {
    iconName: "star",
  },
};

export const Spinning: Story = {
  args: {
    iconName: "info",
    spin: true,
  },
};
