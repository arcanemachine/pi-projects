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
- Runtime and dev dependencies used by a child package must be declared in that child package.
- Use pnpm from the repo root for workspace validation.
- When adding package-specific dependencies from the superproject, use `pnpm --filter <package-name> add [-D] <dependency>` from the repo root. This updates the child package manifest and the root lockfile while keeping the child package standalone.
- Follow commit instructions from the most specific applicable agent file (for example `packages/<name>/AGENTS.md`). When work is complete, make the required commit(s) before reporting completion.
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

## Test-runner capture quirk

Vitest invocations intermittently return completely empty captured output (no `Test Files` line, no `END`) despite exiting `0` with passing tests — a harness/pipe capture artifact, not a test failure. Run a single package's tests with file redirection and a sentinel so an empty capture is obvious, and kill the vitest process pattern with a bracketed class so `pkill` cannot match its own shell:

```bash
cd /workspace/projects/pi/packages/<pkg> && pkill -9 -f '[v]itest' || true; sleep 1
echo BEFORE; node node_modules/vitest/vitest.mjs run --reporter=default > /tmp/v.log 2>&1; echo "rc=$?"; tail -6 /tmp/v.log
```

Bare `pkill -9 -f vitest` can match the running shell itself; the `[v]itest` class avoids that. Run `pnpm --filter <package-name>` from the superproject root `/workspace/projects/pi`, not from inside the package.
