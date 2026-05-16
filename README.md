# pi-projects

Monorepo for arcanemachine's Pi extension packages.

## Packages

Packages live in `packages/` and are independently installable/publishable.

- `packages/pi-inter-agent`
- `packages/pi-notify-marker`
- `packages/pi-read`
- `packages/pi-refresh`
- `packages/pi-subagent`
- `packages/pi-tool-guardrails`
- `packages/pi-web-search`

## Development

This repo uses pnpm workspaces.

```bash
pnpm install
pnpm run build
pnpm run typecheck
pnpm run test
```

## Pi

The repo root declares a Pi package manifest that loads all extensions. Individual packages can also be installed from their package directories.

```bash
pi install /path/to/pi-projects
pi install /path/to/pi-projects/packages/pi-read
```
