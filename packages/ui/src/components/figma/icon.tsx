import { addCollection, Icon as IconifyIcon } from "@iconify/react/offline";
import type { IconifyJSON } from "@iconify/types";
import type * as React from "react";
import { cn } from "@/lib/utils";

// BUG-04 — Curated lucide subset preloaded at module init.
// Using @iconify/react/offline means this bundle has ZERO network code:
// no references to api.iconify.design, no fetch, no XMLHttpRequest.
// To expand the whitelist, add more entries to `lucideSubset.icons` and
// append their names to `StaticIconName`.
//
// TODO(Phase 17): Phase 17 restructures StaticIconName into a
// `interface StaticIconNameMap` that consumers can augment via module
// augmentation, and ships a `registerIcons(iconifyData)` helper.
//
// Body strings are copied verbatim from
// node_modules/@iconify-json/lucide/icons.json (v1.2.102) keys plus/info/star.
const lucideSubset: IconifyJSON = {
  prefix: "lucide",
  icons: {
    plus: {
      body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7v14"/>',
    },
    info: {
      body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></g>',
    },
    star: {
      body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z"/>',
    },
  },
  width: 24,
  height: 24,
};

addCollection(lucideSubset);

export type StaticIconName = "lucide:plus" | "lucide:info" | "lucide:star";

export interface IconProps extends Omit<React.ComponentProps<"svg">, "name"> {
  name: StaticIconName;
  spin?: boolean;
}

export function Icon({ name, spin, className, ...props }: IconProps) {
  return (
    <IconifyIcon
      icon={name}
      className={cn("size-4", spin && "animate-spin", className)}
      {...props}
    />
  );
}
