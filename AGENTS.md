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

### Misc workflow guidelines

- For a plain user-facing Pi extension notification, use `ctx.ui.notify(message, type)`. Do not substitute terminal notification protocols, desktop notification commands, or a custom transcript message when the requirement is an ordinary Pi notification.

## Planning and project meta-documents

- Store project plans, design notes, ideas, task lists, and other project/process meta-documents in the superproject under `docs/<project-name>/`, where `<project-name>` matches the project or extension name.
- For an active effort, use `docs/<project-name>/PLAN.md` as its canonical plan when a plan is needed. Add other focused documents in the same directory when useful.
- Keep these planning and meta-documents out of child package repositories. Child repositories should contain implementation, user-facing package documentation, and package-local maintenance instructions—not superproject coordination artifacts.
- Treat plan files as working documents: update them as decisions change, and remove them when the plan's closeout instructions say they are no longer needed.

## Package documentation and metadata

When creating or materially updating an extension package:

- Match the current maintained package baseline: source-loaded `src/index.ts`, TypeScript, Vitest, Prettier, `pi.extensions`, optional Pi peer dependencies, `pi-package` discovery metadata, and a complete npm manifest.
- Read `/workspace/projects/pi/_git/pi-package-template/AGENTS.md` and its `package.json` before creating a package. Treat that template as the authoritative Pi resource-manifest and npm-metadata baseline, adapting its resource directories to the package's actual contents without adding unused resource types.
- Before finalizing a new package, assign a focused documentation survey: have a sub-agent inspect several recently maintained sibling extensions and recent documentation edits, report concrete README/AGENTS/changelog/metadata and workflow conventions, then independently verify the findings. Make the new package documentation match the verified current style rather than copying an arbitrary older package.
- Check the package metadata for the scoped package name, `pi-package` keyword, `pi.extensions`, `files`, repository, homepage, bugs, Node engine, `publishConfig.access`, and optional peer dependencies. Add only dependencies the implementation actually imports.
- Put extension settings in Pi's main `settings.json` under an exact top-level namespace matching the extension name unless a package-owned config file is explicitly approved. Do not invent a second configuration file by default.
- Verify package-local `format:check`, `typecheck`, `test`, `build`, and `npm pack --dry-run`, then run the applicable root `pnpm` validation and an isolated live TUI check for user-facing behavior. Do not run the destructive root formatter for focused package work.
- Verify that a new package's remote repository has a reachable commit before using it as a submodule. If the remote is empty and pushing is not authorized, initialize the child locally, record the intended remote URL, and call out the required follow-up rather than pretending the remote is cloneable.

## Logos and gallery assets

- When an extension has a gallery logo, the asset must be named `logo.jpg`, be exactly 500×500 pixels, and be encoded as JPEG.
- Add the standard centered 250-pixel logo image with descriptive alt text to the package README.
- Reference the raw GitHub asset in `package.json` → `pi.image` and include `logo.jpg` in the published `files` list.
- Ask at closeout whether the package should receive a logo/gallery image and whether it should be released to npm. Under the project convention, an npm release requires a logo. Do not publish or push without explicit authorization.

## Commit order (critical)

When a child package changes:

1. Commit in the child package repo first.
2. Then commit the updated submodule pointer in the superproject.

## New package workflow

When adding a new extension package:

1. Verify the intended remote repository is reachable and has a commit. Create/clone it as a Git submodule at `packages/<name>`; if the remote is empty and pushing is not authorized, initialize the child locally, set the intended remote URL, and record the follow-up needed before external cloning works.
2. Read and follow `/workspace/projects/pi/_git/pi-package-template/AGENTS.md` and `package.json`, then ensure child package basics are complete (`package.json`, `pi` manifest, entrypoint, deps) and match the current package metadata checklist and logo rules when applicable.
3. Run the focused documentation survey described above, independently verify its findings, and bring the package README, AGENTS, changelog, and metadata into the verified current house style.
4. Add the package extension path to root `package.json` → `pi.extensions` for single-install workflow.
5. Update root docs only as needed (`README.md` package list); keep plans, ideas, task lists, and other coordination artifacts in superproject `docs/<project-name>/`, not in the child package.
6. Validate package-local behavior and packaging, then run the applicable root `pnpm` checks and isolated live user-facing verification. Never use the destructive root formatter for focused work.
7. Ask the closeout npm-release and logo questions. Do not publish or push without explicit authorization.
8. Commit the child repository first, then commit the updated superproject pointer and integration changes.

## Formatting discipline

The root formatter (`pnpm run format`) rewrites every package (`packages/*/src/**` and `packages/*/*.md`). It is a destructive, superproject-wide operation.

- For work limited to one package, do **not** run the root formatter. It would rewrite unrelated sibling packages and mix their changes into your task. Use that package's own non-mutating `npm run format:check`, or format only the paths you changed inside that package, for example `npx prettier --write packages/<pkg>/src/ui/flow.ts`.
- Treat superproject-wide formatting as a separate, explicitly approved maintenance task: keep it in a standalone commit without behavioral changes, verify it is formatting-only by inspecting the full diff, using `git diff --ignore-all-space` only as a noise-reduction aid (not proof — line wrapping and import reflow still appear in it), reviewing remaining changes manually, running `git diff --check`, and running typecheck and tests.

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
