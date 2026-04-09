// Stub for figma-plugin-ds in test environment.
// The real package's index.js uses ESM syntax without type: "module", causing
// module resolution errors in Vitest. The disclosure and selectMenu JS modules
// are DOM-interactive and cannot run in happy-dom anyway.
export const disclosure = { init: () => {}, destroy: () => {} };
export const selectMenu = { init: () => {}, destroy: () => {} };
