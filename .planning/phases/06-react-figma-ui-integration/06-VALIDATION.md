---
phase: 6
slug: react-figma-ui-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | `packages/ui/vitest.config.ts` |
| **Quick run command** | `bun run --filter @repo/ui test` |
| **Full suite command** | `bun run test` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun run --filter @repo/ui test`
- **After every plan wave:** Run `bun run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | UI-01 | — | N/A | unit | `bun run --filter @repo/ui test` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | UI-02 | — | N/A | unit | `bun run --filter @repo/ui test` | ❌ W0 | ⬜ pending |
| 6-01-03 | 01 | 1 | UI-04 | — | N/A | unit | `bun run --filter @repo/ui test` | ❌ W0 | ⬜ pending |
| 6-02-01 | 02 | 2 | UI-03 | — | N/A | manual | Figma plugin load test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/ui/src/__tests__/exports.test.ts` — verify all 14+ components are exported from index.ts
- [ ] `packages/ui/src/__tests__/smoke.test.tsx` — smoke render test for each re-exported component

*Existing vitest infrastructure covers framework needs. Only test files need creation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plugin loads in Figma without errors | UI-03 | Requires Figma desktop app runtime | Load dist/ output in Figma, verify no console errors |
| figma-plugin-ds CSS renders correctly | UI-02 | Visual verification of native Figma styling | Inspect component styles match Figma native UI appearance |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
