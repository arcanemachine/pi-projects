# Plan: `/workflows` command enhancements

## Status and planning boundary

This is the active canonical planning artifact for the approved `/workflows` enhancement. Implementation is authorized by current user direction and the product/API decisions recorded below. The plan is executable within its bounded scope, and the committed-plan context-preservation route is selected. This durable plan is the recovery source; no duplicate temporary plan is needed.

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

The accepted implementation mechanism and UX decisions are recorded below. They are bounded by the existing catalog, configuration, and user-control constraints.

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

The new invocation behavior must not make the agent tools mutate workflow files or `projects.json`, must not add project-local or bundled workflow storage, and must not select project or role context. Invocation means inserting the selected Markdown into the current conversation and requesting an agent turn.

## Scope

Implement the approved `/workflows` enhancement in the existing `pi-workflow` child package. The implementation must preserve the current project/role/workflow-assignment behavior and add a separate invocation path without changing catalog storage, workflow format, tool ownership, or project configuration semantics.

### Exact allowed implementation paths

The implementation is limited to these paths:

- `packages/pi-workflow/src/command.ts` — top-level menu orchestration, invocation selection, diagnostic handling, and the injected `pi.sendMessage` call;
- `packages/pi-workflow/src/index.ts` — pass the extension message action into command registration if required by the settled handler shape;
- `packages/pi-workflow/tests/command.test.ts` — deterministic command/menu/invocation tests and preservation regressions;
- `packages/pi-workflow/tests/extension.integration.test.ts` — registration and injected-message wiring tests;
- `packages/pi-workflow/tests/ui-pump.test.ts` — real `ctx.ui.custom` key-pumping coverage for any new menu behavior;
- `packages/pi-workflow/README.md` — current `/workflows` behavior and invocation documentation;
- `packages/pi-workflow/CHANGELOG.md` — the user-facing change entry.

`packages/pi-workflow/src/ui/configure.ts`, `src/ui/components.ts`, `src/catalog.ts`, `src/metadata.ts`, `src/tool.ts`, `src/projects.ts`, `src/paths.ts`, and `src/types.ts` are required reading and remain unchanged unless a test-driven, directly necessary correction within this feature is proven. If implementation requires any other path, stop and return for scope approval before editing it.

### Implementation sequence

Follow the package’s required single-agent sequence without Architect/Sergeant/Worker routing:

1. Add the top-level **Workflows** menu and route **Edit project workflows** through the existing configurator. Returning from that submenu must leave all existing staged-save, discard, and cancellation semantics intact.
2. Add **Invoke workflow** using the existing global catalog discovery and selection UI. Include only valid, readable, in-bound workflow definitions, sorted by workflow ID, while surfacing catalog diagnostics as warnings.
3. Inject the selected workflow’s exact `workflow.raw` through `pi.sendMessage` with `customType: "pi-workflow"`, `display: true`, and `{ triggerTurn: true }`. Do not use `setEditorText` or `sendUserMessage`.
4. Add focused deterministic tests, update maintained documentation/changelog, run all required package checks, then perform isolated live Pi acceptance. Do not commit package changes until the live user-facing gate is satisfied.

## Non-goals

- Do not redesign the global workflow catalog or its frontmatter format.
- Do not add workflow execution, lifecycle tracking, FSM behavior, persistence, revisions, gates, session attachment, or automatic workflow selection.
- Do not allow general workflow tools or the new command to edit workflow Markdown files or `projects.json` outside the existing user-operated configuration flow.
- Do not infer a project ID from a working directory or repository name.
- Do not select a local-file or package-specific source for invocation merely because it is convenient; preserve the global catalog boundary unless an explicit decision changes it.
- Do not choose a Pi conversation-insertion API, message role, or UI interaction model without reading the authoritative Pi source documentation and confirming its contract.
- Do not implement this work as part of unrelated workflow-catalog maintenance.

## Approved product and implementation decisions

The user approved the following decisions and the bounded implementation scope:

1. **Invocation scope:** **Invoke workflow** lists every valid workflow in the existing global workflow catalog. It does not filter by project or role and does not infer context from the working directory, repository name, or role filenames.
2. **Project and role context:** Invocation does not load or select a project or active role. The existing project/role configuration flow remains available only under **Edit project workflows**.
3. **Invalid and unavailable entries:** Invalid, oversized, and unreadable workflow files are omitted from the selectable invocation list. Their existing catalog diagnostics are shown as warnings. A catalog-directory read failure is a command error (`READ_FAILED`). If no valid entries remain, notify the user and return without changing the conversation or configuration.
4. **Insertion contract:** Use the authoritative `pi.sendMessage` API with `{ customType: "pi-workflow", content: workflow.raw, display: true }` and `{ triggerTurn: true }`. Pi persists the message as a custom conversation entry, renders it in the transcript, and converts it to an LLM user message. It appends and starts an agent turn while idle, and follows Pi’s safe deferred ordering while streaming.
5. **Confirmation and cancellation:** Selecting a valid workflow inserts immediately and closes `/workflows`; no second confirmation is shown. Escape from the invocation list returns to the top-level menu. Escape from the top-level menu exits. Cancellation never changes `projects.json`, workflow files, or the conversation.
6. **Content framing:** Pass `workflow.raw` byte-for-byte. Do not add a source label, wrapper, or other framing.
7. **Menu navigation:** The top-level menu is titled **Workflows** and contains exactly **Edit project workflows** and **Invoke workflow**. Selecting **Edit project workflows** opens the existing configurator; when it returns, the top-level menu is shown again. Existing project/role hover behavior, staged edits, save-before-exit confirmation, safe-default deletion, and discard behavior remain unchanged inside that submenu.
8. **Acceptance surface:** In an isolated live Pi session, demonstrate top-level navigation, exact raw-content insertion followed by an agent turn, Escape cancellation, invalid-entry diagnostics/omission, unchanged configuration during invocation, and preserved edit/save/discard behavior. Explicit user acceptance is required before package acceptance or commit.

## Completed bounded investigation and source anchors

The required investigation is complete and must remain the basis for implementation:

- `packages/pi-workflow/src/command.ts` currently validates arguments/mode and delegates to `configureProjectWorkflows`.
- `packages/pi-workflow/src/ui/configure.ts` owns the existing staged project → role → searchable workflow-toggle flow. Its project-menu Escape path already performs save/discard handling and returns without writing on cancellation.
- `packages/pi-workflow/src/catalog.ts` returns sorted catalog entries with validated `workflow.raw` and diagnostics; `requireWorkflow` rejects missing, unreadable, oversized, and invalid entries. Invocation must reuse this behavior rather than parse a second format.
- `packages/pi-workflow/src/projects.ts` gives `/workflows` exclusive atomic ownership of `projects.json`; invocation must not call it.
- `packages/pi-workflow/tests/command.test.ts`, `tests/extension.integration.test.ts`, and `tests/ui-pump.test.ts` are the focused behavior and renderer references.
- Pi `docs/extensions.md`, `docs/sdk.md`, `docs/tui.md`, `docs/session-format.md`, the installed declarations, and `dist/core/agent-session.js` establish that `pi.sendMessage` is the insertion API, custom messages use role `custom`, custom content is converted to LLM role `user`, and `triggerTurn: true` requests an agent turn while preserving safe deferred ordering during streaming.
- Pi `ctx.ui.setEditorText` only prefills the editor, while `pi.sendUserMessage` always triggers a turn; neither satisfies insertion-only behavior.

No additional catalog, project-storage, role-integration, or broad repository investigation is authorized or needed for this implementation.

## Architecture and capability constraints

- Keep workflow definition storage and discovery in the existing global catalog.
- Keep `projects.json` writes restricted to the existing `/workflows` configuration path and its atomic save behavior.
- Reuse existing catalog validation and bounded output rules where possible; do not create a second workflow parser or an unbounded content path.
- Ensure invocation cannot expose unbounded workflow content beyond the existing workflow size and conversation/tool-output constraints.
- Preserve user control: selecting a workflow inserts the selected text and requests the agent turn, but does not select a project or role, alter active tools, or silently change project configuration.
- Keep the new command behavior independently testable and avoid generic repositories, adapters, service locators, or plugin frameworks.

## Execution route and authority

The product decisions, exact allowed paths, implementation sequence, and verification/acceptance gates above form the executable implementation brief. Package guidance requires one implementation agent to follow the four sequence steps in order, with no Architect/Sergeant/Worker routing. The committed-plan context-preservation route is selected, using this durable `PLAN.md` as the recovery source rather than creating a duplicate temporary execution plan. After compaction, revalidate this plan and the child/superproject state, then continue with the required implementation sequence. The route choice does not broaden scope or change the package’s single-agent sequence.

Do not begin package source edits before recovering and revalidating this plan after compaction. Do not commit user-facing package changes until deterministic checks pass and explicit live Pi acceptance is obtained.

## Verification and acceptance

The implementation must add deterministic coverage for:

- exact top-level labels **Edit project workflows** and **Invoke workflow**;
- top-menu Escape and submenu cancellation/return behavior;
- preservation of existing edit navigation, hover retention, staged assignment changes, save-before-exit, discard, and deletion safety;
- global invocation scope and stable workflow-ID ordering;
- omission and warning behavior for invalid, oversized, unreadable, and empty catalogs;
- exact `workflow.raw` passed to the injected message action with `customType: "pi-workflow"`, `display: true`, and `triggerTurn: true`;
- no invocation-time mutation of workflow files or `projects.json`;
- repeated command entry and Escape without duplicate insertion.

Run the package-required checks from `packages/pi-workflow`:

```bash
npm run typecheck
npm run test
npm run build
npm run format
npm pack --dry-run
```

Then perform an isolated live Pi verification using a temporary absolute `PI_WORKFLOW_DIR` containing at least one valid workflow and one malformed/oversized entry. Exercise `/workflows` through the real TUI: open the top menu, enter **Invoke workflow**, cancel once and verify no transcript/configuration change, select the valid workflow and verify the transcript contains the exact raw bytes and an agent turn is requested, reopen and verify no duplicate insertion, then enter **Edit project workflows** and verify existing staged-save/discard behavior. Record the observed result and obtain explicit user acceptance before package acceptance, implementation commit, superproject integration, or closeout.

## Stop conditions

Stop and return to the user or owning Architect when:

- implementation needs a path outside the exact allowed list;
- the implementation would change global catalog discovery, workflow format, `projects.json` ownership, role integration, or execution semantics;
- the current configurator’s staged-save, safe-default deletion, or cancellation semantics cannot be preserved;
- invocation would require project/role inference, a second parser, unbounded content handling, framing not recorded above, or turn behavior beyond the approved `triggerTurn: true` request;
- deterministic checks, package checks, or live verification fail without an obvious in-scope correction;
- the context-preservation route is not selected;
- explicit user-facing acceptance is missing.

## Executable-plan status

The open decisions are resolved and the user approved the resulting implementation scope and committed-plan context route. This plan contains the accepted behavior, implementation mechanism, exact allowed paths, sequence, verification, acceptance gate, and stop conditions. After compaction, revalidate the selected route and recovered state before package source edits. Update this plan if an accepted decision or exact path changes; do not improvise a new mechanism during implementation.

## Closeout and lifecycle cleanup

After the follow-up is implemented, verified, accepted, and any durable knowledge is preserved elsewhere:

1. Reconcile this plan with the final approved result and record any durable documentation or roadmap implications.
2. Delete `docs/pi-workflow/PLAN.md` when it is no longer needed as a working plan, unless the user explicitly asks to retain it as a permanent design record.
3. If deleting the plan leaves `docs/pi-workflow/` with no remaining planning or meta-document files, remove that directory too.
4. Commit plan deletion and empty-directory cleanup as a planning-document lifecycle change, separate from implementation commits when the repository workflow requires that separation.

Never delete this plan while it still contains the only durable record of unresolved decisions or accepted rationale, and never remove a directory that still contains another active or retained planning artifact.
