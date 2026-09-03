# pi-projects

<!-- Agent note: read `AGENTS.md` first. This is a superproject with Git submodules in `packages/` (not a single-repo monorepo). -->

<p align="center">
  <img src="https://raw.githubusercontent.com/arcanemachine/pi-projects/main/logo.jpg" alt="pi-projects logo" width="250" />
</p>

Superproject for arcanemachine's custom Pi extension packages.

## Packages

Packages live in `packages/` and are independently usable and versioned.

### Public packages

Packages which should be stable enough for use by others:

- [pi-advice](https://github.com/arcanemachine/pi-advice) - Get a single reconsideration prompt from a more powerful model, then continue working. (Good for giving a quick boost to weaker models.)
- [pi-context-available](https://github.com/arcanemachine/pi-context-available) - Show the agent its current context usage, capacity, and percentage.
- [pi-model-switcher](https://github.com/arcanemachine/pi-model-switcher) - Allow agents to autonomously switch from one LLM model to another.
- [pi-notify-marker](https://github.com/arcanemachine/pi-notify-marker) - When Pi is done working ("settled"), create a file. Used to provide notifications via a file-watcher script when running Pi in a container.
- [pi-read](https://github.com/arcanemachine/pi-read) - A tweaked Pi Read tool with configurable line/byte limits.
- [pi-retry](https://github.com/arcanemachine/pi-retry) - Retry stopped, stalled, or slow responses.
- [pi-role](https://github.com/arcanemachine/pi-role) - Create and use custom roles for your Pi sessions (e.g. architect, worker, etc.).
- [pi-session-snapshot](https://github.com/arcanemachine/pi-session-snapshot) - Save the current conversation as a snapshot to be reused across sessions.
- [pi-stash](https://github.com/arcanemachine/pi-stash) - Stash and restore one ephemeral Pi prompt with a keyboard shortcut.
- [pi-subagent](https://github.com/arcanemachine/pi-subagent) - Yet another subagent extension.
- [pi-supercompact](https://github.com/arcanemachine/pi-supercompact) - Improved compaction system. Intended to make your agent forget less after compaction.
- [pi-tree-editor](https://github.com/arcanemachine/pi-tree-editor) - Add, modify, and remove items in the /tree conversation history.
- [pi-web-search](https://github.com/arcanemachine/pi-web-search) Yet another web search extension. Supports DuckDuckGo (no config required) and Brave (requires API key; can use free tier)

### Personal packages

Packages which are intended for my own use:

- [pi-session-manager](https://github.com/arcanemachine/pi-session-manager) Use tmux to start a fleet of Pi sessions. (After starting, lifecycle can be managed by [inter-agent-pi](https://github.com/arcanemachine/inter-agent-pi))
- [pi-workflow](https://github.com/arcanemachine/pi-workflow) Create custom workflows for getting stuff done in different projects. (Basically just project-scoped skills that define how to proceed with a given task or set of tasks)

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
