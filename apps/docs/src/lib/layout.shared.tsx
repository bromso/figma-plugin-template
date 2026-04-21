import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
// In fumadocs v14, exports are at fumadocs-ui/layouts/shared (not /shared/index)

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Figma Plugin Template",
    },
    links: [
      {
        text: "GitHub",
        url: "https://github.com/bromso/figma-plugin-template",
      },
    ],
  };
}
