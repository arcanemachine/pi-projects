# Agent Instructions

This is the root agent file for the `pi-projects` superproject.

## Guidelines

- Child packages in `packages/` are Git submodules and independently versioned.
- Keep child packages independently usable.
- Do not add monorepo-specific details to child package docs unless requested.
- Runtime dependencies used by a child package must be declared in that package's own `dependencies` or appropriate Pi peer dependencies.
- Use pnpm from the repo root for workspace operations.
- Before workspace operations, ensure submodules are initialized and updated.

## New package workflow

When adding a new extension package, treat it as both an independent repo and part of this superproject.

1. Create or clone the child repo under `packages/<name>` as a Git submodule.
2. Ensure the child package is independently usable (`package.json`, `pi` manifest, runtime deps).
3. Add the child extension entry to root `package.json` → `pi.extensions` so root install includes it.
4. Update root `README.md` package list if needed.
5. Run workspace validation from root.
6. Commit changes in the child repo first, then commit updated submodule pointer + root integration in the superproject.

## Common commands

```bash
git submodule update --init --recursive
pnpm install
pnpm run build
pnpm run typecheck
pnpm run test
```
