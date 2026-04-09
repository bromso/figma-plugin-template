---
phase: 2
slug: package-extraction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell commands (no test framework — infrastructure phase) |
| **Config file** | none |
| **Quick run command** | `bun install && turbo run build --dry-run` |
| **Full suite command** | `bun install && turbo run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun install && turbo run build --dry-run`
- **After every plan wave:** Run `bun install && turbo run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 02-01-01 | 01 | 1 | MONO-01 | file check | `test -d apps/figma-plugin/src && test -d packages/common/src && test -d packages/ui/src` | ⬜ pending |
| 02-01-02 | 01 | 1 | MONO-04 | integration | `node -e "const p=require('./packages/common/package.json'); console.log(p.exports)"` | ⬜ pending |
| 02-01-03 | 01 | 1 | MONO-03 | integration | `grep 'workspace:\\*' packages/ui/package.json` | ⬜ pending |
| 02-01-04 | 01 | 1 | MONO-05 | integration | `grep '@repo/common' packages/ui/package.json && grep '@repo/ui' apps/figma-plugin/package.json` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No test stubs needed — infrastructure phase uses CLI verification commands
