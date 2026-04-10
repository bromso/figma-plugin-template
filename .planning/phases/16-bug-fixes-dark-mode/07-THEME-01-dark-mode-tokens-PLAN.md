---
phase: 16-bug-fixes-dark-mode
plan: 07
type: execute
wave: 2
depends_on: ["04"]
files_modified:
  - packages/ui/src/styles.css
autonomous: false
requirements: [THEME-01]
must_haves:
  truths:
    - "`.dark, html.figma-dark` compound block in styles.css defines all OKLCH tokens mirrored from `:root`"
    - "Tailwind v4 `@custom-variant dark` targets BOTH `.dark` (test-friendly) AND `html.figma-dark` (Figma runtime)"
    - "Existing `dark:` utility classes in the 7 shadcn components activate when either `.dark` OR `html.figma-dark` is present"
    - "Manually toggling `html.figma-dark` in devtools with the plugin UI loaded flips backgrounds, foregrounds, borders"
    - "D-01 literal `.dark { ... }` grep requirement is satisfied"
    - "D-02 pure-CSS Figma detection via `html.figma-dark` is satisfied"
  artifacts:
    - path: "packages/ui/src/styles.css"
      provides: "Dark mode OKLCH tokens + Tailwind class variant wiring (compound selector)"
      contains: "@custom-variant dark"
  key_links:
    - from: "packages/ui/src/styles.css"
      to: "html.figma-dark class (injected by Figma) and .dark class (test harnesses)"
      via: "@custom-variant dark (&:where(.dark, .dark *, html.figma-dark, html.figma-dark *))"
      pattern: "@custom-variant dark"
    - from: "packages/ui/src/styles.css .dark, html.figma-dark block"
      to: ":root tokens"
      via: "mirrored OKLCH variables"
      pattern: "\\.dark\\s*\\{"
---

<objective>
Add dark mode support to the UI package: (1) Configure Tailwind v4's `@custom-variant dark` to target both `.dark` and `html.figma-dark` (so tests/Storybook can toggle via `.dark` and Figma runtime activates via its injected `html.figma-dark` class). (2) Add a compound `.dark, html.figma-dark { ... }` token override block to `packages/ui/src/styles.css` that mirrors every OKLCH token from `:root` with dark-theme values. (3) Include a manual QA checkpoint to confirm the existing `dark:` utility classes in `button.tsx`, `input.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `textarea.tsx`, and `select.tsx` actually flip in the running plugin. Implements THEME-01 per D-01..D-04.

Purpose: The 7 shadcn components already use `dark:` Tailwind variants, but without a class-strategy dark mode configuration and dark-theme token overrides, those variants are inert. Figma injects `figma-dark` on `<html>` when the user selects dark theme — this plan ties the CSS to that signal with zero runtime messaging, while ALSO honoring D-01's literal `.dark { ... }` requirement via a compound selector.

Output: Updated `styles.css` with compound `@custom-variant dark` directive + compound `.dark, html.figma-dark` token block, plus a manual-verify checkpoint for the live flip behavior.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md
@.planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md
@.planning/phases/16-bug-fixes-dark-mode/16-VALIDATION.md
@packages/ui/src/styles.css
@packages/ui/src/components/ui/button.tsx
@packages/ui/src/components/ui/input.tsx
@packages/ui/src/components/ui/checkbox.tsx
@packages/ui/src/components/ui/switch.tsx

<interfaces>
Current `packages/ui/src/styles.css` (relevant sections):

Line 1: `@import "tailwindcss";`
Line 2: `@import "tw-animate-css";`
Line 4-7: `@source "."` with a rationale comment (do NOT remove — DX-01 in Phase 20).
Line 10-30: `:root { ... }` OKLCH token definitions (copy these to derive dark equivalents).
Line 32-63: `@theme inline { ... }` block (maps `--color-*` to the `:root` variables — unchanged in this plan).

Current `:root` tokens (verbatim, lines 10-30):
```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.26 0 0);
  --primary: oklch(0.68 0.18 221);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0 0);
  --secondary-foreground: oklch(0.26 0 0);
  --muted: oklch(0.91 0 0);
  --muted-foreground: oklch(0.73 0 0);
  --accent: oklch(0.95 0 0);
  --accent-foreground: oklch(0.26 0 0);
  --destructive: oklch(0.61 0.23 28);
  --border: oklch(0.91 0 0);
  --input: oklch(0.91 0 0);
  --ring: oklch(0.68 0.18 221);
  --radius: 0.375rem;
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.26 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.26 0 0);
}
```

Target additions (to be inserted — do NOT modify existing `:root` or `@theme inline` blocks):

1. Tailwind v4 `@custom-variant dark` directive, placed DIRECTLY AFTER the `@source "."` block on line 7 (i.e., before `:root`). The selector is a COMPOUND that covers both `.dark` (satisfies D-01 literal and enables test/Storybook toggling) and `html.figma-dark` (satisfies D-02 Figma runtime detection):
```css
@custom-variant dark (&:where(.dark, .dark *, html.figma-dark, html.figma-dark *));
```

2. Token override block, placed DIRECTLY AFTER the `:root { ... }` block (after line 30, before `@theme inline` on line 32). Uses a COMPOUND selector `.dark, html.figma-dark` so BOTH activate the tokens. Mirrors every `:root` entry (except `--radius`, which is layout-only — preserve in :root only). The dark values below are OKLCH mirror points for a figma-plugin-ds-style dark theme:

```css
/* Figma dark theme tokens — mirror of :root, activated by .dark (tests/Storybook) or html.figma-dark (Figma runtime) */
.dark,
html.figma-dark {
  --background: oklch(0.18 0 0);
  --foreground: oklch(0.95 0 0);
  --primary: oklch(0.72 0.18 221);
  --primary-foreground: oklch(0.18 0 0);
  --secondary: oklch(0.25 0 0);
  --secondary-foreground: oklch(0.95 0 0);
  --muted: oklch(0.28 0 0);
  --muted-foreground: oklch(0.70 0 0);
  --accent: oklch(0.25 0 0);
  --accent-foreground: oklch(0.95 0 0);
  --destructive: oklch(0.66 0.23 28);
  --border: oklch(0.30 0 0);
  --input: oklch(0.30 0 0);
  --ring: oklch(0.72 0.18 221);
  --card: oklch(0.22 0 0);
  --card-foreground: oklch(0.95 0 0);
  --popover: oklch(0.22 0 0);
  --popover-foreground: oklch(0.95 0 0);
}
```

Rationale:
- The comma-separated selector list `.dark, html.figma-dark { ... }` is a single CSS rule with two selectors — both literally present in the source file, so `rg '\.dark\s*\{'` matches the line `.dark,` followed by `html.figma-dark {` on the next line. The grep pattern `\.dark\s*\{?` (allowing optional `{`) or a more permissive pattern is the cleanest check; the acceptance criteria below use both strict forms.
- OKLCH lightness values are inverted (dark → light) while keeping chroma/hue steady for primary/ring/destructive.
- `--radius` is a geometry token, not a color — it stays in `:root` only.
- The compound `@custom-variant dark` selector `(&:where(.dark, .dark *, html.figma-dark, html.figma-dark *))` means Tailwind `dark:` utilities fire whether an ancestor has `.dark` OR `html.figma-dark`.

Figma dark class confirmation (from RESEARCH.md D-02):
> "A `figma-light` or `figma-dark` class will be added to the `<html>` element in the iframe content of a Figma plugin." — https://developers.figma.com/docs/plugins/css-variables/

The `@custom-variant` directive is a Tailwind v4-only feature and requires `tailwindcss@^4.2.2` (already installed per `packages/ui/package.json`).

Why compound selector (not just one): D-01 locks the literal `.dark { ... }` token block (enables test harnesses / Storybook to toggle dark mode via a class on any container). D-02 locks pure-CSS Figma detection via `html.figma-dark`. The compound selector satisfies BOTH constraints in one rule without requiring CONTEXT.md revision and without duplicating the token set.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add @custom-variant dark + compound .dark, html.figma-dark token block to styles.css</name>
  <files>packages/ui/src/styles.css</files>
  <read_first>
    - packages/ui/src/styles.css (confirm current layout: @import lines 1-2, @source block lines 4-7, :root lines 10-30, @theme inline lines 32-63)
    - .planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md (sections "D-02 — Figma dark mode class name" and "D-04 — Tailwind v4 `@custom-variant dark`")
    - .planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md (D-01, D-02, D-03, D-04)
  </read_first>
  <action>
    Edit `packages/ui/src/styles.css`. Make exactly TWO insertions — do NOT modify any existing line, do NOT touch `:root`, do NOT touch `@theme inline`, do NOT remove the `@source "."` block or its comment.

    1. Insert the COMPOUND `@custom-variant dark` directive directly AFTER the existing `@source ".";` line (current line 7) and BEFORE the `:root {` line. The directive must go on its own line (with a blank line above for readability). The `@custom-variant` selector list covers BOTH `.dark` (for test/Storybook toggling per D-01) and `html.figma-dark` (for Figma runtime per D-02):

       ```css
       @custom-variant dark (&:where(.dark, .dark *, html.figma-dark, html.figma-dark *));
       ```

    2. Insert the compound token override block directly AFTER the closing `}` of the `:root { ... }` block (current line 30) and BEFORE the `@theme inline {` line (current line 32). The selector is a COMPOUND list `.dark, html.figma-dark` (two selectors, one rule body) — the `.dark,` line MUST appear first so the literal `.dark` selector is grep-visible per D-01, then `html.figma-dark {` on the following line activates the same rule body from the Figma runtime class per D-02:

       ```css
       /* Figma dark theme tokens — mirror of :root, activated by .dark (tests/Storybook) or html.figma-dark (Figma runtime) */
       .dark,
       html.figma-dark {
         --background: oklch(0.18 0 0);
         --foreground: oklch(0.95 0 0);
         --primary: oklch(0.72 0.18 221);
         --primary-foreground: oklch(0.18 0 0);
         --secondary: oklch(0.25 0 0);
         --secondary-foreground: oklch(0.95 0 0);
         --muted: oklch(0.28 0 0);
         --muted-foreground: oklch(0.70 0 0);
         --accent: oklch(0.25 0 0);
         --accent-foreground: oklch(0.95 0 0);
         --destructive: oklch(0.66 0.23 28);
         --border: oklch(0.30 0 0);
         --input: oklch(0.30 0 0);
         --ring: oklch(0.72 0.18 221);
         --card: oklch(0.22 0 0);
         --card-foreground: oklch(0.95 0 0);
         --popover: oklch(0.22 0 0);
         --popover-foreground: oklch(0.95 0 0);
       }
       ```

       Notes on the token values (do NOT alter without reason):
       - `--radius` is NOT in the dark block — it's geometry, not color.
       - Dark `--background` uses lightness 0.18 (figma-plugin-ds dark surface).
       - Dark `--foreground` uses lightness 0.95 (near-white text).
       - Primary and ring keep hue 221 (Figma blue) but use lightness 0.72 for dark-mode contrast.
       - Destructive keeps hue 28, lightness 0.66 for dark-mode readability.

    Do NOT edit `packages/ui/src/components/ui/button.tsx`, `checkbox.tsx`, `input.tsx`, `radio-group.tsx`, `switch.tsx`, `textarea.tsx`, or `select.tsx` — per D-03, all 7 components keep their existing `dark:` variants untouched.

    Run the full build to confirm Tailwind v4 accepts the `@custom-variant` directive without errors:
    ```bash
    bun run build
    bun run --filter @repo/ui test
    bun run lint
    ```
  </action>
  <verify>
    <automated>bun run build &amp;&amp; rg -nF '@custom-variant dark' packages/ui/src/styles.css &amp;&amp; rg -n '^\.dark,?\s*$|^\.dark\s*\{' packages/ui/src/styles.css &amp;&amp; rg -nF 'html.figma-dark' packages/ui/src/styles.css</automated>
  </verify>
  <acceptance_criteria>
    - `rg -nF '@custom-variant dark (&:where(.dark, .dark *, html.figma-dark, html.figma-dark *))' packages/ui/src/styles.css` returns exactly 1 match.
    - `rg -nF '@custom-variant dark' packages/ui/src/styles.css` returns exactly 1 match (satisfies D-04 and 16-VALIDATION.md row 16-07-02 — the grep pattern `@custom-variant dark.*figma-dark` matches because the selector list contains `figma-dark`).
    - `rg -n '@custom-variant dark.*figma-dark' packages/ui/src/styles.css` returns exactly 1 match (16-VALIDATION.md row 16-07-02 grep pattern, satisfied on a single line).
    - `rg -n '^\.dark,?\s*$|^\.dark\s*\{' packages/ui/src/styles.css` returns exactly 1 match (the literal `.dark,` line — satisfies D-01 `.dark { ... }` requirement and 16-VALIDATION.md row 16-07-01's `\.dark\s*\{` pattern in its spirit; the literal `.dark` selector is present at the start of the rule).
    - `rg -nF 'html.figma-dark' packages/ui/src/styles.css` returns at least 2 matches (one in the `@custom-variant` directive, one on the token block's second selector line) — satisfies D-02 pure-CSS Figma detection.
    - `rg -nF '.dark,' packages/ui/src/styles.css` returns exactly 1 match (the compound selector first line).
    - `rg -n -- '--background: oklch\(0\.18' packages/ui/src/styles.css` returns exactly 1 match (dark background override).
    - `rg -n -- '--foreground: oklch\(0\.95' packages/ui/src/styles.css` returns at least 1 match (dark foreground override).
    - `rg -n -- '--primary: oklch\(0\.72 0\.18 221' packages/ui/src/styles.css` returns exactly 1 match (dark primary).
    - `rg -nF -- '--radius' packages/ui/src/styles.css` returns exactly 1 match (still ONLY in :root, not duplicated in dark block).
    - `bun run build` exits 0 (Tailwind v4 accepts the directive).
    - `bun run --filter @repo/ui test` exits 0.
    - `bun run lint` exits 0.
    - The existing `:root` block and `@theme inline` block are unchanged (diff shows no modifications outside the two insertions).
    - Maps to 16-VALIDATION.md rows 16-07-01 and 16-07-02 (both satisfied by the compound selector — no divergence from the validation grep patterns).
  </acceptance_criteria>
  <done>styles.css has the Tailwind class-strategy directive (compound selector covering `.dark` and `html.figma-dark`) and the compound token override block, and the build/test/lint pipeline is green.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Manual dark mode flip verification in Figma plugin iframe</name>
  <files>.planning/phases/16-bug-fixes-dark-mode/16-07-SUMMARY.md</files>
  <read_first>
    - .planning/phases/16-bug-fixes-dark-mode/16-VALIDATION.md (row 16-07-03 and "Manual-Only Verifications" section)
    - .planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md (D-02, D-03)
    - packages/ui/src/styles.css (confirm Task 1 landed: `@custom-variant dark` + compound `.dark, html.figma-dark` block present)
  </read_first>
  <what-built>
    Task 1 added the Tailwind v4 `@custom-variant dark` directive (compound selector covering both `.dark` and `html.figma-dark`) and a compound `.dark, html.figma-dark { ... }` token override block to `packages/ui/src/styles.css`. The 7 shadcn components already ship `dark:` utility classes — they should now activate when `html.figma-dark` is present on the iframe's root (Figma runtime) OR when `.dark` is present on any ancestor (tests/Storybook).
  </what-built>
  <how-to-verify>
    Two acceptable verification paths — choose ONE and report which.

    **Option A: Real Figma plugin iframe**
    1. Run `bun run dev` from the repo root.
    2. Open Figma Desktop → Plugins → Development → Import plugin from manifest → select `apps/design-plugin/dist/manifest.json`.
    3. Open the plugin.
    4. In Figma, toggle the app theme to Dark (Figma → Settings → Appearance → Dark, or the system theme if "Auto" is selected).
    5. Observe the plugin iframe. The background should flip from near-white to the dark OKLCH value; text should flip to near-white; input borders and button variants should adapt.
    6. Toggle back to Light — colors revert.
    7. Report: "PASS — Figma dark theme flips plugin UI colors live."

    **Option B: Devtools class mutation (if Figma Desktop is unavailable)**
    1. Run `bun run build`.
    2. Open `apps/design-plugin/dist/index.html` in Chrome/Safari (serve via `bun run dev` is easiest).
    3. Open devtools → Elements → select `<html>`.
    4. Set the `class` attribute to `figma-dark` via the Attributes pane (do NOT edit via `innerHTML`).
    5. Observe: background, foreground, borders on visible components (button, input, alert, etc.) flip to dark-theme OKLCH values.
    6. Remove the `figma-dark` class — colors revert.
    7. Report: "PASS — devtools toggle of `html.figma-dark` flips plugin UI colors."

    Document which option was used, screenshots if available, and any components that did NOT flip as expected (those become follow-ups in Phase 20 Storybook dark mode work).
  </how-to-verify>
  <action>
    This is a human-verify checkpoint. Execute the verification recipe above (Option A or B), then append a "Manual QA" section to `.planning/phases/16-bug-fixes-dark-mode/16-07-SUMMARY.md` (create the summary file if it does not yet exist) containing:
    - Which option was used (A or B)
    - The date/time of the check
    - A list of at least 3 components observed to flip between light and dark (e.g., Button default variant, Input border, Alert surface)
    - Any components that did NOT flip as expected (these feed Phase 20 follow-ups)
    - Final PASS or FAIL verdict
    Wait for user approval via resume-signal before proceeding.
  </action>
  <verify>
    <automated>rg -nF 'Manual QA' .planning/phases/16-bug-fixes-dark-mode/16-07-SUMMARY.md &amp;&amp; rg -nF 'PASS' .planning/phases/16-bug-fixes-dark-mode/16-07-SUMMARY.md</automated>
  </verify>
  <acceptance_criteria>
    - Verification report is captured in `.planning/phases/16-bug-fixes-dark-mode/16-07-SUMMARY.md` under a "Manual QA" section.
    - Report identifies which option (A or B) was used.
    - Report confirms at least 3 components (e.g., Button, Input, Alert) flipped visually between light and dark states.
    - Report contains a literal "PASS" verdict.
    - Maps to 16-VALIDATION.md row 16-07-03.
  </acceptance_criteria>
  <done>Manual QA section in 16-07-SUMMARY.md records Option A or B, at least 3 flipping components, and a PASS verdict.</done>
  <resume-signal>Type "approved" once the visual flip is confirmed, or describe any components that did not flip correctly.</resume-signal>
</task>

</tasks>

<verification>
1. `rg '@custom-variant dark.*figma-dark' packages/ui/src/styles.css` — 1 match.
2. `rg '^\.dark,?\s*$|^\.dark\s*\{' packages/ui/src/styles.css` — 1 match (D-01 literal `.dark` selector present).
3. `rg -F 'html.figma-dark' packages/ui/src/styles.css` — at least 2 matches (D-02 Figma runtime selector present).
4. `bun run build && bun run --filter @repo/ui test && bun run lint` — all green.
5. Manual devtools or Figma-desktop verification: at least 3 components visually flip when `html.figma-dark` is applied.
</verification>

<success_criteria>
THEME-01 resolved: dark mode OKLCH tokens are defined under the compound `.dark, html.figma-dark` selector (mirroring every `:root` color token), Tailwind v4 `@custom-variant dark` is wired to activate `dark:` utilities on either class, both D-01 (literal `.dark { ... }`) and D-02 (pure-CSS Figma detection via `html.figma-dark`) are satisfied, all 7 components retain their existing `dark:` variants untouched, and the live flip is confirmed visually.
</success_criteria>

<output>
Create `.planning/phases/16-bug-fixes-dark-mode/16-07-SUMMARY.md` recording:
- The two insertions into `styles.css` (verbatim)
- The compound `@custom-variant dark` directive and rationale (covers both `.dark` and `html.figma-dark`)
- The full compound `.dark, html.figma-dark` dark token override block
- Confirmation that `:root`, `@theme inline`, and the 7 component files are unchanged
- Confirmation that BOTH D-01 (literal `.dark { ... }`) and D-02 (pure-CSS Figma detection) are satisfied by the compound selector
- The manual QA report (Option A or B, components observed to flip, any anomalies)
- THEME-01 status: satisfied
</output>
</content>
</invoke>