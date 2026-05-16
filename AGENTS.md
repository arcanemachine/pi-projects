# Agent Instructions

This is the root agent file for the `pi-projects` monorepo.

## Guidelines

- Child packages in `packages/` are Git submodules and independently versioned.
- Keep child packages independently usable.
- Do not add monorepo-specific details to child package docs unless requested.
- Runtime dependencies used by a child package must be declared in that package's own `dependencies` or appropriate Pi peer dependencies.
- Use pnpm from the repo root for workspace operations.
- Before workspace operations, ensure submodules are initialized and updated.

## Common commands

```bash
git submodule update --init --recursive
pnpm install
pnpm run build
pnpm run typecheck
pnpm run test
```
