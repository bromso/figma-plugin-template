import { Badge } from "@repo/ui";
import type { Meta, StoryObj } from "@storybook/react";
import { ParityFrame } from "./_parity";
import ref from "./refs/badge.png";

const meta = { title: "UI3/Badge", parameters: { layout: "padded" } } satisfies Meta;
export default meta;

export const Parity: StoryObj = {
  render: () => (
    <ParityFrame
      reference={ref}
      caption="Badge small: Default, Brand, Invert, FigJam, Component, Danger, Warn, Success… strong and subtle"
    >
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="ghost">Strong</Badge>
        <Badge variant="secondary">Brand</Badge>
        <Badge variant="destructive">Danger</Badge>
        <Badge variant="link">Link</Badge>
      </div>
    </ParityFrame>
  ),
};
