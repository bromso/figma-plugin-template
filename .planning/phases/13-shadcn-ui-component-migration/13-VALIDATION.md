---
phase: 13
slug: shadcn-ui-component-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | `packages/ui/vitest.config.ts`, `packages/common/vitest.config.ts` |
| **Quick run command** | `bun run test` |
| **Full suite command** | `bun run test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun run test`
- **After every plan wave:** Run `bun run build && bun run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | UI-01 | — | N/A | integration | `bun run build` | N/A | ⬜ pending |
| 13-01-02 | 01 | 1 | UI-02 | — | N/A | integration | `bun run types` | N/A | �� pending |
| 13-02-01 | 02 | 1 | UI-03 | — | N/A | integration | `bun run build` | N/A | ⬜ pending |
| 13-03-01 | 03 | 2 | UI-04 | — | N/A | unit | `bun run test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. exports.test.ts will need updating for renamed components.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Components render with Figma-native appearance | UI-02 | Visual fidelity requires human inspection | Run `bun run dev:ui-only` and compare components to native Figma plugin UI |
| Design tokens produce correct colors | UI-02 | OKLCH approximations need visual calibration | Inspect computed CSS values in browser DevTools |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
