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

For local development, the repo root can be installed as a Pi package to load all extensions. Individual packages can also be installed from their package directories.
