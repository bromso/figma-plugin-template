// Manual mock for figma-plugin-ds.
// figma-plugin-ds/index.js uses ESM bare imports without .js extension,
// which fail under Node 24 strict ESM. The disclosure/selectMenu modules
// are DOM-interactive and cannot run in happy-dom anyway.
export const disclosure = { init: () => {}, destroy: () => {} };
export const selectMenu = { init: () => {}, destroy: () => {} };
