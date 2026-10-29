---
"@repo/ui": minor
"@repo/common": minor
---

Replace Vite and Vitest with Bun's bundler and test runner. The plugin is built by a single `build.ts` (standalone HTML output, Tailwind, React Compiler); tests run under `bun test` with happy-dom. Storybook keeps Vite. Requires Bun 1.4.2+. The manifest now sets `documentAccess: "dynamic-page"` and `networkAccess`, and the plugin UI finally receives Figma's theme class (`themeColors: true`) so dark mode can apply.
