---
phase: 16
slug: bug-fixes-dark-mode
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (happy-dom for UI, node for common) |
| **Config file** | `packages/ui/vitest.config.ts`, `packages/common/vitest.config.ts` |
| **Quick run command** | `bun run --filter @repo/ui test` |
| **Full suite command** | `bun run test && bun run lint && bun run build` |
| **Estimated runtime** | ~90 seconds (full), ~15 seconds (quick) |

---

## Sampling Rate

- **After every task commit:** Run `bun run --filter @repo/ui test` (for code tasks) or `bun run build` (for config/build tasks)
- **After every plan wave:** Run `bun run test && bun run lint && bun run build`
- **Before `/gsd-verify-work`:** Full suite + manual dark mode QA must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

> Filled in by planner. Each plan task must map to one row. Requirement column lists the BUG/THEME ID; filenames are illustrative and will be finalized during planning.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | BUG-01 | — | Missing `#root` throws descriptive Error | unit | `bun run --filter @repo/ui test main.test` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | BUG-01 | — | No `as HTMLElement` cast in main.tsx | static | `rg 'as HTMLElement' packages/ui/src/main.tsx` (expect 0) | ✅ | ⬜ pending |
| 16-02-01 | 02 | 1 | BUG-02 | — | `ButtonProps` is a real named export | build | `bun run --filter @repo/ui build` | ✅ | ⬜ pending |
| 16-02-02 | 02 | 1 | BUG-02 | — | `ButtonProps` importable from `@repo/ui` | static | `rg 'export type ButtonProps' packages/ui/src/components/ui/button.tsx` | ✅ | ⬜ pending |
| 16-03-01 | 03 | 1 | BUG-03 | — | `AlertAction` re-exported from barrel | static | `rg 'AlertAction' packages/ui/src/index.ts` | ✅ | ⬜ pending |
| 16-04-01 | 04 | 2 | BUG-04 | — | Iconify offline import wired, preload whitelist registered | unit | `bun run --filter @repo/ui test icon.test` | ❌ W0 | ⬜ pending |
| 16-04-02 | 04 | 2 | BUG-04 | — | Zero references to `api.iconify.design` in built bundle | build | `bun run build && rg 'api.iconify.design' apps/design-plugin/dist/` (expect 0) | ✅ | ⬜ pending |
| 16-04-03 | 04 | 2 | BUG-04 | — | `iconName` prop removed across all call sites | static | `rg 'iconName' packages/ui apps/storybook apps/design-plugin` (expect 0) | ✅ | ⬜ pending |
| 16-04-04 | 04 | 2 | BUG-04 | — | `StaticIconName` union exports `lucide:plus`, `lucide:info`, `lucide:star` minimum AND invalid names fail type-check | static+typecheck | `rg 'StaticIconName' packages/ui/src/index.ts && bun run --filter @repo/ui vitest run --typecheck icon.test` | ❌ W0 (typecheck config) | ⬜ pending |
| 16-05-01 | 05 | 1 | BUG-05 | — | `index.html` has DOCTYPE + html/head/body | static | `rg '<!DOCTYPE html>' packages/ui/src/index.html` | ✅ | ⬜ pending |
| 16-05-02 | 05 | 1 | BUG-05 | — | vite-plugin-singlefile still inlines everything | build | `bun run build && test -f apps/design-plugin/dist/index.html` | ✅ | ⬜ pending |
| 16-06-01 | 06 | 1 | BUG-06 | — | `pathToFileURL` imported and used in postcssUrl callback | static | `rg 'pathToFileURL' apps/design-plugin/vite.config.ui.ts` | ✅ | ⬜ pending |
| 16-06-02 | 06 | 1 | BUG-06 | — | Build succeeds when path contains a space | build (manual) | See `.planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md` — recipe uses `/tmp/bug-06 smoke` symlink; result recorded in that artifact. | ❌ W0 (smoke setup) | ⬜ pending |
| 16-07-01 | 07 | 2 | THEME-01 | — | `.dark` tokens defined in styles.css (compound selector `.dark, html.figma-dark`) | static | `rg '^\.dark,?\s*$\|^\.dark\s*\{' packages/ui/src/styles.css` (expect 1) | ✅ | ⬜ pending |
| 16-07-02 | 07 | 2 | THEME-01 | — | `@custom-variant dark` configured with figma-dark class selector | static | `rg '@custom-variant dark.*figma-dark' packages/ui/src/styles.css` | ✅ | ⬜ pending |
| 16-07-03 | 07 | 2 | THEME-01 | — | Toggling `html.figma-dark` in devtools flips tokens | manual | Manual QA in Figma plugin iframe | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/ui/src/main.test.ts` — stub test for BUG-01 null-guard branch (render DOM without `#root`, expect thrown Error)
- [ ] `packages/ui/src/components/figma/icon.test.tsx` — stub test for BUG-04 Icon component, asserts preload whitelist renders and unknown name fails type check (use `// @ts-expect-error`)
- [ ] BUG-04 typecheck enablement: Plan 04 Task 2 checks `packages/ui/vitest.config.ts` for `test.typecheck.enabled`. If missing, add a minimal `typecheck: { enabled: true, include: ["src/**/*.test.{ts,tsx}"] }` block so `vitest run --typecheck icon.test` enforces the `@ts-expect-error` assertion. This is scoped to Phase 16 and does NOT encroach on Phase 17 TYPE-01's repo-wide `tsc --noEmit` pipeline work.
- [ ] BUG-06 smoke harness: `.planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md` documents the symlink-based recipe (uses `/tmp/bug-06 smoke` — note the space) and records the PASS/FAIL result from a one-shot execution.

*No vitest install needed — vitest 4.x + happy-dom already configured per CLAUDE.md.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark mode flip in running plugin | THEME-01 | Requires real Figma iframe runtime OR devtools DOM mutation; Storybook `<html>` doesn't have `figma-dark` | 1) Run `bun run dev`, load plugin in Figma desktop. 2) In Figma, switch UI theme → dark. 3) Verify plugin panel backgrounds/text flip. 4) Alternate: in browser devtools add `class="figma-dark"` to `<html>` and confirm styles update. |
| Single-file dist sanity | BUG-05 | End-to-end "plugin actually loads in Figma" is manual | Build, load `dist/manifest.json` via Figma → Plugins → Development → Import. Confirm UI renders and buttons respond. |
| Path-with-spaces build | BUG-06 | Requires symlink under a path containing a space; recipe in `16-06-SMOKE.md` | Run the recipe in `.planning/phases/16-bug-fixes-dark-mode/16-06-SMOKE.md` and paste the PASS/FAIL line into the "Recorded run" section of that artifact. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (main.test.ts, icon.test.tsx, typecheck config if needed, 16-06-SMOKE.md)
- [ ] No watch-mode flags (`test:watch` NEVER used in CI)
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
</content>
</invoke>