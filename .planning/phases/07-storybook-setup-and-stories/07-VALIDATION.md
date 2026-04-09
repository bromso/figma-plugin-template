---
phase: 7
slug: storybook-setup-and-stories
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Storybook test-runner + vitest |
| **Config file** | `apps/storybook/.storybook/main.ts` |
| **Quick run command** | `bun run --filter @repo/storybook build-storybook` |
| **Full suite command** | `bun run test && bun run --filter @repo/storybook build-storybook` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun run --filter @repo/ui test`
- **After every plan wave:** Run `bun run test && bun run --filter @repo/storybook build-storybook`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | SB-01 | — | N/A | build | `bun run --filter @repo/storybook build-storybook` | ❌ W0 | ⬜ pending |
| 7-01-02 | 01 | 1 | SB-02 | — | N/A | build | `turbo run build-storybook` | ❌ W0 | ⬜ pending |
| 7-02-01 | 02 | 2 | SB-03 | — | N/A | manual | Start storybook, check sidebar | N/A | ⬜ pending |
| 7-02-02 | 02 | 2 | SB-04 | — | N/A | build | `turbo run build-storybook && turbo run build-storybook` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers framework needs. Storybook app is created as part of the phase tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Every component has Controls and Autodocs in sidebar | SB-03 | Requires visual inspection of Storybook UI | Start storybook, expand sidebar, verify each of 14 components shows Controls tab and Autodocs page |
| Viewport switcher shows 3 Figma presets | SB-04 | Requires Storybook viewport toolbar interaction | Open viewport dropdown, verify Small/Medium/Large Figma presets |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
