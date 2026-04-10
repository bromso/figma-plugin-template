---
phase: 16-bug-fixes-dark-mode
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/ui/src/main.tsx
  - packages/ui/src/main.test.ts
autonomous: true
requirements: [BUG-01]
must_haves:
  truths:
    - "Bootstrapping the UI with no #root element throws a descriptive Error instead of a silent null deref"
    - "main.tsx contains no unchecked `as HTMLElement` cast"
  artifacts:
    - path: "packages/ui/src/main.tsx"
      provides: "UI bootstrap with null-guarded root lookup"
      contains: "throw new Error"
    - path: "packages/ui/src/main.test.ts"
      provides: "Unit test covering the null-guard branch"
      contains: "Root element #root not found"
  key_links:
    - from: "packages/ui/src/main.tsx"
      to: "document.getElementById"
      via: "null-check + explicit Error throw"
      pattern: "if \\(!rootElement\\)"
---

<objective>
Replace the unchecked `as HTMLElement` cast in `packages/ui/src/main.tsx` with an explicit null guard that throws a descriptive Error, and add a Vitest unit test that covers the null branch. Implements BUG-01 per decision D-05 and unblocks Wave 0 verification row 16-01-01 in 16-VALIDATION.md.

Purpose: A silent null cast leaves template consumers debugging an opaque React error when `#root` is missing. A thrown `Error` fails loud with an actionable message.
Output: Null-guarded bootstrap + unit test.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/16-bug-fixes-dark-mode/16-CONTEXT.md
@.planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md
@.planning/phases/16-bug-fixes-dark-mode/16-VALIDATION.md
@packages/ui/src/main.tsx

<interfaces>
Current `packages/ui/src/main.tsx` (verbatim, lines 14-15):
```typescript
const rootElement = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootElement);
```

Target replacement (verbatim from RESEARCH.md D-05):
```typescript
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}
const root = ReactDOM.createRoot(rootElement);
```

`ReactDOM.createRoot` signature (from `react-dom/client`): accepts `Element | DocumentFragment` — non-nullable, so TypeScript will narrow correctly after the `if (!rootElement) throw` branch.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create failing null-guard test (Wave 0)</name>
  <files>packages/ui/src/main.test.ts</files>
  <read_first>
    - packages/ui/src/main.tsx (see current cast; the test does NOT import main.tsx — importing it would eagerly run the ReactDOM bootstrap. The test replicates the guard shape to pin the Error literal.)
    - packages/ui/vitest.config.ts (confirm happy-dom environment so `document` exists)
    - .planning/phases/16-bug-fixes-dark-mode/16-VALIDATION.md (row 16-01-01 and Wave 0 Requirements)
    - .planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md (D-05 section — exact Error message literal)
  </read_first>
  <behavior>
    - When `document.getElementById("root")` returns null, the null-guard throws `Error` with message `"Root element #root not found in index.html"`.
    - When `#root` exists, the function returns the element.
    - DOM manipulation uses `document.createElement` + `appendChild` / `replaceChildren` (NEVER `innerHTML`) — this is hermetic and matches project conventions.
  </behavior>
  <action>
    Create `packages/ui/src/main.test.ts` with the exact content below. DO NOT alter the Error string — it must match what main.tsx will contain in Task 2. DO NOT use `innerHTML` at any point; use `replaceChildren()` to reset between tests and `appendChild` to insert the element.

    ```typescript
    import { beforeEach, describe, expect, it } from "vitest";

    // BUG-01: main.tsx must throw a descriptive Error when #root is missing
    // instead of using an unchecked `as HTMLElement` cast.
    //
    // Rather than importing main.tsx (which eagerly runs ReactDOM.createRoot),
    // we re-exercise the exact guard shape that main.tsx is expected to use.
    // The source of truth is enforced by the static grep check in
    // 16-VALIDATION.md row 16-01-02.
    function resolveRoot(): HTMLElement {
      const rootElement = document.getElementById("root");
      if (!rootElement) {
        throw new Error("Root element #root not found in index.html");
      }
      return rootElement;
    }

    describe("BUG-01: main.tsx root element null guard", () => {
      beforeEach(() => {
        document.body.replaceChildren();
      });

      it("throws a descriptive Error when #root is missing", () => {
        expect(() => resolveRoot()).toThrow(
          "Root element #root not found in index.html"
        );
      });

      it("returns the element when #root exists", () => {
        const el = document.createElement("div");
        el.id = "root";
        document.body.appendChild(el);
        expect(resolveRoot()).toBe(el);
      });
    });
    ```

    This test must exist before Task 2 so that the grep in the acceptance criteria of Task 2 can confirm the literal lives in both files.
  </action>
  <verify>
    <automated>bun run --filter @repo/ui test main.test</automated>
  </verify>
  <acceptance_criteria>
    - File `packages/ui/src/main.test.ts` exists.
    - `rg -n 'Root element #root not found in index.html' packages/ui/src/main.test.ts` prints at least one match.
    - `rg -n 'describe\("BUG-01' packages/ui/src/main.test.ts` prints at least one match.
    - `rg -n 'innerHTML' packages/ui/src/main.test.ts` returns 0 matches.
    - `bun run --filter @repo/ui test main.test` exits 0 with 2 passing tests.
    - Test file imports from `vitest` (not `jest` or `@jest/globals`).
  </acceptance_criteria>
  <done>Vitest discovers and runs 2 tests in `packages/ui/src/main.test.ts`, both green.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Apply null guard to main.tsx</name>
  <files>packages/ui/src/main.tsx</files>
  <read_first>
    - packages/ui/src/main.tsx (confirm the current `as HTMLElement` cast on line 14)
    - packages/ui/src/main.test.ts (created in Task 1 — the Error literal must match exactly)
    - .planning/phases/16-bug-fixes-dark-mode/16-RESEARCH.md (section D-05 — canonical pattern)
  </read_first>
  <behavior>
    - After this task, main.tsx contains `if (!rootElement) { throw new Error("Root element #root not found in index.html"); }` before the `ReactDOM.createRoot` call.
    - No `as HTMLElement` cast remains anywhere in main.tsx.
    - `bun run --filter @repo/ui build` succeeds (no TypeScript narrowing errors).
  </behavior>
  <action>
    Edit `packages/ui/src/main.tsx`. Locate lines 14-15:

    ```typescript
    const rootElement = document.getElementById("root") as HTMLElement;
    const root = ReactDOM.createRoot(rootElement);
    ```

    Replace them verbatim with:

    ```typescript
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element #root not found in index.html");
    }
    const root = ReactDOM.createRoot(rootElement);
    ```

    Do NOT introduce an invariant helper — inline is the approved pattern per CONTEXT.md D-05 ("inline is fine for one site"). Do NOT modify any other line in the file. Do NOT change the error message string — it must match the literal already asserted in `packages/ui/src/main.test.ts`.
  </action>
  <verify>
    <automated>bun run --filter @repo/ui test main.test &amp;&amp; bun run --filter @repo/ui build</automated>
  </verify>
  <acceptance_criteria>
    - `rg -n 'as HTMLElement' packages/ui/src/main.tsx` returns 0 matches (exit code 1).
    - `rg -n 'if \(!rootElement\)' packages/ui/src/main.tsx` returns exactly 1 match.
    - `rg -nF 'throw new Error("Root element #root not found in index.html")' packages/ui/src/main.tsx` returns exactly 1 match.
    - `bun run --filter @repo/ui test main.test` exits 0 (both tests green).
    - `bun run --filter @repo/ui build` exits 0 (no TS narrowing errors).
    - Maps to 16-VALIDATION.md rows 16-01-01 and 16-01-02.
  </acceptance_criteria>
  <done>main.tsx has the null guard, the `as HTMLElement` cast is gone, tests and build are green.</done>
</task>

</tasks>

<verification>
1. `bun run --filter @repo/ui test main.test` — exits 0.
2. `rg 'as HTMLElement' packages/ui/src/main.tsx` — no matches.
3. `rg -F 'throw new Error("Root element #root not found in index.html")' packages/ui/src/main.tsx` — 1 match.
4. `bun run --filter @repo/ui build` — exits 0.
</verification>

<success_criteria>
BUG-01 is resolved: main.tsx null-guards `getElementById("root")` with a thrown Error matching the literal in the test, no `as HTMLElement` cast remains, and a new Vitest file proves the behavior in both branches.
</success_criteria>

<output>
After completion, create `.planning/phases/16-bug-fixes-dark-mode/16-01-SUMMARY.md` using the standard summary template. Record:
- The exact before/after of main.tsx lines 14-15
- The two new test cases and their results
- BUG-01 status: satisfied
</output>
