# Plan: `/workflows` command enhancements

## Status and planning boundary

This is a promoted planning artifact for a deferred follow-up. It is not implementation authorization. No package source, workflow catalog behavior, project assignment, or user-facing command behavior should be changed until the unresolved decisions and the execution route below have been addressed.

The plan originated as the sole item in `docs/pi-workflow/TODO.md`. That TODO item has been promoted here so the useful context survives without leaving a duplicate task entry.

## Objective

Extend the user-facing `/workflows` command with a top-level menu that offers two distinct actions:

1. **Edit project workflows** — the current project, role, and workflow-assignment experience moved under this submenu without changing its existing editing semantics.
2. **Invoke workflow** — a workflow-selection experience. The user selects a workflow, and the selected workflow's complete Markdown contents are inserted into the current conversation.

The result should make workflow configuration and workflow invocation visibly separate while preserving the existing catalog's read-only and project-scoping boundaries.

## User-approved direction

The following behavior is approved as the intended outcome:

- `/workflows` gains a top-level menu.
- The current workflow-assignment behavior is available under an item labeled exactly **Edit project workflows**.
- A second item labeled exactly **Invoke workflow** is available from that top-level menu.
- **Invoke workflow** presents a selectable list of workflows.
- Selecting a workflow places its complete Markdown contents into the current conversation.
- This work is a later follow-up to the current workflow-catalog implementation, not part of unrelated catalog changes.

These statements define the desired product behavior, not the unapproved implementation mechanism. The implementation owner must resolve the open API and UX questions below before coding.

## Verified current boundaries

`pi-workflow` V1 is a thin global Markdown workflow catalog and configuration extension:

- Global workflow files are discovered below Pi's agent directory, normally `~/.pi/agent/workflows/`.
- A workflow ID is the lowercase-kebab filename stem; workflow identity does not come from a frontmatter ID.
- Workflow Markdown contains required selection metadata (`title`, `summary`, `use_when`, and `avoid_when`) and a non-empty body.
- `pi_workflow_list`, `pi_workflow_read_metadata`, and `pi_workflow_read` are read-only namespaced tools.
- `/workflows` is the only user command and currently configures project and role assignments through a project menu, role menu, and searchable workflow toggle list.
- `/workflows` writes only the user-owned `projects.json` configuration through its existing atomic save path.
- The package does not provide workflow execution, lifecycle state, revisions, gates, session attachment, plan inspection/editing, project-local catalogs, or bundled workflow definitions.
- Missing workflows and invalid workflow files are surfaced as catalog diagnostics rather than being silently treated as valid definitions.

The new invocation behavior must not make the agent tools mutate workflow files or `projects.json`, must not add project-local or bundled workflow storage, and must not imply that selecting a workflow executes it automatically. Invocation means inserting the selected Markdown into the current conversation.

## Scope

The future implementation may include the `pi-workflow` command, its supporting package modules, focused tests, maintained package documentation, and any narrowly required Pi integration wiring. It must preserve current project/role/workflow editing behavior while adding the new top-level navigation and invocation flow.

The implementation must determine and document the exact allowed paths before dispatch. Likely areas requiring review include:

- `packages/pi-workflow/src/command.ts` for the existing `/workflows` TUI and navigation layers;
- `packages/pi-workflow/src/index.ts` for command registration and extension integration;
- `packages/pi-workflow/src/catalog.ts`, `src/metadata.ts`, and `src/tool.ts` for catalog discovery, validation, and existing read behavior;
- relevant command, integration, and UI tests under `packages/pi-workflow/tests/`;
- the Pi SDK/TUI documentation and examples that define the supported current-conversation insertion API and message shape.

These are a required-reading starting list, not permission to modify all of them or to assume every path will need changes. The implementation owner must narrow the final allowed set after bounded investigation.

## Non-goals

- Do not redesign the global workflow catalog or its frontmatter format.
- Do not add workflow execution, lifecycle tracking, FSM behavior, persistence, revisions, gates, session attachment, or automatic workflow selection.
- Do not allow general workflow tools or the new command to edit workflow Markdown files or `projects.json` outside the existing user-operated configuration flow.
- Do not infer a project ID from a working directory or repository name.
- Do not select a local-file or package-specific source for invocation merely because it is convenient; preserve the global catalog boundary unless an explicit decision changes it.
- Do not choose a Pi conversation-insertion API, message role, or UI interaction model without reading the authoritative Pi source documentation and confirming its contract.
- Do not implement this work as part of unrelated workflow-catalog maintenance.

## Open product and implementation decisions

Resolve these decisions through the Architect's structured decision process before creating an executable implementation brief:

1. **Invocation scope:** Should the selection list contain all valid global workflows, the workflows assigned to the current configured project/role, or a user-visible choice between those scopes? The current user direction says “a list of workflows” but does not settle the scope.
2. **Active role and project context:** If invocation uses project assignments, how is the active role established, and what should happen when no configured project or role applies? Do not infer either from the filesystem.
3. **Invalid and unavailable entries:** Should missing, invalid, oversized, or unreadable workflows be displayed as disabled diagnostics, omitted, or selectable with an error? Match existing catalog diagnostics and avoid presenting unusable content as valid.
4. **Insertion contract:** Which supported Pi API inserts content into the current conversation, what message shape and role does it require, and does it append, replace, or otherwise affect the current turn? Confirm from Pi documentation/source rather than guessing.
5. **Confirmation and cancellation:** Does selecting a workflow insert immediately, or should the user confirm first? Define Escape/cancel behavior and ensure cancellation leaves both workflow configuration and the conversation unchanged.
6. **Content framing:** Should inserted Markdown be wrapped with a small source label or inserted byte-for-byte as the workflow body? The approved requirement is complete Markdown contents; any additional framing requires explicit product confirmation.
7. **Menu navigation:** How should the new top-level menu compose with the existing project, role, and searchable workflow-toggle layers while retaining keyboard behavior, safe defaults, and staged-save semantics?
8. **Acceptance surface:** Define the live Pi interaction that demonstrates both menu navigation and exact conversation insertion, including how malformed or unavailable catalog entries are handled.

Do not convert any of these questions into implementation instructions until the relevant decision is explicitly accepted, rejected, deferred with a named gate, or delegated with authority.

## Required investigation and source anchors

Before implementation planning, read the current command and integration source narrowly enough to answer the decisions above. At minimum, inspect the existing `/workflows` command implementation, its registration path, catalog read APIs, and focused tests. Read the exact Pi SDK/TUI documentation or examples for:

- opening and layering selection menus;
- obtaining the current conversation context from a command;
- inserting or appending a user-visible message into that conversation;
- cancellation and redraw behavior after command completion;
- any constraints on asynchronous command handlers or message content.

Use the package's current tests and maintained README as behavior references. Do not read unrelated package implementations or broad repository history unless a bounded question makes one the narrowest necessary source.

## Architecture and capability constraints

- Keep workflow definition storage and discovery in the existing global catalog.
- Keep `projects.json` writes restricted to the existing `/workflows` configuration path and its atomic save behavior.
- Reuse existing catalog validation and bounded output rules where possible; do not create a second workflow parser or an unbounded content path.
- Ensure invocation cannot expose unbounded workflow content beyond the existing workflow size and conversation/tool-output constraints.
- Preserve user control: selecting a workflow inserts text but does not execute tools, switch roles, alter active tools, or silently change project configuration.
- Keep the new command behavior independently testable and avoid generic repositories, adapters, service locators, or plugin frameworks.

## Planning and routing gate

After the required investigation, the Architect must return with:

- verified current behavior and exact affected paths;
- resolved or explicitly dispositioned decisions above;
- an executable scope and non-goals;
- a selected workflow and route appropriate to the final task structure;
- a self-contained implementation brief with verification and stop conditions.

Do not dispatch implementation from this planning artifact alone. The final route may be bounded work, bounded series, or a fuller phase depending on the number of substantive tasks, user-facing risk, and required acceptance ceremony. A workflow selection is not itself dispatch authorization.

## Verification and acceptance

The eventual implementation must include focused deterministic checks for:

- top-level menu labels and navigation;
- preservation of existing **Edit project workflows** behavior, including staged edits and cancellation;
- workflow list scope and ordering;
- handling of missing, invalid, oversized, and unreadable entries;
- exact selected-content insertion behavior;
- cancellation and repeated invocation behavior;
- no mutation of workflow files or `projects.json` during invocation.

Because this changes user-facing TUI and conversation behavior, package tests are necessary but not sufficient. Run the package's required typecheck, test, build, formatting, and packaging checks, then perform an isolated live Pi verification of the command and obtain explicit user acceptance before acceptance, integration, state advancement, architecture acceptance, closeout, or any equivalent completion claim.

## Stop conditions

Stop and return to the user or owning Architect when:

- the Pi conversation-insertion API or message shape cannot be identified from authoritative sources;
- invocation scope, active-role handling, content framing, confirmation, or invalid-entry behavior remains materially unresolved;
- implementation would require changing the catalog boundary, `projects.json` ownership, workflow format, or another architecture/capability surface;
- the work expands beyond the final approved paths or requires broad repository discovery;
- the current command's staged-save or cancellation semantics cannot be preserved;
- deterministic checks or live verification fail without an obvious in-scope correction;
- explicit user-facing acceptance is missing.

## Promotion to execution

This plan becomes executable only after the open decisions are resolved and the user approves the resulting implementation scope and route. At that point, update this plan with the accepted decisions and concrete allowed paths rather than making the implementation owner reconstruct them from conversation history.

## Closeout and lifecycle cleanup

After the follow-up is implemented, verified, accepted, and any durable knowledge is preserved elsewhere:

1. Reconcile this plan with the final approved result and record any durable documentation or roadmap implications.
2. Delete `docs/pi-workflow/PLAN.md` when it is no longer needed as a working plan, unless the user explicitly asks to retain it as a permanent design record.
3. If deleting the plan leaves `docs/pi-workflow/` with no remaining planning or meta-document files, remove that directory too.
4. Commit plan deletion and empty-directory cleanup as a planning-document lifecycle change, separate from implementation commits when the repository workflow requires that separation.

Never delete this plan while it still contains the only durable record of unresolved decisions or accepted rationale, and never remove a directory that still contains another active or retained planning artifact.
