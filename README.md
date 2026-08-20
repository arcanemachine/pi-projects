# pi-projects

> Agent note: read `AGENTS.md` first. This is a superproject with Git submodules in `packages/` (not a single-repo monorepo).

Superproject for arcanemachine's custom Pi extension packages.

## Packages

Packages live in `packages/` and are independently usable and versioned.

- [pi-advice](https://github.com/arcanemachine/pi-advice) - Get a single reconsideration prompt from a more powerful model, then continue working. (Good for giving a quick boost to weaker models.)
- [pi-notify-marker](https://github.com/arcanemachine/pi-notify-marker) - When Pi is done working ("settled"), create a file. Used to provide notifications via a file-watcher script when running Pi in a container.
- [pi-read](https://github.com/arcanemachine/pi-read) - A tweaked Pi Read tool with configurable line/byte limits.
- [pi-retry](https://github.com/arcanemachine/pi-retry) - Retry stopped, stalled, or slow responses.
- [pi-role](https://github.com/arcanemachine/pi-role) - Create and use custom roles for your Pi sessions (e.g. architect, worker, etc.).
- [pi-session-manager](https://github.com/arcanemachine/pi-session-manager) (unstable, personal; not recommended for shared use) - Use tmux to start a fleet of Pi sessions.
- [pi-session-snapshot](https://github.com/arcanemachine/pi-session-snapshot) - Save the current conversation as a snapshot to be reused across sessions.
- [pi-subagent](https://github.com/arcanemachine/pi-subagent) - Yet another subagent extension.
- [pi-supercompact](https://github.com/arcanemachine/pi-supercompact) - Improved compaction system. Intended to forget less between compactions.
- [pi-tree-editor](https://github.com/arcanemachine/pi-tree-editor) - Add, modify, and remove items in the /tree conversation history.
- [pi-web-search](https://github.com/arcanemachine/pi-web-search) (personal, not recommended for shared use) - Yet another web search extension.
- [pi-workflow](https://github.com/arcanemachine/pi-workflow) (personal, not recommended for shared use) - Create custom workflows for getting stuff done in different projects. (Basically just project-scoped skills)

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
