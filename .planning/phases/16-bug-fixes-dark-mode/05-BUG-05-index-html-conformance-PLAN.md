---
phase: 16-bug-fixes-dark-mode
plan: 05
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/ui/src/index.html
autonomous: true
requirements: [BUG-05]
must_haves:
  truths:
    - "`packages/ui/src/index.html` is a conformant HTML document with DOCTYPE, html, head, body"
    - "`bun run build` still produces a working single-file output (vite-plugin-singlefile inlines everything)"
  artifacts:
    - path: "packages/ui/src/index.html"
      provides: "Conformant HTML shell with inlined assets"
      contains: "<!DOCTYPE html>"
  key_links:
    - from: "packages/ui/src/index.html"
      to: "./main.tsx"
      via: "<script type=\"module\">"
      pattern: "script type=\"module\""
    - from: "packages/ui/src/index.html"
      to: "./styles.css"
      via: "<link rel=\"stylesheet\">"
      pattern: "rel=\"stylesheet\""
---

<objective>
Rewrite `packages/ui/src/index.html` from its 3-line fragment form into a conformant HTML document with `<!DOCTYPE html>`, `<html lang="en">`, `<head>` (charset, viewport, title, stylesheet link), and `<body>` (root div, main.tsx module script). Verify `vite-plugin-singlefile` still inlines the stylesheet and script into a single-file output. Implements BUG-05 per D-14.

Purpose: The current file is a bare fragment — no DOCTYPE, no `<html>`, no `<head>`. While vite-plugin-singlefile masks this at build time, the source-level fragment breaks IDE tooling, HTML validators, and template consumer expectations. RESEARCH.md confirms vite-plugin-singlefile v2.3.x has no HTML structure requirements.
Output: Conformant `index.html`, verified build output.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md
@.planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md
@.planning/phases/16-bug-fixes-dark-mode/16-VALIDATION.md
@packages/ui/src/index.html
@apps/design-plugin/vite.config.ui.ts

<interfaces>
Current `packages/ui/src/index.html` (full file, 3 lines):
```html
<link rel="stylesheet" href="./styles.css" />
<div id="root"></div>
<script type="module" src="./main.tsx"></script>
```

Target structure (verbatim from RESEARCH.md D-14):
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Figma Plugin</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

Gotchas from RESEARCH.md:
- `<script type="module">` is REQUIRED — do not change.
- Do NOT add `<meta http-equiv="Content-Security-Policy">` — Figma's iframe enforces its own CSP.
- `href="./styles.css"` and `src="./main.tsx"` paths are relative to Vite's `root` (the file's own directory).
- vite-plugin-singlefile v2.3.x inlines both `<link rel="stylesheet">` and `<script type="module">` regardless of HTML structure.
- The build output is `apps/design-plugin/dist/index.html` (confirmed from `apps/design-plugin/vite.config.ui.ts` line 38 — the `input` key in `rolldownOptions`).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite index.html and verify single-file build still inlines</name>
  <files>packages/ui/src/index.html</files>
  <read_first>
    - packages/ui/src/index.html (confirm it is currently 3 lines, no DOCTYPE)
    - apps/design-plugin/vite.config.ui.ts (confirm `viteSingleFile()` is in the plugin list and `outDir` is `apps/design-plugin/dist`)
    - .planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md (section "D-14 — vite-plugin-singlefile + conformant HTML")
  </read_first>
  <action>
    Replace the ENTIRE contents of `packages/ui/src/index.html` with the following 12 lines (verbatim):

    ```html
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Figma Plugin</title>
        <link rel="stylesheet" href="./styles.css" />
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="./main.tsx"></script>
      </body>
    </html>
    ```

    Notes:
    - `lang="en"` — standard for the English-only template.
    - `<meta charset="UTF-8" />` must be the first element inside `<head>`.
    - Do NOT add `<meta http-equiv="Content-Security-Policy">` or any CSP meta tag.
    - Do NOT modify `packages/ui/src/main.tsx`, `packages/ui/src/styles.css`, or `apps/design-plugin/vite.config.ui.ts`.
    - `<title>Figma Plugin</title>` is the template default — consumers override this per their plugin.

    After writing, run the full build and verify the single-file output:

    ```bash
    bun run build
    test -f apps/design-plugin/dist/index.html
    ```

    Then verify the build output is still inlined (no external script/link references remain after singlefile processing):

    ```bash
    # The dist file should NOT have an external <link rel="stylesheet"> — styles are inlined as <style>
    rg -F 'href="./styles.css"' apps/design-plugin/dist/index.html && echo "FAIL: stylesheet not inlined" || echo "OK: stylesheet inlined"
    # The dist file should NOT have an external <script src="./main.tsx"> — JS is inlined as <script>
    rg -F 'src="./main.tsx"' apps/design-plugin/dist/index.html && echo "FAIL: script not inlined" || echo "OK: script inlined"
    # The dist file SHOULD have a DOCTYPE
    rg -F '<!DOCTYPE html>' apps/design-plugin/dist/index.html
    ```
  </action>
  <verify>
    <automated>bun run build &amp;&amp; test -f apps/design-plugin/dist/index.html &amp;&amp; rg -F '&lt;!DOCTYPE html&gt;' packages/ui/src/index.html</automated>
  </verify>
  <acceptance_criteria>
    - `rg -nF '<!DOCTYPE html>' packages/ui/src/index.html` returns exactly 1 match.
    - `rg -nF '<html lang="en">' packages/ui/src/index.html` returns exactly 1 match.
    - `rg -nF '<head>' packages/ui/src/index.html` returns exactly 1 match.
    - `rg -nF '<body>' packages/ui/src/index.html` returns exactly 1 match.
    - `rg -nF '<meta charset="UTF-8"' packages/ui/src/index.html` returns exactly 1 match.
    - `rg -nF '<meta name="viewport"' packages/ui/src/index.html` returns exactly 1 match.
    - `rg -nF '<div id="root"></div>' packages/ui/src/index.html` returns exactly 1 match.
    - `rg -nF '<script type="module" src="./main.tsx"></script>' packages/ui/src/index.html` returns exactly 1 match.
    - `rg -nF 'http-equiv' packages/ui/src/index.html` returns 0 matches (no CSP meta tag).
    - `bun run build` exits 0.
    - `apps/design-plugin/dist/index.html` exists.
    - `rg -nF '<!DOCTYPE html>' apps/design-plugin/dist/index.html` returns at least 1 match.
    - `rg -nF 'href="./styles.css"' apps/design-plugin/dist/index.html` returns 0 matches (stylesheet was inlined).
    - `rg -nF 'src="./main.tsx"' apps/design-plugin/dist/index.html` returns 0 matches (script was inlined).
    - Maps to 16-VALIDATION.md rows 16-05-01 and 16-05-02.
  </acceptance_criteria>
  <done>`index.html` is conformant, the build succeeds, and the single-file output still inlines both the stylesheet and the module script.</done>
</task>

</tasks>

<verification>
1. `rg '<!DOCTYPE html>' packages/ui/src/index.html` — 1 match.
2. `bun run build` — exits 0.
3. `test -f apps/design-plugin/dist/index.html` — passes.
4. `rg 'href="./styles.css"' apps/design-plugin/dist/index.html` — 0 matches (inlined).
5. `rg 'src="./main.tsx"' apps/design-plugin/dist/index.html` — 0 matches (inlined).
</verification>

<success_criteria>
BUG-05 resolved: `packages/ui/src/index.html` is a conformant HTML document; vite-plugin-singlefile continues to inline the stylesheet and module script into a single-file dist output; `bun run build` is green.
</success_criteria>

<output>
Create `.planning/phases/16-bug-fixes-dark-mode/16-05-SUMMARY.md` recording:
- The verbatim new `index.html` content (12 lines)
- Confirmation that `dist/index.html` has the DOCTYPE and NO external references
- BUG-05 status: satisfied
</output>
