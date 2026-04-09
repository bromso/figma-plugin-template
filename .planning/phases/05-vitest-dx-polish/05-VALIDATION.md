---
phase: 5
slug: vitest-dx-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | packages/common/vitest.config.ts, packages/ui/vitest.config.ts |
| **Quick run command** | `turbo run test` |
| **Full suite command** | `turbo run test && turbo run test:watch --dry-run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `turbo run test`
- **After every plan wave:** Run `turbo run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 05-01-01 | 01 | 1 | TEST-01 | integration | `turbo run test` | ⬜ pending |
| 05-01-02 | 01 | 1 | TEST-02 | integration | `turbo run test:watch --dry-run` | ⬜ pending |
| 05-01-03 | 01 | 1 | TEST-04 | unit | `cd packages/common && bun run test` | ⬜ pending |
| 05-01-04 | 01 | 1 | TEST-05 | unit | `cd packages/ui && bun run test` | ⬜ pending |
| 05-02-01 | 02 | 1 | VSDX-03 | file check | `test -f .vscode/launch.json && grep vitest .vscode/launch.json` | ⬜ pending |
| 05-02-02 | 02 | 1 | TEST-03 | integration | `turbo run test --dry-run` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Vitest installed in packages/common and packages/ui
- [ ] vitest.config.ts created in both packages
