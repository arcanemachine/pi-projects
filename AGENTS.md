# Agent Instructions

This is the root agent file for the `pi-projects` monorepo.

## Guidelines

- Keep child packages independently usable.
- Do not add monorepo-specific details to child package docs unless requested.
- Runtime dependencies used by a child package must be declared in that package's own `dependencies` or appropriate Pi peer dependencies.
- Use pnpm from the repo root for workspace operations.

## Common commands

```bash
pnpm install
pnpm run build
pnpm run typecheck
pnpm run test
```
