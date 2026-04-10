# Phase 17: Type Safety — Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 17 closes the two type-safety gaps from the v1.2 code audit:

1. **TYPE-01:** Wire `tsc --noEmit` into the Turborepo `types` pipeline for every workspace package that currently has a tsconfig but no types script — specifically `packages/ui` and `packages/common`. After this phase, `bun run types` from the repo root must type-check the entire monorepo.
2. **TYPE-02:** Expose a runtime icon-registration API layered on top of Phase 16's iconify migration, with fully type-safe extensibility via TypeScript module augmentation.

**In scope:**
- `packages/ui/package.json` — add `types` script (two-config pattern mirroring `apps/design-plugin`)
- `packages/ui/tsconfig.node.json` — new file covering `vitest.config.ts` and any root-level config files
- `packages/common/package.json` — add `types` script (same two-config pattern)
- `packages/common/tsconfig.node.json` — new file covering `vitest.config.ts`
- `packages/ui/src/components/figma/icon.tsx` — add `registerIcons(iconifyData)` + `StaticIconNameMap` interface + `keyof`-derived `StaticIconName`
- `packages/ui/src/index.ts` — export `registerIcons`, `StaticIconNameMap`, `StaticIconName`, `ICONS` (or equivalent), and any new types
- `.planning/REQUIREMENTS.md` — rewrite TYPE-02 to match the iconify-based API (the original `registerIcon(name, component)` wording is obsolete after Phase 16)
- Fix any TypeScript errors surfaced in `packages/ui` or `packages/common` when the types script runs for the first time

**Out of scope (belongs in other phases):**
- Bundle analysis, Radix/Lucide import strategy → Phase 18
- React Compiler opt-in → Phase 19
- Interaction tests, polymorphic `Type` component, worktree docs → Phase 20
- Adding types scripts to `apps/storybook` — user chose to limit this phase to `packages/*` workspaces only
- Expanding the static iconify whitelist beyond Phase 16's 3 icons (`lucide:plus`, `lucide:info`, `lucide:star`)
- Any additional shadcn/ui component migrations

**Hard dependency:** Phase 16 must be merged first. Phase 17 edits the iconify-based `Icon` component that Phase 16 creates; running Phase 17 against today's `lucide-react` implementation would fail.

</domain>

<decisions>
## Implementation Decisions

### TYPE-02 — Icon registration API

- **D-01:** **API shape is `registerIcons(iconifyData)` only.** A thin, typed wrapper around iconify's `addCollection` that accepts raw iconify collection JSON (from `@iconify/json` or a per-set package like `@iconify-json/lucide`). No `registerIcon(name, component)` escape hatch for arbitrary React components — that would introduce a second render path in `Icon` and doesn't solve any Figma-plugin constraint. Consumers who want truly custom components render them directly without going through `Icon`.
  - **Rationale:** Figma plugins run in a singlefile sandbox with no runtime network access. `registerIcons(iconifyData)` is iconify's official offline pattern, matches the Phase 16 architecture 1:1, keeps `Icon` to one render path, and satisfies Phase 16's explicit deferred-note recommendation.

- **D-02:** **`StaticIconName` extensibility via module augmentation.** `@repo/ui` exports an empty interface `StaticIconNameMap` and derives `StaticIconName = keyof StaticIconNameMap`. Consumers widen it with:
  ```ts
  declare module "@repo/ui" {
    interface StaticIconNameMap {
      "mdi:home": true
      "mdi:account": true
    }
  }
  registerIcons(mdiCollection)
  ```
  Fully type-safe, zero runtime cost, preserves autocomplete, and is the TS-idiomatic pattern for declaration merging.

- **D-03:** **Phase 16 coordination — `StaticIconName` must be `keyof StaticIconNameMap`, not a bare string union.** Phase 16's CONTEXT.md D-11 specifies `StaticIconName` as a direct string literal union (`'lucide:plus' | 'lucide:info' | 'lucide:star'`). Phase 17 switches the declaration to an interface-backed `keyof` type. If Phase 16 lands first with the bare union, Phase 17's first plan task is to restructure it — no behavior change, only the underlying type shape.
  - **What the exported surface looks like after Phase 17:**
    ```ts
    export interface StaticIconNameMap {
      "lucide:plus": true
      "lucide:info": true
      "lucide:star": true
    }
    export type StaticIconName = keyof StaticIconNameMap
    ```

- **D-04:** **`ICONS` const export (ROADMAP criterion #5).** Export a typed runtime const mirroring the static whitelist:
  ```ts
  export const ICONS = {
    plus: "lucide:plus",
    info: "lucide:info",
    star: "lucide:star",
  } as const satisfies Record<string, StaticIconName>
  ```
  Consumers can use `ICONS.plus` instead of the raw string literal if they prefer a const-referenced API. The `satisfies` clause keeps the values narrowed and tied to the static map.

- **D-05:** **Unknown-icon runtime behavior (ROADMAP criterion #6).** The `Icon` component renders via `@iconify/react`'s `<Icon />`, passing the name through. For runtime-registered names that later turn out to be missing from the collection (or for a stray cast that bypasses the type), wrap iconify's render with a check: if the name is not in iconify's internal registry, `console.warn("[@repo/ui] Unknown icon name: \"<name>\". Did you forget to call registerIcons()?")` and `return null` instead of letting iconify render its fallback placeholder. This satisfies success criterion #6 ("warns and returns null without throwing") without re-introducing the Phase 16-removed `iconMap` lookup.
  - **Researcher must verify:** iconify's API for querying whether a name is registered (`iconExists(name)` or equivalent) and pin the call pattern with a citation.

- **D-06:** **`registerIcons` return type and side effects.** `registerIcons(data: IconifyJSON): boolean` — returns whatever `addCollection` returns (boolean success flag). Pure side effect on iconify's internal registry; no provider component, no React context, no hook. Consumers call it once at module init (e.g., in their `main.tsx` before `createRoot`).

- **D-07:** **REQUIREMENTS.md TYPE-02 rewording.** The current TYPE-02 wording (`registerIcon(name, component) API`) is obsolete after Phase 16. Phase 17 updates REQUIREMENTS.md line 19 to:
  > **TYPE-02**: `Icon` component supports runtime extension via `registerIcons(iconifyData)` API (thin wrapper around iconify's `addCollection`), with typed `ICONS` const, extensible `StaticIconNameMap` interface, and `StaticIconName = keyof StaticIconNameMap` for static consumers.
  This edit ships as part of the same phase so traceability stays honest.

### TYPE-01 — tsc pipeline wiring

- **D-08:** **Two-config pattern, mirror `apps/design-plugin` exactly.** Both `packages/ui` and `packages/common` get:
  ```json
  // package.json
  "scripts": {
    "types": "tsc --noEmit && tsc --noEmit -p tsconfig.node.json"
  }
  ```
  And a new `tsconfig.node.json` at each package root:
  ```jsonc
  {
    "compilerOptions": {
      "noEmit": true,
      "skipLibCheck": true,
      "module": "ESNext",
      "moduleResolution": "bundler",
      "esModuleInterop": true,
      "types": ["node"]
    },
    "include": ["*.ts", "vitest.config.ts"]
  }
  ```
  The existing `tsconfig.json` in each package (already `strict: true`, `noEmit: true`) covers `src/**/*` unchanged. One convention across the entire monorepo — no per-package divergence.

- **D-09:** **Test files stay in the main tsconfig include.** `packages/ui/tsconfig.json` already includes `src/**/*.tsx`, which picks up `*.test.ts(x)` files under `src/`. Do not split tests into a separate tsconfig. The explicit goal of Phase 17 is to close type holes — test files are a common source of drift and must be strict-checked by `bun run types`.

- **D-10:** **Turborepo `types` pipeline task already exists.** `turbo.json` already defines a `types` task with `dependsOn: ["^build"]`. Phase 17 does NOT modify `turbo.json` — the task just picks up the new package-level scripts automatically. Root-level `bun run types` already runs `turbo run types` and will, after this phase, execute for `@repo/ui`, `@repo/common`, and `@repo/design-plugin`.
  - **Researcher must verify:** that `turbo run types` across these three packages runs in the correct topological order (common → ui → design-plugin) and that the `dependsOn: ["^build"]` dependency doesn't cause unwanted rebuilds during a pure type-check.

- **D-11:** **Scope — `packages/*` only.** `apps/storybook` also has a tsconfig without a types script, but user explicitly scoped this phase to `packages/ui` + `packages/common`. Storybook type-check wiring is deferred to Phase 20 (Tests + DX) or a future DX pass.

- **D-12:** **Fix errors as they surface.** Running `bun run types` on `packages/ui` for the first time will likely reveal latent type errors (this is the entire audit finding). Phase 17 fixes whatever comes up. If any fix is non-trivial (e.g., requires rewriting a component), the planner may split it into its own plan and the researcher should identify the highest-risk files ahead of time.

### Claude's Discretion

- Exact key shape of the `ICONS` const (e.g., `plus` vs `lucidePlus` vs `LUCIDE_PLUS`) — keep it idiomatic JS
- Whether `registerIcons` accepts an array or a single collection (iconify's `addCollection` takes a single one at a time — researcher confirms)
- Exact file that contains the new `StaticIconNameMap` interface (keep it co-located with `Icon` in `src/components/figma/icon.tsx`, or split to `src/components/figma/icon.types.ts` if the file grows)
- Whether the unknown-icon warning is one-shot (dedup via a `Set<string>`) or fires on every render — default to dedup to avoid devtools spam
- Order/naming of new exports from `packages/ui/src/index.ts`
- Commit sequencing within the phase (the planner will split into per-decision plans)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & audit
- `.planning/REQUIREMENTS.md` §Type Safety (TYPE-01, TYPE-02) — pending reqs satisfied by Phase 17. Note: TYPE-02 wording is updated as part of this phase (D-07)
- `.planning/ROADMAP.md` — Phase 17 success criteria (lines 83-94)
- `.planning/milestones/v1.2-MILESTONE-AUDIT.md` — original audit findings behind TYPE-01 and TYPE-02

### Hard dependency — Phase 16
- `.planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md` — Phase 16 Icon iconify migration (D-08..D-13) and the explicit Phase 17 reframing note in the `<deferred>` section
- `.planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md` D-11 — Phase 16's original `StaticIconName` string-union decision that Phase 17 restructures into `keyof StaticIconNameMap`

### Existing code to be modified
- `packages/ui/package.json` — add `types` script
- `packages/ui/tsconfig.json` — existing strict config; stays unchanged (reference)
- `packages/ui/tsconfig.node.json` — NEW, to be created
- `packages/ui/vitest.config.ts` — type-checked by the new node config
- `packages/ui/src/components/figma/icon.tsx` — major edits: `StaticIconNameMap` interface, `registerIcons`, `ICONS` const, unknown-name guard
- `packages/ui/src/index.ts` — export new public surface (`registerIcons`, `StaticIconNameMap`, `StaticIconName`, `ICONS`)
- `packages/common/package.json` — add `types` script
- `packages/common/tsconfig.json` — existing strict config; stays unchanged (reference)
- `packages/common/tsconfig.node.json` — NEW, to be created
- `packages/common/vitest.config.ts` — type-checked by the new node config
- `turbo.json` — already has `types` task; stays unchanged (reference)
- `.planning/REQUIREMENTS.md` — line 19 (TYPE-02) rewording per D-07

### Reference — existing two-config pattern to mirror
- `apps/design-plugin/package.json` — `types: "tsc --noEmit && tsc --noEmit -p tsconfig.node.json"` — this is the pattern
- `apps/design-plugin/tsconfig.json` — main strict config for `src/**/*`
- `apps/design-plugin/tsconfig.node.json` — node config for `vite.config.*.ts`

### External docs (researcher should fetch via Context7)
- `@iconify/react` — offline API: `addCollection`, `iconExists`, programmatic registration, disabling API fetching (verify current v5+ signatures)
- `@iconify/types` — `IconifyJSON` type, `IconifyInfo`, collection JSON shape
- Turborepo — `types` task semantics, `dependsOn: ["^build"]` behavior for pure type-check tasks
- TypeScript — module augmentation / declaration merging for interfaces across module boundaries (the `declare module` + `interface` merge pattern)
- TypeScript — `satisfies` operator semantics for typed const exports

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/design-plugin/tsconfig.node.json` — exact template for the two-config pattern Phase 17 mirrors in `packages/ui` and `packages/common`
- `apps/design-plugin/package.json` `types` script — copy-paste-adapt for both packages
- `turbo.json` `types` pipeline task — already defined and already wired to root `bun run types`; no edits needed
- `packages/ui/src/components/figma/icon.tsx` (post-Phase-16) — Phase 17 extends this file; Phase 16 already locks in iconify and the narrowed `name` prop
- `packages/ui/src/index.ts` — the public barrel; Phase 17 adds a small cluster of new exports

### Established Patterns
- **Two-config tsc** — `apps/design-plugin` is the only package today with a `types` script. Phase 17 promotes that exact pattern to a monorepo-wide convention.
- **Strict everywhere** — every `tsconfig.json` in the repo already has `strict: true`. Phase 17 only adds the execution wiring; the rules are already in place.
- **Workspace imports via `@repo/*`** — Phase 17 doesn't add new cross-package imports, so this pattern is unaffected
- **Module augmentation in `packages/ui`** — no existing precedent in this repo for exporting an extensible interface. Phase 17 introduces the pattern; documenting it in a JSDoc comment on `StaticIconNameMap` with a usage example is a nice-to-have the planner can include.
- **No runtime network in the Figma plugin sandbox** — every Phase 17 decision has to respect this. `registerIcons` is synchronous and operates on already-bundled data; no fetches, no async loaders.

### Integration Points
- Root `bun run types` → `turbo run types` → picks up the new package-level scripts automatically, no glue code needed
- Phase 16's `Icon` component is the only place the new type-extensibility work plugs in; no other files touch the `Icon` internals
- Storybook consumes `@repo/ui` via its workspace symlink — the new exports flow in automatically and Storybook's own tsconfig will see them without any edits
- `apps/design-plugin`'s existing `types` script remains unchanged — Phase 17 only adds siblings

</code_context>

<specifics>
## Specific Ideas

- **Interface-backed union pattern:** The `interface StaticIconNameMap { ... }` + `type StaticIconName = keyof StaticIconNameMap` pattern is deliberately chosen over a bare string literal union because interfaces can be augmented across module boundaries via declaration merging, while type aliases cannot. This is the exact idiom used by libraries like `@tanstack/react-router` (register interface), `react-i18next` (resources interface), and `next-auth` (session interface) for the same type-extension problem. The planner should cite these as precedent in the JSDoc on `StaticIconNameMap`.
- **`ICONS` const as a typed enum-ish export:** The `satisfies Record<string, StaticIconName>` clause keeps the const narrow while also giving a compile-time guarantee that every value is a registered name. This means adding a new `StaticIconNameMap` entry without a matching `ICONS` entry (or vice versa) fails the type check — a nice forcing function for keeping them in sync.
- **Unknown-icon warning dedup:** In dev, a re-rendering app could fire the same warning every frame. A module-level `Set<string>` that tracks already-warned names keeps the console clean without adding meaningful memory cost. Planner decides whether to gate this on `process.env.NODE_ENV !== 'production'`.
- **Vite singlefile + iconify interaction:** `@iconify/react` has an "offline mode" — make sure the planner verifies that the bundled output of `packages/ui` doesn't pull in the iconify API client at all (dead-code elim should handle it since we never call `setProvider`, but worth a grep on `api.iconify.design` in the built bundle).

</specifics>

<deferred>
## Deferred Ideas

- **Expand the preloaded icon whitelist beyond 3 names.** Phase 16 ships the minimum; Phase 17 doesn't change that. If a template consumer needs more icons out of the box, expand as a backlog item in a future milestone (or document the `registerIcons` call as the recommended path).
- **Icon provider / React context API.** Instead of a side-effect-on-module-init `registerIcons`, a `<IconProvider collections={[...]}>` component at the root. Rejected for v1 — simpler API, fewer moving parts, matches iconify's own pattern.
- **Runtime icon loader / lazy registration.** Dynamic `import('./icons/mdi.json')` at runtime to register collections on demand. Rejected — Figma's singlefile bundle doesn't support runtime imports.
- **`apps/storybook` types script.** User scoped this phase to `packages/*`. Move this to Phase 20 or a future DX pass.
- **Strict typing for `turbo.json` tasks.** `turbo.json` itself isn't type-checked. Could use `@turbo/schema` or a JSON Schema validator in CI. Out of scope for Phase 17.
- **Public JSDoc + `docs/ICONS.md`.** A user-facing doc explaining the `registerIcons` API and module-augmentation pattern would be valuable for template consumers. Planner may include a minimal JSDoc on the new exports; a dedicated `docs/ICONS.md` is deferred to Phase 20 (DX pass).
- **Migrating `packages/ui`'s internal `select.tsx` / `accordion.tsx` / `checkbox.tsx` off direct lucide-react imports.** Still lives at Phase 18 per Phase 16 CONTEXT — not a Phase 17 concern.

</deferred>

## Verification

After Phase 17 plans are executed, these must pass:

1. **TYPE-01 criterion #1:** `packages/ui/package.json` has `"types": "tsc --noEmit && tsc --noEmit -p tsconfig.node.json"`
2. **TYPE-01 criterion #2:** `turbo run types` executes across `@repo/common`, `@repo/ui`, and `@repo/design-plugin` (topological, driven by existing pipeline task)
3. **TYPE-01 criterion #3:** `bun run types` from repo root exits 0 with zero TypeScript errors
4. **TYPE-02 criterion #4:** `registerIcons(someIconifyCollection)` compiles and at runtime registers all icons in the collection with iconify
5. **TYPE-02 criterion #5:** `import { ICONS, type StaticIconName } from "@repo/ui"` works; `ICONS.plus` is typed as the literal `"lucide:plus"`; `StaticIconName` equals `keyof StaticIconNameMap`
6. **TYPE-02 criterion #6:** `<Icon name={"unknown" as StaticIconName} />` at runtime logs a warning and returns null without throwing; the warning mentions `registerIcons`
7. **Module augmentation works:** A test consumer can `declare module "@repo/ui" { interface StaticIconNameMap { "test:dummy": true } }` and `<Icon name="test:dummy" />` type-checks
8. **REQUIREMENTS.md updated:** TYPE-02 line reflects the iconify-based wording per D-07
9. **packages/common wired:** `packages/common/package.json` has a matching `types` script; `packages/common/tsconfig.node.json` exists
10. **No regressions:** `bun run build`, `bun run lint`, `bun run test` all exit 0
11. **Traceability:** `.planning/REQUIREMENTS.md` TYPE-01 and TYPE-02 can be moved to satisfied after phase verification

---

*Phase: 17-type-safety*
*Context gathered: 2026-04-10*
