---
phase: 09-license-security-contributing-readme-update
plan: 02
subsystem: documentation
tags: [contributing, readme, docs, monorepo]
dependency_graph:
  requires: []
  provides: [CONTRIBUTING.md, README.md]
  affects: [onboarding, contributor-experience]
tech_stack:
  added: []
  patterns: []
key_files:
  created:
    - CONTRIBUTING.md
    - README.md
  modified: []
decisions:
  - Replaced the upstream CoconutGoodie README with project-specific documentation reflecting the v1.1 monorepo structure
  - README uses Bun commands throughout (not npm) to match the actual package manager
key-decisions:
  - Replaced upstream README with monorepo-accurate documentation using Bun commands
metrics:
  duration: 8m
  completed: 2026-04-09T20:13:26Z
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
requirements_satisfied:
  - DOC-04
  - DOC-05
---

# Phase 09 Plan 02: CONTRIBUTING.md and README.md Summary

CONTRIBUTING.md and README.md created with accurate monorepo documentation using Bun commands, Turborepo structure, and two-process plugin architecture.

## What Was Built

**CONTRIBUTING.md** — Full contributor onboarding guide covering:
- Prerequisites (Node >=18, Bun >=1.0, Figma desktop)
- Clone and install steps with `bun install`
- Dev workflow commands table
- Monorepo project structure (apps/ and packages/)
- JIT source-only packages explanation
- Testing in Figma (build then import manifest)
- PR submission workflow
- Code style guidelines (Biome, TypeScript strict, @repo/* imports)

**README.md** — Complete project documentation covering:
- Project description and features list (8 key features)
- Quick start with `bun install` and `bun run dev`
- Project structure tree (apps/figma-plugin, apps/storybook, packages/common, packages/ui)
- Commands table (7 commands matching actual package.json scripts)
- Architecture section (two-process model + monorepo-networker messaging)
- UI components list (14 react-figma-ui components)
- Plugin configuration (editing figma.manifest.ts, getting plugin ID from Figma)
- Testing in Figma steps
- Tech stack table (Bun 1.3.11, Turborepo, Vite 6, Biome 2.4.10, Vitest 4.x, Storybook 8.6.18)
- Links to CONTRIBUTING.md and LICENSE

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create CONTRIBUTING.md | c494a3b | CONTRIBUTING.md |
| 2 | Create README.md | f356a1a | README.md |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all content reflects actual project state.

## Threat Flags

None - static documentation files only, no new security surface introduced.

## Self-Check: PASSED

- CONTRIBUTING.md exists: FOUND
- README.md exists: FOUND
- Commit c494a3b exists: FOUND
- Commit f356a1a exists: FOUND
