import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui";
import type { Meta, StoryObj } from "@storybook/react";
import { ParityFrame } from "./_parity";
import ref from "./refs/tooltip.png";

const meta = { title: "UI3/Tooltip", parameters: { layout: "padded" } } satisfies Meta;
export default meta;

export const Parity: StoryObj = {
  render: () => (
    <ParityFrame portaled reference={ref} caption="Tooltip: eight directions, with hotkey">
      <TooltipProvider>
        <div className="flex gap-4 py-8">
          {(["top", "bottom", "left", "right"] as const).map((side) => (
            <Tooltip key={side} defaultOpen>
              <TooltipTrigger asChild>
                <Button variant="secondary">{side}</Button>
              </TooltipTrigger>
              <TooltipContent side={side}>
                Tooltip text <span className="text-figma-text-tooltip-secondary">⌘V</span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </ParityFrame>
  ),
};
