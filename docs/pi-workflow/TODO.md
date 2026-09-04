# TODO

## `/workflows` command enhancements

**Status:** Deferred follow-up; not part of the current workflow-catalog implementation.

Add a top-level menu to the user-facing `/workflows` command:

- Move the current project/role workflow-assignment experience under an item labeled **Edit project workflows**.
- Add an **Invoke workflow** item.
- Let the user choose a workflow from a list.
- After selection, insert the selected workflow's complete Markdown contents into the current conversation.

The follow-up must preserve the existing read-only workflow catalog boundary and should not make general workflow tools mutate workflow files or `projects.json`.

Before implementation, resolve these details from the current Pi command and extension APIs rather than guessing:

- Which API and message shape inserts selected Markdown into the current conversation.
- Whether the invocation list is the global catalog, the current project's assigned workflows, or an explicitly chosen scope.
- How missing, invalid, oversized, or unavailable workflows appear in the selection list and whether they can be invoked.
- Whether invocation inserts immediately after selection or requires a confirmation step, and how cancellation behaves.
- How the new top-level menu fits the existing project, role, and workflow navigation without changing current editing semantics.

Do not implement this follow-up as part of unrelated workflow-catalog changes. Revisit it as a separately scoped user-facing command change with live Pi verification and explicit user acceptance.
