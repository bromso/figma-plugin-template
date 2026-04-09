---
phase: 02-package-extraction
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - apps/figma-plugin/package.json
  - apps/figma-plugin/src/plugin/plugin.network.ts
  - apps/figma-plugin/src/plugin/plugin.ts
  - apps/figma-plugin/tsconfig.json
  - apps/figma-plugin/tsconfig.node.json
  - apps/figma-plugin/vite.config.plugin.ts
  - apps/figma-plugin/vite.config.ui.ts
  - packages/common/package.json
  - packages/common/src/index.ts
  - packages/common/src/networkSides.ts
  - packages/common/tsconfig.json
  - packages/ui/package.json
  - packages/ui/src/app.network.tsx
  - packages/ui/src/app.tsx
  - packages/ui/src/components/Button.tsx
  - packages/ui/src/index.ts
  - packages/ui/src/main.tsx
  - packages/ui/tsconfig.json
findings:
  critical: 0
  warning: 5
  info: 5
  total: 10
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

This phase extracts code into a monorepo structure with two workspace packages (`@repo/common`, `@repo/ui`) consumed by the `@repo/figma-plugin` app. The architecture is sound and the messaging layer is correctly wired. No critical security vulnerabilities were found.

Five warnings were identified: a null pointer dereference masked by a type assertion, an event subscription leak, a missing error handler on an async click handler, a misplaced `viteSingleFile` plugin in the plugin build config, and a fragile manual `paths` override for `monorepo-networker` in the app tsconfig. Five info-level items cover an incomplete HTML entry template, a return-type inconsistency in the network side definition, source-only package exports, a magic number (interval duration), and a stale hardcoded path in inline code comments.

---

## Warnings

### WR-01: Null pointer dereference masked by type assertion in `main.tsx`

**File:** `packages/ui/src/main.tsx:14`
**Issue:** `document.getElementById("root")` returns `HTMLElement | null`. The code casts it directly to `HTMLElement` with `as HTMLElement`, suppressing TypeScript's null check. If the element is absent at runtime (e.g., the HTML template is changed or the script loads before the DOM), `ReactDOM.createRoot(null)` throws an uncaught `TypeError`, crashing the UI silently.
**Fix:**
```typescript
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found. Check index.html.");
}
const root = ReactDOM.createRoot(rootElement);
```

---

### WR-02: Event subscription leak — missing cleanup in `useEffect`

**File:** `packages/ui/src/app.tsx:17-21`
**Issue:** `UI_CHANNEL.subscribe("ping", ...)` is called inside a `useEffect` with no cleanup return. If the `App` component ever unmounts and remounts (e.g., during React 18 Strict Mode double-invocation in development, or future routing), the previous subscription is never removed and a duplicate listener accumulates. React Strict Mode in `main.tsx` deliberately double-mounts effects to surface exactly this class of bug.
**Fix:**
```typescript
useEffect(() => {
  const unsubscribe = UI_CHANNEL.subscribe("ping", () => {
    setPingCount((cnt) => cnt + 1);
  });
  return () => unsubscribe?.();
}, []);
```
If `monorepo-networker`'s `subscribe` does not return an unsubscribe function, use the equivalent `off` / `removeMessageHandler` API.

---

### WR-03: Unhandled promise rejection in async `onClick` handler

**File:** `packages/ui/src/app.tsx:44-49`
**Issue:** The "ping the other side" button uses an async arrow function as `onClick`. If `UI_CHANNEL.request(...)` rejects (e.g., the plugin side is not yet initialized, or the message times out), the rejection is unhandled — there is no `try/catch` or `.catch()`. In contrast, the "export selection" button (line 63) correctly wraps the request in a `try/catch`. The inconsistency means a failed ping produces a silent unhandled promise rejection in the console.
**Fix:**
```typescript
onClick={async () => {
  try {
    const response = await UI_CHANNEL.request(PLUGIN, "ping", []);
    console.log("Response:", response);
  } catch (err) {
    console.warn("Ping failed:", err);
  }
}}
```

---

### WR-04: `viteSingleFile` plugin included in plugin (JS) build config

**File:** `apps/figma-plugin/vite.config.plugin.ts:4,9`
**Issue:** `viteSingleFile()` is designed to inline all assets into a single HTML file. The plugin build config produces a `plugin.js` bundle (not HTML), so `viteSingleFile` has no effect here. While currently harmless, it imports and executes unnecessary plugin code on every build invocation and signals incorrect intent to future maintainers. If `viteSingleFile` ever acquires side effects on JS outputs in a future version, behavior could change unexpectedly.
**Fix:** Remove the `viteSingleFile` import and plugin entry from `vite.config.plugin.ts`:
```typescript
// Remove these lines:
import { viteSingleFile } from "vite-plugin-singlefile";
// ...
plugins: [
  // viteSingleFile(),   <-- remove
  generateFile({ ... }),
],
```

---

### WR-05: Fragile manual `paths` override for `monorepo-networker` in app tsconfig

**File:** `apps/figma-plugin/tsconfig.json:16-18`
**Issue:** The `paths` entry hardcodes a node_modules path for `monorepo-networker`:
```json
"paths": {
  "monorepo-networker": ["./node_modules/monorepo-networker/dist/index.d.ts"]
}
```
This works only when the package is installed locally in `apps/figma-plugin/node_modules/`. Bun workspaces hoist dependencies by default, so the package may be in the root `node_modules/` instead. If hoisting moves the package, TypeScript type resolution breaks silently while bundling still works (Vite resolves via Node, not tsconfig paths). The `skipLibCheck: true` means this may not surface as a visible error.
**Fix:** Remove the manual `paths` override and rely on standard module resolution. If type resolution is broken without it, the correct fix is to ensure `moduleResolution: "Bundler"` is set (it already is) and that `monorepo-networker` ships a proper `exports` field in its `package.json`. Alternatively, pin the path relative to the repo root:
```json
"paths": {
  "monorepo-networker": ["../../node_modules/monorepo-networker/dist/index.d.ts"]
}
```

---

## Info

### IN-01: Incomplete HTML entry template

**File:** `packages/ui/src/index.html:1-2`
**Issue:** The HTML file contains only a `<div id="root">` and a script tag — no `<!DOCTYPE html>`, `<html>`, `<head>`, or `<body>` elements. Vite will serve this as-is in dev mode and `vite-plugin-singlefile` will inline assets into this minimal fragment. Browsers will apply error-recovery rules to parse the fragment, which works in practice, but the output is technically invalid HTML and may cause issues with HTML linters, accessibility tools, or future plugin tooling that parses the manifest's `ui` field.
**Fix:** Use a complete HTML skeleton:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Plugin UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

---

### IN-02: `exportSelection` typed as `Promise<string>` on the network side definition

**File:** `packages/common/src/networkSides.ts:12`
**Issue:** The `PLUGIN` side defines `exportSelection(): Promise<string>` while all other handlers are typed with plain return values (e.g., `ping(): "pong"`, `hello(text: string): void`). The `monorepo-networker` framework wraps handler return values in promises automatically when using `.request(...)`. Typing the return as `Promise<string>` instead of `string` may cause double-wrapping in the type signature (`Promise<Promise<string>>`), depending on how the framework resolves the generic. Consistency with the other handlers suggests it should be `string`.
**Fix:**
```typescript
exportSelection(): string;
```

---

### IN-03: Source TypeScript files used directly as package `exports`

**File:** `packages/common/package.json:5-9`, `packages/ui/package.json:5-9`
**Issue:** Both packages export raw `.ts` source files (e.g., `"./networkSides": "./src/networkSides.ts"`). This is a valid pattern within a Vite/Bun monorepo where the consumer bundles everything, but it is non-standard. It means the packages cannot be consumed outside this monorepo without modification, and TypeScript's package resolution in `node16`/`nodenext` modes would reject `.ts` files in exports. The `packages/common/tsconfig.json` has no `outDir` — there is no build step for these packages.
**Fix:** Document this intentionally as a "source packages" pattern in each `package.json` (or in `CLAUDE.md`) so future maintainers understand that these packages are not meant to be built or published independently. If cross-repo consumption becomes a requirement, add a build step to each package.

---

### IN-04: Magic number for ping interval

**File:** `apps/figma-plugin/src/plugin/plugin.ts:26`
**Issue:** `setInterval(() => PLUGIN_CHANNEL.emit(UI, "ping", []), 5000)` uses a bare `5000` with no named constant and no explanation of why 5 seconds was chosen. The `setInterval` handle is also not retained, making it impossible to cancel without rewriting the call site.
**Fix:**
```typescript
const PING_INTERVAL_MS = 5000;
const pingTimer = setInterval(
  () => PLUGIN_CHANNEL.emit(UI, "ping", []),
  PING_INTERVAL_MS
);
// Store pingTimer if cancellation is ever needed: clearInterval(pingTimer)
```

---

### IN-05: Stale path reference in UI `app.tsx` code comment

**File:** `packages/ui/src/app.tsx:82`
**Issue:** The JSX contains the text `Edit <code>src/app.tsx</code> and save to test HMR`. After the monorepo extraction, the actual file path is `packages/ui/src/app.tsx`, not `src/app.tsx`. This is boilerplate carried over from the original single-package template. It is misleading for developers unfamiliar with the new workspace layout.
**Fix:** Update the path string to reflect the actual location:
```tsx
<p>
  Edit <code>packages/ui/src/app.tsx</code> and save to test HMR
</p>
```

---

_Reviewed: 2026-04-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
