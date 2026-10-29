import { Checkbox, Label } from "@repo/ui";
import type { Meta, StoryObj } from "@storybook/react";
import type * as React from "react";
import { ParityFrame } from "./_parity";
import ref from "./refs/checkbox.png";

const meta = { title: "UI3/Checkbox", parameters: { layout: "padded" } } satisfies Meta;
export default meta;

function Row({
  id,
  label,
  ...props
}: { id: string; label: string } & React.ComponentProps<typeof Checkbox>) {
  return (
    <div className="flex h-6 items-center gap-2">
      <Checkbox id={id} {...props} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

export const Parity: StoryObj = {
  render: () => (
    <ParityFrame
      reference={ref}
      caption="Checkbox: Checked / Unchecked / Mixed × Default / Disabled, with label"
    >
      <Row id="c1" label="On, Normal" defaultChecked />
      <Row id="c2" label="Off, Normal" />
      <Row id="c3" label="Mixed" checked="indeterminate" />
      <Row id="c4" label="On, Disabled" defaultChecked disabled />
      <Row id="c5" label="Off, Disabled" disabled />
    </ParityFrame>
  ),
};
