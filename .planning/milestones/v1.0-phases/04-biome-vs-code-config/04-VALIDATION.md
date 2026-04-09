---
phase: 4
slug: biome-vs-code-config
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell commands + VS Code manual verification |
| **Config file** | biome.json |
| **Quick run command** | `bun run lint` |
| **Full suite command** | `turbo run lint && bun run lint` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun run lint` (root)
- **After every plan wave:** Run `turbo run lint`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 04-01-01 | 01 | 1 | LINT-01 | integration | `bunx biome check --max-diagnostics=5 .` | ⬜ pending |
| 04-01-02 | 01 | 1 | LINT-02 | integration | `bun run lint` | ⬜ pending |
| 04-01-03 | 01 | 1 | LINT-03 | file check | `grep -q "organizeImports" biome.json` | ⬜ pending |
| 04-02-01 | 02 | 1 | VSDX-01 | file check | `test -f .vscode/extensions.json && grep biomejs .vscode/extensions.json` | ⬜ pending |
| 04-02-02 | 02 | 1 | VSDX-02 | file check | `test -f .vscode/tasks.json` | ⬜ pending |
| 04-02-03 | 02 | 1 | VSDX-04 | file check | `ls *.code-workspace` | ⬜ pending |
| 04-02-04 | 02 | 1 | MONO-06 | manual | VS Code format-on-save with Biome | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No test stubs needed — infrastructure phase uses CLI verification commands
