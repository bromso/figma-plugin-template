import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Figma Plugin Template",
    },
    githubUrl: "https://github.com/bromso/figma-plugin-template",
    links: [
      {
        text: "Storybook",
        url: "https://bromso.github.io/figma-plugin-template/storybook",
      },
    ],
  };
}
