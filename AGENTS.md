# Agent Instructions

This is the root agent file for the `pi-projects` superproject.

## Core model (read first)

- This repo is a **superproject with Git submodules** under `packages/`.
- It is **not** a single-repo monorepo for package source control.
- Each package in `packages/*` is independently versioned and should remain independently usable.

## Scope and exploration

- Keep exploration focused. Do not scan the entire repository by default.
- For package work, inspect only:
  - `AGENTS.md` (this file)
  - root `package.json`
  - `.gitmodules`
  - target package directory in `packages/<name>`
- Only read additional files when required by the current task.

## Workflow rules

- Do not convert submodules into normal directories.
- Do not add monorepo/superproject implementation detail into child package docs unless requested.
- Runtime dependencies used by child package code must be declared in that child package.
- Use pnpm from the repo root for workspace validation.
- Do not push unless explicitly asked.
- The user probably knows what they work on. Don't brainstorm new extension ideas for them, unless prompted to do so.

## Commit order (critical)

When a child package changes:
1. Commit in the child package repo first.
2. Then commit the updated submodule pointer in the superproject.

## New package workflow

When adding a new extension package:
1. Create/clone it as a Git submodule at `packages/<name>`.
2. Ensure child package basics are complete (`package.json`, `pi` manifest, entrypoint, deps).
3. Add the package extension path to root `package.json` → `pi.extensions` for single-install workflow.
4. Update root docs only as needed (`README.md` package list).
5. Validate from root.
6. Commit child repo first, then superproject pointer/integration.

## Common commands

```bash
git submodule update --init --recursive
pnpm install
pnpm run build
pnpm run typecheck
pnpm run test
```
