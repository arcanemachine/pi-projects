# pi-projects

> Agent note: read `AGENTS.md` first. This is a superproject with Git submodules in `packages/` (not a single-repo monorepo).

Superproject for arcanemachine's custom Pi extension packages.

## Packages

Packages live in `packages/` and are independently usable and versioned.

- [pi-notify-marker](https://github.com/arcanemachine/pi-notify-marker)
- [pi-read](https://github.com/arcanemachine/pi-read)
- [pi-retry](https://github.com/arcanemachine/pi-retry)
- [pi-subagent](https://github.com/arcanemachine/pi-subagent)
- [pi-web-search](https://github.com/arcanemachine/pi-web-search)

## Development

This repo uses Git submodules under `packages/`.

Clone with submodules:

```bash
git clone --recurse-submodules git@github.com:arcanemachine/pi-projects.git
```

If already cloned:

```bash
git submodule update --init --recursive
```

Workspace commands:

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
