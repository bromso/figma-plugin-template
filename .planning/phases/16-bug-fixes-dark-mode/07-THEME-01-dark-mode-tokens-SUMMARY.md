---
plan: 07-THEME-01-dark-mode-tokens
phase: 16-bug-fixes-dark-mode
status: complete
tasks_completed: 2
tasks_total: 2
commits: [7f207da, b44584e]
requirements: [THEME-01]
decisions: [D-01, D-02, D-03, D-04]
autonomous: false
---

# THEME-01 Dark Mode Tokens — SUMMARY

## Objective

Add dark mode support to the UI package by:
1. Configuring Tailwind v4's `@custom-variant dark` to target both `.dark` (tests/Storybook) and `html.figma-dark` (Figma runtime injection).
2. Adding a compound `.dark, html.figma-dark { ... }` token override block to `packages/ui/src/styles.css` that mirrors every OKLCH token from `:root` with dark-theme values.
3. Verifying the dark mode flip visually in the Figma plugin iframe.

## Tasks

### Task 1 — Add `@custom-variant dark` + dark token overrides

**Commit:** `7f207da` (merged via `dfd9048`)

Two insertions to `packages/ui/src/styles.css`:

1. **Tailwind v4 `@custom-variant dark` directive** at the top of the file (after `@source "."`):
   ```css
   @custom-variant dark (&:where(.dark, .dark *, html.figma-dark, html.figma-dark *));
   ```
   This makes every existing `dark:` Tailwind utility (in `button.tsx`, `checkbox.tsx`, `input.tsx`, `radio-group.tsx`, `select.tsx`, `switch.tsx`, `textarea.tsx`) activate when either `.dark` (tests/Storybook) OR `html.figma-dark` (Figma runtime) is present on an ancestor. The `:where(...)` wrapper is zero-specificity so it does not escalate selector weight.

2. **Compound `.dark, html.figma-dark { ... }` token override block** after `:root`, before `@theme inline`. Mirrors every color token from `:root` with dark-theme OKLCH values. `--radius` is intentionally NOT duplicated — it is geometric, not color.

**Invariants satisfied:**
- D-01: literal `.dark` selector present (✓ row 16-07-01)
- D-02: `html.figma-dark` selector present alongside `.dark` (✓ row 16-07-02)
- D-03: no `--radius` override in dark block
- D-04: compound selector syntax uses a single block, not two separate blocks

### Task 2 — Manual dark mode flip verification

**Checkpoint type:** `human-verify` (autonomous=false plan)

**Round 1 (failed):** Initial dark tokens used `--border: oklch(0.30)` and `--input: oklch(0.30)` against `--card: oklch(0.22)` — only 0.08 lightness difference. User reported that checkbox and input borders were invisible in the dark plugin iframe (background and text flipped correctly, but bordered controls disappeared into the card surface).

**Fix commit:** `b44584e` — Revised dark tokens to target Figma Desktop's native dark palette:

| Token | Before | After | Reason |
|-------|--------|-------|--------|
| `--border` | 0.30 | 0.42 | Checkbox/input borders need ≥0.15 lightness diff from card |
| `--input` | 0.30 | 0.42 | Same |
| `--card` | 0.22 | 0.25 | Small lift from background for surface distinction |
| `--popover` | 0.22 | 0.25 | Match card |
| `--background` | 0.18 | 0.20 | Avoid near-black |
| `--secondary` | 0.25 | 0.30 | Unified with accent/muted |
| `--accent` | 0.25 | 0.30 | Unified |
| `--muted` | 0.28 | 0.30 | Unified |
| `--foreground` | 0.95 | 0.96 | Crisper text |
| `--*-foreground` | 0.95 | 0.96 | Crisper text |
| `--muted-foreground` | 0.70 | 0.75 | Better label contrast |

**Round 2 (approved):** After the contrast bump, user re-verified via the built `apps/design-plugin/dist/index.html` + `html.figma-dark` class toggle. Reply: `approved`. All light-mode values unchanged.

## Files modified

- `packages/ui/src/styles.css` — added `@custom-variant dark` directive + `.dark, html.figma-dark` override block (two separate insertions across two commits)

## Verification

- `rg -nF '@custom-variant dark (&:where(.dark, .dark *, html.figma-dark, html.figma-dark *))' packages/ui/src/styles.css` → 1 match (line 9)
- `rg -n '^\.dark,?\s*$|^\.dark\s*\{' packages/ui/src/styles.css` → 1 match (satisfies 16-07-01)
- `rg -nF 'html.figma-dark' packages/ui/src/styles.css` → 3 matches (satisfies 16-07-02, D-02)
- `--radius` appears only in `:root` and `@theme inline` — not in dark block
- `bun run build` → green (dist/index.html 376 kB)
- `bun run --filter @repo/ui test` → 4 files / 11 tests passing
- Human verification (Round 2) → approved

## Deviations

1. **Contrast values required a second pass.** The plan's original color value specification was derived from D-01/D-04 without contrast validation against the compound `card + border` surface pair. A human-verify checkpoint caught it. No automated catch is possible for this class of issue — it is inherently perceptual.
2. **Task 2 executed inline by orchestrator.** After the first checkpoint failed, the fix was applied directly on master (not via a new subagent) because: (a) the fix was a single-file token adjustment, (b) the plan-07 worktree was already merged as Task 1 only, (c) spawning a new continuation agent would have added latency for a trivial token tweak. This is a minor process deviation but matches the workflow's `checkpoint_handling` guidance that continuation work can be done inline when appropriate.

## Deferred items

See `.planning/phases/16-bug-fixes-dark-mode/deferred-items.md` — pre-existing Biome format errors in sibling-plan test files (button-props.test.ts, main.test.ts) are tracked there for a follow-up lint sweep.
