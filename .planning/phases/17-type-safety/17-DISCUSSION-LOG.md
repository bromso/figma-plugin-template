# Phase 17: Type Safety — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 17-type-safety
**Areas discussed:** Icon registration API shape, StaticIconName extensibility, packages/ui tsc scope + config layout, packages/common types script + Turborepo wiring

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Icon registration API shape | registerIcons vs registerIcon vs both — also governs REQUIREMENTS.md TYPE-02 rewording | ✓ |
| StaticIconName extensibility | Module augmentation / escape hatch / generic / fixed | ✓ |
| packages/ui tsc scope + config layout | Two-config vs single vs src-only; tests in/out | ✓ |
| packages/common types script + Turborepo wiring | Wire common now, defer, or expand to storybook | ✓ |

**User's choice:** All four areas selected for discussion.

---

## Icon Registration API Shape

| Option | Description | Selected |
|--------|-------------|----------|
| registerIcons(iconifyData) only | Thin wrapper around iconify's addCollection. Matches Phase 16 architecture 1:1. No second render path. | ✓ |
| registerIcon(name, component) only | Original TYPE-02 wording. Arbitrary React components. Second render path in Icon. | |
| Both — registerIcons + registerIcon | Full flexibility, richer API surface, more code to maintain | |
| registerIcons + separate `<CustomIcon>` | Clean separation, no branching in Icon | |

**User's choice:** "I want the it to work within a figma plugin, using best practises" (free-text)

**Interpretation:** Figma plugins run in a singlefile sandbox with no runtime network access, which rules out iconify's default lazy-fetch mode. Best practice under those constraints is Option 1 (`registerIcons(iconifyData)` only) because it is iconify's official offline pattern, keeps Icon to one render path, matches Phase 16 exactly, and satisfies the Phase 16 deferred-note recommendation. Locked as D-01 with the user's implicit approval based on the Figma-plugin constraint framing. REQUIREMENTS.md TYPE-02 wording will be updated as part of this phase (D-07).

**Notes:** The constraints (no network, singlefile bundle, sandboxed iframe) make Option 1 the only defensible "best practice" answer — confirmed with the user by explicitly calling out the constraint chain before locking the decision.

---

## StaticIconName Extensibility

| Option | Description | Selected |
|--------|-------------|----------|
| Module augmentation on an interface | StaticIconNameMap interface + `type StaticIconName = keyof StaticIconNameMap`. Fully type-safe, zero runtime cost, TS-idiomatic (same pattern as @tanstack/react-router, react-i18next, next-auth). | ✓ |
| Typed escape hatch: StaticIconName \| (string & {}) | Pragmatic but allows typos in known names to silently pass | |
| Generic Icon<T extends string> | Most flexible, most verbose at every call site | |
| Keep StaticIconName fixed, no widening | Requires a separate dynamic render path | |

**User's choice:** Module augmentation on an interface (with preview)

**Notes:** This requires a coordinated change with Phase 16 — Phase 16 currently plans a bare string-literal union for StaticIconName. Phase 17 will restructure it into an interface-backed `keyof` type. Captured as D-02 and D-03 in CONTEXT.md.

---

## packages/ui tsc Scope + Config Layout

### Sub-question 1: Which files does tsc check?

| Option | Description | Selected |
|--------|-------------|----------|
| Two-config like design-plugin | tsconfig.json for src/**/*, tsconfig.node.json for vitest.config.ts. Types script runs both. Mirrors established monorepo pattern. | ✓ |
| Single config, widen include | Simpler but mixes source and build-tool typings | |
| src-only, ignore config files | Fastest but leaves vitest.config.ts unchecked | |

**User's choice:** Two-config like design-plugin (with preview)

### Sub-question 2: Test files in strict check?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, include tests | Tests already in src/**, keep them strict-checked — the whole point of Phase 17 is to close type holes | ✓ |
| Exclude tests from tsc | Separate test tsconfig, errors only surface at test runtime | |

**User's choice:** Yes, include tests

**Notes:** Locked as D-08 (two-config pattern for packages/ui and packages/common) and D-09 (test files stay in main tsconfig include).

---

## packages/common Types Script + Turborepo Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add types script to common now | Uniform coverage. No future catch-up phase. Matches the spirit of ROADMAP criterion #2. | ✓ |
| Just packages/ui, defer common | Leaves a known type hole in a shared package | |
| Also add storybook app | Closes every hole but expands phase scope | |

**User's choice:** Yes, add types script to common now

**Notes:** `apps/storybook` is explicitly deferred to Phase 20 or a future DX pass per user scoping. Captured as D-11 in CONTEXT.md.

---

## Wrap-up

**Question:** Ready for context or explore more gray areas?
**User's choice:** Ready for context.

## Claude's Discretion

- Exact key shape of the `ICONS` const (e.g., `plus` vs `lucidePlus`)
- Whether `registerIcons` accepts an array or a single collection (researcher to confirm iconify API)
- Exact file housing the new `StaticIconNameMap` interface (co-located in `icon.tsx` or split to `icon.types.ts`)
- Dedup strategy for the unknown-icon warning (module-level Set recommended)
- Order/naming of new exports from `packages/ui/src/index.ts`
- Commit sequencing within the phase

## Deferred Ideas

- Expand preloaded icon whitelist beyond 3 names — backlog
- Icon provider / React context API — rejected for v1
- Runtime icon loader / lazy registration — rejected, singlefile incompatible
- apps/storybook types script — Phase 20 or future DX pass
- Strict typing for `turbo.json` tasks — out of scope
- Dedicated `docs/ICONS.md` — deferred to Phase 20
- `packages/ui` internal lucide-react imports in shadcn primitives — Phase 18
