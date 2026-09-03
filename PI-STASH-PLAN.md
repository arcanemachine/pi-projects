# pi-stash implementation plan

> Temporary execution artifact. This file is intentionally removed during the final closeout described in **Closeout and plan removal**. It must not become durable project guidance.

## Objective

Create and integrate a small Pi extension named `pi-stash`, published as `@arcanemachine/pi-stash` if and when the user authorizes npm release. While the Pi prompt editor is focused, one configurable shortcut toggles a single ephemeral scratch register:

- A non-empty prompt is moved into the register and the editor is cleared.
- An empty prompt restores the register into the editor and clears the register.
- An empty prompt with an empty register is a no-op except for at most one consecutive plain Pi notification saying `Stash register is empty`.
- After another interactive prompt is submitted while a register value exists, that value is restored into the editor immediately and the register is cleared, ready for the next message.

The extension is intentionally small, TUI-oriented, in-memory, and free of persistent stash data, transcript entries, custom widgets, tools, commands, or package-owned configuration files.

## Current verified facts

### Superproject and package model

- `/workspace/projects/pi` is the `pi-projects` superproject, not a monorepo containing ordinary package directories.
- Every package under `packages/` is an independently versioned Git repository used as a submodule.
- The root `package.json` loads all integrated extension entrypoints through `pi.extensions` and uses recursive `pnpm` scripts for build, typecheck, and test.
- Root `AGENTS.md` requires a child-repository-first commit, followed by the superproject submodule-pointer/integration commit. It also warns that the root formatter rewrites sibling packages and must not be used for focused package work.
- The user has created the public GitHub repository `arcanemachine/pi-stash`; the implementation may add it as `packages/pi-stash` using the repository's existing submodule convention.

### Pi extension APIs and runtime behavior

The authoritative local sources are installed under `/usr/local/share/npm-global/lib/node_modules/@earendil-works/pi-coding-agent/`.

- `docs/extensions.md` documents `pi.registerShortcut(shortcut, { description, handler })`, `ctx.ui.getEditorText()`, `ctx.ui.setEditorText(text)`, `ctx.ui.notify(message, type)`, the `input` event, and `agent_settled`.
- `docs/keybindings.md` defines shortcut strings as `modifier+key`, including `ctrl+s`, and documents the supported modifiers and key names.
- `docs/settings.md` and `docs/packages.md` define Pi's main settings locations, package metadata, and gallery discovery.
- The installed type declarations confirm that `registerShortcut` takes a `KeyId`, editor text methods are available on `ExtensionUIContext`, and `input` carries `source` and `streamingBehavior`.
- The installed interactive-mode implementation wires extension shortcuts into the focused editor before ordinary app actions. A custom editor receives the same forwarding hook.
- The installed TUI editor clears its internal text state before calling `onSubmit`. Consequently, an ordinary interactive submission is observed by an extension's `input` handler after the editor has become empty.
- The installed `AgentSession.prompt()` emits `input` after extension-command dispatch and before template expansion, validation, and the agent loop. It skips the event for extension commands handled earlier.
- `agent_settled` is intentionally later than the required behavior: it waits for the full run, retries, compaction, and queued continuations. It must not be used for the V1 immediate editor restoration path.
- Pi's extension API does not expose a settings getter. An extension that needs settings must use the Pi-provided `SettingsManager` or direct file access. This plan uses `SettingsManager` and does not create a second config file.
- Extension shortcuts are raw key identities rather than namespaced entries in `keybindings.json`; this Pi version does not provide an extension API for adding a remappable namespaced keybinding definition. The configured shortcut therefore comes from the extension's namespace in Pi's main settings and is registered when the extension factory loads.
- `ctx.ui.notify` is the ordinary Pi notification API. The `examples/extensions/notify.ts` terminal OSC implementation is a different feature and must not be used for the empty-register message.

### Existing package baseline

The closest maintained package baselines are `packages/pi-model-switcher` and `packages/pi-session-snapshot`:

- `src/index.ts` is the source-loaded entrypoint and `pi.extensions` points to it.
- Package metadata includes `pi-package`, Pi extension keywords, optional peer dependencies for imported Pi packages, `files`, repository metadata, `engines`, and `publishConfig.access` for a scoped public npm package.
- Maintained packages provide `typecheck`, `test`, `build`, `format:check`, and usually `prepublishOnly`; package-local checks are preferred over the destructive root formatter.
- A README, CHANGELOG, MIT license, and per-package `AGENTS.md` are house-style documentation. A logo and `pi.image` are optional until the user decides whether to add one.
- Pi source-loads TypeScript through its extension loader, so a compiled runtime artifact is not required. The package still needs the house-style build script so root/package validation has stable command names.

## User-approved decisions

1. Package name: `pi-stash`.
2. npm package name: `@arcanemachine/pi-stash`.
3. The extension settings namespace is exactly `pi-stash`, not `stash` or another shortened key.
4. The shortcut defaults to `ctrl+s` and is configurable through Pi's main settings file. The extension must not create a package-owned config file.
5. The register is one ephemeral in-memory value. Overwriting it is allowed without confirmation; no persistence, session entry, transcript message, or stash history is needed.
6. The editor/register state transitions and immediate post-submit restoration described in this plan are the intended V1 behavior.
7. The extension should remain UI-light: no status widget, footer affordance, custom editor, tool, slash command, or visible stash indicator is required.
8. The package is to be integrated as an independent Git submodule in the superproject, then validated locally. No push or npm publish is authorized by this plan.
9. The temporary workflow notes in root `AGENTS.md` must be revisited during closeout. Only durable improvements belong in the permanent workflow; the temporary section itself must be removed.

## Settings contract

Read the global Pi settings file through Pi's `SettingsManager` during extension initialization. The exact user-facing shape is:

```json
{
  "pi-stash": {
    "shortcut": "ctrl+s"
  }
}
```

Rules:

- The global file is Pi's normal `~/.pi/agent/settings.json`; do not create `~/.pi/agent/extensions/pi-stash.json`, `.pi/pi-stash.json`, or another package-owned settings file.
- Use the extension name as the top-level key: `pi-stash`.
- Omitted `shortcut` uses `ctrl+s`.
- A valid configured shortcut is a documented Pi `KeyId` in `modifier+key` form. Normalize harmless surrounding whitespace and use a deterministic case convention compatible with Pi's matcher.
- Invalid or unusable values fall back to `ctrl+s` and produce one warning through the available startup path rather than preventing the extension from loading. Do not silently register a shortcut that can never match.
- Settings parsing is global-only for V1. Do not add trusted project settings, settings mutation, a settings UI, or a second config source.
- If global settings cannot be read, retain the default shortcut and report the failure through the normal noninteractive-safe warning path.
- The package may use a small pure resolver so malformed settings can be unit-tested without touching the real agent directory. Tests must inject or mock settings access rather than reading a developer's actual `~/.pi/agent/settings.json`.

The implementation owner may choose the exact runtime validation helper and warning wording, but must preserve this public contract and fallback behavior.

## Behavioral contract

### Shortcut action

Register exactly one extension shortcut: the resolved configured shortcut, defaulting to `ctrl+s`. The handler must be safe to call from the interactive TUI editor and must use the handler's current `ctx`, not a stale captured session context.

Define the register as absent/empty or a string value. The handler follows this table:

| Current editor           | Register           | Result                                                                                                                                                  |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| empty after trimming     | empty              | Do not alter editor/register; show `ctx.ui.notify("Stash register is empty", "info")` at most once for the current consecutive empty/no-stash condition |
| empty after trimming     | populated          | Set editor text to the exact register string, clear the register, and reset notification suppression                                                    |
| non-empty after trimming | empty or populated | Replace the register with the exact current editor text, clear the editor, and reset notification suppression                                           |

“Exact” means preserve multiline content and intentional leading/trailing whitespace once the editor is classified as non-empty. Trimming is only for deciding whether the editor is empty.

The shortcut must not send a message, write session data, or open a UI prompt.

### Immediate restoration after another prompt is submitted

Subscribe to the `input` event. When all of the following hold:

- the event source is `interactive`;
- the register is populated; and
- the input is being processed as a normal interactive submission;

set the editor text to the exact register value and clear the register before returning from the handler. This is the “pop into the next message” behavior: it happens after the editor has cleared the submitted prompt and before Pi proceeds with expansion/agent processing.

Reset empty-notification suppression when an interactive input is observed, whether or not a register exists, so a later genuinely empty/no-stash shortcut action can notify once again.

Do not restore from input events whose source is `rpc` or `extension`. RPC has no readable TUI draft, and extension-injected messages must not consume a user's scratch register. Do not add restoration hooks for `agent_settled`; doing so would delay restoration and could overwrite text the user began typing while the agent is busy.

If Pi rejects the prompt after the input hook (for example, authentication or model validation), the register has already been restored to the editor. This is intentional: the scratch text remains visible rather than being lost, and the user can retry or edit it.

A user may press the shortcut again after automatic restoration; that is an ordinary new toggle and may stash/replace the restored text again.

### Notification suppression

Use local extension state to avoid appending the identical empty-register notification repeatedly during one consecutive empty/no-stash condition. The extension API notification is transient; do not attempt to inspect or mutate Pi's transcript to implement deduplication.

- The first empty/no-stash shortcut action calls `ctx.ui.notify("Stash register is empty", "info")`.
- Repeated empty/no-stash shortcut actions without an intervening successful stash/pop or interactive input do not call notify again.
- Successful stash/pop and observed interactive input reset the suppression state.
- Reload/session replacement naturally resets all ephemeral state because the extension factory creates a new in-memory register.

## Implementation boundaries

### In scope

- New child package repository at `packages/pi-stash` linked as a Git submodule to `https://github.com/arcanemachine/pi-stash.git` using the existing `.gitmodules` style.
- A focused `src/index.ts` implementation and pure helpers only where they make state/config behavior testable.
- Package metadata and docs required for Pi package discovery and the superproject's single-install workflow.
- Unit tests for configuration resolution, shortcut transitions, notification suppression, input-source filtering, and exact text preservation.
- Root integration in `.gitmodules`, `package.json` → `pi.extensions`, and the appropriate root README package list.
- Package-local verification, root validation, and isolated live TUI verification.
- A retrospective of the temporary new-extension workflow notes, with evergreen improvements integrated into root `AGENTS.md` before removing the temporary section.

### Explicitly out of scope

- Persistent stash data, session entries, cross-session restore, disk files, clipboard integration, multiple registers, history, undo, or named stashes.
- A custom editor, widget, footer/status indicator, slash command, tool, transcript message, or desktop/terminal notification.
- A package-owned configuration file, project-specific settings behavior, settings UI, or automatic settings mutation.
- A new generic scaffold generator or broad refactor of sibling packages.
- Pushing the GitHub repository or publishing to npm. Those are separate user decisions at closeout.
- Creating a logo unless the user elects that at closeout.
- Root-wide formatting or unrelated sibling-package changes.

## Package structure and metadata requirements

Create the child package in the already-created GitHub repository and integrate it as a submodule. Match the maintained house style unless a requirement below conflicts with the approved behavior:

- `AGENTS.md`: package-local instructions, including package-local verification, live TUI verification, child-first commit order, and no push/publish without explicit authorization.
- `package.json`: name `@arcanemachine/pi-stash`, initial development version consistent with the other new public packages (use `0.1.0` unless the repository already establishes a different version), one-line description, `type: module`, Pi extension keywords including `pi-package`, `pi` manifest with `extensions: ["./src/index.ts"]`, scripts named `build`, `typecheck`, `test`, `format`, `format:check`, and `prepublishOnly`, author/license/repository/homepage/bugs/engines metadata, `publishConfig.access: "public"`, and `files` containing only files that exist and should ship.
- Pi peer dependencies: declare `@earendil-works/pi-coding-agent` as an optional peer and add other Pi packages only if the implementation imports them. Runtime third-party dependencies are not expected for V1. Keep Pi packages out of runtime `dependencies`.
- `tsconfig.json`: follow the maintained TypeScript/NodeNext strict configuration, including tests as appropriate.
- `src/index.ts`: source-loaded extension entrypoint; no compiled runtime file is required for Pi.
- `tests/index.test.ts`: deterministic Vitest coverage of the pure behavior and extension registration/handler wiring.
- `README.md`: explain what the stash does, the exact state table, default shortcut, `pi-stash.shortcut` settings example, TUI-only nature, installation/local development, limitations, and verification commands. Include the standard link to other Pi extensions.
- `CHANGELOG.md`: initial Keep-a-Changelog/SemVer entry for the new behavior.
- `LICENSE.md`: the maintained MIT license text.
- Logo files and `pi.image` are deferred until the closeout question is answered; do not invent artwork or claim gallery metadata that does not exist.

Use the child package's own scripts for formatting and checks. Do not run the root `pnpm run format` for this focused change.

## Root integration requirements

After the child package is complete and committed in its own repository:

1. Ensure `.gitmodules` contains the new submodule path and repository URL in the same style as existing entries.
2. Add `./packages/pi-stash/src/index.ts` to root `package.json` → `pi.extensions` exactly once.
3. Add `pi-stash` to the appropriate root `README.md` package list with a durable one-line description. Keep the public/personal classification consistent with the user's intended public GitHub repository; do not add transient implementation notes.
4. Update the root lockfile only if the workspace/package-manager operation requires it. Do not hand-edit unrelated importer data.
5. Run root validation from `/workspace/projects/pi` with `pnpm`, while keeping package-local checks as the authoritative focused checks.
6. Review `git status` and the complete diff so no generated `dist/`, node_modules, logs, unrelated package changes, or personal settings files enter either commit.

## Verification plan

### Package-local deterministic checks

From `/workspace/projects/pi/packages/pi-stash`:

1. Install or refresh only the child package's declared development dependencies using the repository's normal standalone package command; do not turn the submodule into a workspace-owned ordinary directory.
2. Run `npm run format:check` before and after edits. If formatting drift exists in untouched files, report it rather than hiding it in a behavior commit.
3. Run `npm run typecheck`.
4. Run `npm run test` with the repository's Vitest capture workaround if captured output is empty; use the bracketed `[v]itest` process pattern described in root `AGENTS.md`.
5. Run `npm run build`.
6. Run `npm pack --dry-run` and verify the tarball contains the intended source/docs/metadata but no development-only files or generated artifacts.

Tests must cover at least:

- default and configured shortcut resolution under the exact `pi-stash` namespace;
- invalid/blank shortcut fallback and one warning decision;
- non-empty editor text stashing, exact multiline preservation, overwrite without confirmation, and editor clearing;
- empty editor restoration and register clearing;
- empty editor/register no-op with one-notification suppression;
- immediate restoration on `input` with `source: "interactive"`;
- no consumption/restoration for `rpc` and `extension` input sources;
- notification suppression reset after a successful action or interactive input;
- one shortcut registration using the resolved key.

Use fake `ExtensionAPI`/`ExtensionContext` objects or pure functions. Do not read or write the developer's real Pi settings or agent directory in tests.

### Root checks

From `/workspace/projects/pi`:

- Run the focused package checks through the package directory as required by its package guidance.
- Run `pnpm run typecheck` and `pnpm run test` from the root; run `pnpm run build` if it is part of the final root validation budget and the package scripts permit it. Do not run the destructive root formatter.
- Confirm the root manifest resolves the new `pi.extensions` entry and the submodule is initialized.
- Inspect `git diff --check` and the complete staged diff.

### Live TUI verification

Exercise the actual extension in an isolated Pi runtime/agent directory and a fresh interactive session, not only through unit tests. Use the installed Pi CLI and documented extension-loading mechanism (`pi -e ./src/index.ts` or the integrated root manifest), with test settings isolated from the user's normal `~/.pi/agent` data.

Verify manually:

1. Start with an empty editor and no register; press the configured shortcut and see one plain Pi `Stash register is empty` notification. Press again and confirm no duplicate notification appears.
2. Type a multiline prompt containing meaningful text, press Ctrl+S, and confirm the editor clears.
3. Type a different prompt and submit it. Confirm the original stashed prompt immediately returns to the editor while the agent processes the submitted prompt, and confirm the register is then empty.
4. Press Ctrl+S with the restored prompt to stash it again, then Ctrl+S with an empty editor to restore it; confirm the toggle is exact.
5. Configure a different shortcut under `pi-stash.shortcut` in the isolated global Pi settings file, reload/restart as appropriate, and confirm the configured shortcut works while Ctrl+S no longer performs the stash action.
6. Exercise a failed or unavailable submission if practical and confirm restored scratch text is not lost.
7. Confirm no custom widget, transcript message, desktop notification, or package-owned config file is created.

Record any behavior that differs from the verified contract and stop for a decision if it changes the product behavior rather than fixing an implementation defect.

## Closeout and plan removal

Closeout is ordered and must not be skipped:

1. Review implementation, package metadata, root integration, tests, live behavior, and the complete working-tree diff against this plan.
2. Classify the temporary workflow notes as durable guidance, deferred idea, or no-action observation. Integrate only durable evergreen improvements into the main `New package workflow` and related permanent guidance. In particular, preserve the plain `ctx.ui.notify` rule in `AGENTS.md`.
3. Remove the entire temporary draft section from root `AGENTS.md` after integration. Do not leave a stale process diary or references to this specific extension in evergreen guidance.
4. Ask the user, explicitly and separately, whether they want to add a logo/gallery image and whether they want to release `@arcanemachine/pi-stash` to npm. If npm release is desired, confirm the logo decision before publishing because the user's general rule is to have a logo when releasing to npm.
5. Do not push or publish without explicit authorization. A release decision is not implied by successful local packaging.
6. Delete `/workspace/projects/pi/PI-STASH-PLAN.md` as required by this plan. The deletion belongs in the final superproject integration/closeout commit, after the child package commit and all verification.
7. Commit the child repository first. Then commit the superproject changes: submodule pointer, `.gitmodules`, root manifest/README, permanent workflow guidance, and plan-file deletion. Stage only files belonging to this work.
8. Report the final paths, checks, live verification result, commit order, whether the logo/release questions were answered, and the reminder that the temporary plan was intentionally removed.

## Stop conditions

Stop and return to the user before proceeding if:

- the GitHub repository cannot be added as the required independent submodule;
- any source or runtime behavior contradicts the immediate restoration contract in a way that requires product interpretation;
- Pi's installed API cannot register the configured shortcut or read/set the editor as planned;
- a package metadata, dependency, publishing, or logo choice is required beyond the approved boundaries;
- tests or live TUI behavior fail and the cause is not a narrow implementation defect;
- unrelated dirty changes, generated files, or conflicting root integration appear;
- a requested push, npm publication, or release action lacks explicit user authorization.
