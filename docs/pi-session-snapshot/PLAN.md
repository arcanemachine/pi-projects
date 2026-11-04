# Agent-operated session snapshots

## Active state and authority

Architect owns local release closeout. The original agent-tool feature was accepted, committed, integrated, and tagged locally as `v0.2.0`. The user has now explicitly accepted the sequencing correction and authorized the local `0.2.1` package commit/tag plus superproject integration. The child correction has been committed and locally tagged; final release alignment, superproject integration, and this record's closeout remain authorized. Preserve `v0.2.0`. No push or publication is authorized. Planning/documentation changes remain separate from feature integration.

The user authorized investigation, the decisions below, thorough planning, direct implementation using the doer, independent review, the general extension-configuration guidance correction, and standard local release preparation. Routine in-scope corrections and verification retain that authority without repeated permission requests. User-facing acceptance of the correction and authority for the local `0.2.1` release and integration have been granted explicitly. The user owns remote pushes and npm publication; neither is authorized.

The initial checkout was clean. The superproject is a collection of independently versioned child repositories under `packages/`, not a single source-control monorepo. The package was `0.1.6` before this effort. Its existing behavior is user-operated save/load/list/delete, safe snapshot names, active-path extraction, restore through a fresh fork in the current working directory, and best-effort unused-fork cleanup.

### Current evidence and remaining work

The accepted original feature passed 98 package tests, package formatting/typecheck/build/packing, and root validation. Its runtime verification exercised save and restore separately, not the user's same-run sequence. It also used `literal /not-a-command`, which checks literal delivery but does not establish the leading-slash case. Do not reuse either evidence claim as proof of the missing interactions.

The user's trial exposed a real sequencing defect: a queued save has not created its file when the next restore tool executes, and the single-operation queue independently rejects a second operation. The user approved one bounded same-name save→restore pair, dependent restore cancellation on save failure, independent permission checks, and continued rejection of unrelated or duplicate queued operations.

The user additionally approved switching at the first safe tool boundary without another original-session agent response. The restored session must receive a persistent user-only status entry, not a model-visible message or private guidance. The user prefers excluding the restore request from the chained snapshot if it can use a straightforward supported boundary; otherwise return the tradeoff for reconsideration. Pi's existing path extraction can select a complete earlier branch prefix without modifying source entries, so no transcript surgery is needed.

The working correction has passed 105 package tests across eight files, including checked-in real-runtime tests for consecutive save/restore turns, a same-assistant save/restore batch, and a mixed harmless/save/restore batch. Package formatting/typecheck/build/packing and the latest full root typecheck/tests/build pass. An unrelated polling test failed on an earlier root run and passed in isolation and subsequent full runs; no sibling source was changed.

The stop now occurs in the `turn_end` handler, after batch results are persisted; the in-tool abort/capability cast is removed. The bridge reserves an executing save until `finishSave`, renderer registration uses the selected minimum API without a compatibility guard, and provisional tracking ignores the user-only metadata. Earlier intermediate reviews do not substitute for reviewing these latest changes.

The checked-in real-runtime tests now cover consecutive prompted/no-prompt restores, same-assistant save/restore, mixed harmless/save/restore, true leading-slash prompt delivery, replacement counts, source snapshot immutability at replacement boundaries, custom-entry exclusion from provider context, and final unused-fork cleanup. They use a bounded settle delay only after runtime events have completed; package and root validation pass. An isolated real Pi `0.99.2` TUI run also completed an actual `snapshot_restore` and visibly rendered `Restored session snapshot "baseline".` in the restored session.

The correction passed package checks and root validation, and the isolated Pi `0.99.2` TUI showed the actual user-facing restore entry. Independent final review reported no material blocker. The user accepted the correction and authorized its local release. Keep evidence claims bounded to the checked-in assertions and actual TUI observations; review approval does not strengthen an assertion the tests do not make.

### Bounded implementation and verification queue

Complete this operational queue before returning for acceptance; do not substitute repeated package checks or another static review for its runtime cases:

1. In `packages/pi-session-snapshot/src/agent.ts`, remove the in-tool abort and its capability cast. Have the existing turn-end bridge method indicate whether an accepted restore is pending for the matching session. In `src/index.ts`, call the public `ctx.abort()` only from that `turn_end` handler, after all issued tool results are persisted. Do not await abort or switch in the boundary callback. Keep settled command dispatch and safe replacement.
2. Preserve queue ownership while a consumed save is executing, until `finishSave` releases it. Reject unrelated arrivals rather than allowing the dependent restore to overwrite a newly queued request. Clear ownership on failure, invalidation, and shutdown. Cover command-side post-dispatch revocation, save failure with an existing older snapshot, and queue availability after cleanup. Existing direct bridge tests complete the save lifecycle instead of treating token consumption as completion.
3. Pi `0.99.2` is the selected minimum; renderer registration is unconditional and the entrypoint fake verifies renderer registration. No unused `FlowContext` capability remains.
4. Checked-in `tests/live-runtime.test.ts` uses installed Pi `0.99.2` services/runtime, extension loading, and a local scripted provider to cover consecutive prompted/no-prompt restores, same-assistant save/restore, and mixed harmless/save/restore. It verifies leading-slash delivery, provider-context omission, complete replacement counts, saved-history exclusion, snapshot immutability, user-only metadata, and cleanup.
5. The actual TUI check passed with an isolated prepared snapshot and local provider. Package checks, root typecheck/tests/build, diff checks, and focused review passed. Remove spent temporary scripts/directories, not checked-in regression tests. Acceptance and local `0.2.1` release authority are now granted; finish the authorized child/tag alignment and superproject integration, without remote operations.

## Objective and accepted decisions

Add two agent tools:

- `snapshot_save`: request a named snapshot of the active session path at the end of the current agent run, with explicit force required to overwrite.
- `snapshot_restore`: request restoration of a named snapshot into a fresh normal session, optionally submitting exactly one literal prompt in that restored session.

Preserve the existing `/snapshot` menu and save/load/list/delete commands. Agent permissions do not restrict those user-operated actions.

Accepted boundaries:

1. Agent save and restore are separate, independently authorized tools. Both are denied by default.
2. User commands configure `save`, `restore`, or `all` through allow/deny/reset actions and report effective status.
3. Configuration uses flat-ish keys under `pi-session-snapshot` in Pi's normal global and trusted project settings files. Trusted project fields override corresponding global fields, and omitted fields inherit.
4. Command changes are process-local overrides. They survive reload and session replacement in the same Pi process, not process exit. They are not stored in snapshots or session entries.
5. Filesystem/session replacement occurs only at a safe settled boundary, and acknowledgements do not claim completed work. A successful restore request ends the originating run at the first safe tool boundary, with no additional original-session model response before replacement. One same-name restore may depend on a pending save; save failure cancels that restore rather than loading an older file of the same name.
6. Restoring always forks. The original snapshot is unchanged. A supplied prompt is submitted through the fresh replacement context as literal text; no prompt means wait for user input. Record successful agent restoration in persistent user-facing history only; the new entry must be absent from model context and must not trigger a run.
7. Newer Pi APIs are permitted. This implementation targets the verified installed version `0.99.2`, and documents that minimum rather than claiming untested support for the old `0.84.1` baseline.
8. No agent list/delete tools, custom startup flags, package-owned config file, or unrelated sibling feature changes are included.

## Configuration authority and validation

The exact namespace and keys are:

```json
{
  "pi-session-snapshot": {
    "agentSaveToolAllowed": false,
    "agentRestoreToolAllowed": false
  }
}
```

Read global `settings.json` under `getAgentDir()` and the current trusted project's `.pi/settings.json`. Use Pi's settings APIs and `ctx.isProjectTrusted()`; do not introduce a separate trust store or read untrusted project settings manually. Honor `PI_CODING_AGENT_DIR` through Pi's directory resolution rather than hardcoding the default path.

Resolve the two keys independently:

- Process-local user override wins when present.
- Otherwise a present trusted project field overrides its global counterpart.
- Otherwise use the global field.
- Otherwise deny.

Global `false` is a default that a trusted project may override with `true`, not a hard policy ceiling. Likewise a project may deny a global grant. A supplied non-boolean field denies that field at its configuration layer and warns; do not fall back to a lower-priority grant for that malformed field. A malformed namespace must not create an allow-by-accident path. Unknown keys should produce bounded diagnostics without printing configuration bodies.

Settings read/parse failures must be surfaced, and must not silently bypass a project denial by falling back to global permission. Preserve fail-closed configuration behavior while allowing an explicit user-command override to act as an override. Document reload behavior. Reload and session start resolve the current configuration; status and permission-changing commands also refresh it.

A focused configuration/authorization module owns validation, precedence, effective status, and denial guidance. Keep the process state through a versioned `Symbol.for(...)` carrier or equivalent established process-local mechanism. Tests must inject or isolate settings access; they must never read real user settings as part of their expected behavior.

These permissions control the extension surface, not arbitrary OS access. They are not a sandbox against an agent with filesystem or unrestricted command execution. Do not claim stronger enforcement.

## User command contract

Keep the existing command name and forms:

```text
/snapshot
/snapshot save [name] [--force|-f]
/snapshot load [name]
/snapshot list
/snapshot delete [name] [--force|-f]
```

Add:

```text
/snapshot agent status
/snapshot agent save allow
/snapshot agent save deny
/snapshot agent save reset
/snapshot agent restore allow
/snapshot agent restore deny
/snapshot agent restore reset
/snapshot agent all allow
/snapshot agent all deny
/snapshot agent all reset
```

`status` reports both effective permissions and whether an override or configuration/default supplies them. `reset` removes the selected override and returns to the current configuration baseline; it is not a synonym for denial. `all` changes both actions together. Invalid targets, decisions, or extra tokens must not mutate state. Complete targets and decisions with full argument-prefix replacement, while preserving existing action and force-flag completion behavior. Completed status/decision forms should not keep reopening an identical completion that obstructs normal submission.

Use ordinary Pi notifications for permission changes and status. Do not add transcript entries, hidden grant messages, or a status widget unless independently required by approved scope. No agent tool may grant its own permissions. Internal operation dispatch must not dispatch authorization commands, and the optional restored prompt must never execute slash commands.

## Deferred operation contract

### Agent save

Tool: `snapshot_save`.

Flat parameters:

- `name`: required, subject to the existing safe-name validation.
- `force`: optional Boolean, default false; explicitly true is necessary for replacement.

Check permission before snapshot filesystem access. Validate request arguments and record the originating session identity. Return a queued result with the normalized name and an opaque request identity. Tell the agent that the snapshot captures the active path when its run settles and that it should finish the current run rather than assume an already-created checkpoint.

Perform the actual save only after the run becomes idle. Resolve the then-current active leaf and persisted session file in the still-matching session, so the snapshot includes complete tool results and the completed run rather than an assistant tool call with missing results. Reuse `saveSnapshot`, existing storage paths, name validation, error classifications, restrictive permissions, and explicit overwrite rules. Notify successful completion with the normalized name; report errors without claiming success.

Ordinary save-only requests retain the completed-run capture boundary. For an approved same-name save→restore pair, select the latest complete path before the assistant message containing the restore request. Include preceding completed tool turns, including the save acknowledgement when it is in a preceding turn. Exclude the restore request, its result, and any subsequent continuation from the snapshot. If save and restore share one assistant tool batch, use the complete prefix before that entire assistant message; do not split the message, invent a result, or leave unmatched calls. Capture selection does not alter the original session or scrub older user text already on the selected path. If no usable complete prefix exists, fail the save and cancel its dependent restore with an actionable explanation.

Use Pi's existing leaf/parent identities and snapshot path extraction. Do not introduce transcript surgery, a history-rewriting subsystem, or an early in-tool filesystem save. Return to the user if the supported prefix route cannot meet these boundaries.

### Agent restore

Tool: `snapshot_restore`.

Flat parameters:

- `name`: required safe snapshot name.
- `prompt`: optional string. Preserve exact nonblank text; classify whitespace-only input consistently as no prompt and document that behavior.

Check restore permission before filesystem access. Queue plain request data tied to the originating session and return a queued result. Actual forking and switching occur after idle; do not leave an unused fork merely because a request was queued.

In the command-capable deferred execution route, revalidate originating session identity and effective permission immediately before filesystem/session side effects. Do not execute a request after permission revocation, replacement, reload invalidation, cancellation, or loss of its origin. Allow only a pending save with one dependent same-name restore from the same originating session; reject duplicate, differently named, or otherwise conflicting operations. Preserve that ownership through command dispatch and save execution, not only while a token is pending. Restore begins only after confirmed save success, including when an older file of that name exists. Save and restore permissions remain independent. Do not build a general queue or scheduler.

A successful restore tool request must end the source run after the issued tool batch is safely finalized and recorded; there must be no additional original-session provider request. Verify that guarantee for restore alone, chained restore, and mixed or same-assistant tool batches. Do not switch the session from a streaming tool context or rely solely on a cooperative model ending its reply.

Fork with `forkSnapshot` into the current cwd and session directory. Never activate, append to, or delete the source snapshot. Use `ctx.switchSession` and its `withSession` callback. Capture only plain request data before replacement. After success, the original context and original extension API are stale; all session-bound work must use the supplied fresh context.

If a prompt exists, send it once through the fresh context with `expandPromptTemplates: false`. A leading slash is literal user text, not an authorization/load command. This starts an agent run in the restored session. No prompt means leave the session idle; do not create a synthetic continuation or replay the restore request.

On cancellation or failure before replacement, clean up only the newly created unused fork and do not submit the prompt. If replacement has already occurred or new activity has begun, preserve the restored session even if later work fails. Do not delete an active or used session to satisfy an overbroad cleanup rule. Report post-replacement failures using fresh-context UI, never stale UI. Prompt-send failure must be reported, must leave the restored session intact, and must not retry automatically.

### User-only restoration record and deferred visibility ideas

Persist one clearly labeled restoration entry in the new fork, styled as a compact tool-status entry. Record the snapshot name and actual restoration event, not a fabricated assistant call or tool result. Pi custom entries are excluded from model context; custom messages are not equivalent because they reach the model by default. Verify omission in the real provider input as well as persistence/rendering. Insert the record without modifying the source snapshot, injecting a prompt, or starting a turn. Keep failed/cancelled unused-fork cleanup and provisional-session cleanup correct despite the metadata entry.

The user may later want configurable agent-facing visibility and private continuation guidance explaining that a snapshot was restored. These are deferred ideas only. Do not add a configuration key, hidden guidance, placeholder API, migration, or extensibility framework now. A later explicit promotion must settle visibility, defaults, guidance wording, and interaction with literal continuation prompts.

### Dispatch, invalidation, and result honesty

Pi `0.84.1` provides replacement only to commands and suppresses command dispatch in extension-generated user messages. Pi `0.99.2` adds the explicit `expandPromptTemplates` dispatch option, and `withSession` supplies literal prompt control. Use the supported API, not casts to obtain command context from tool/event context.

Read the selected runtime implementation before settling exact dispatch timing. `agent_settled` is documented as notification-only, and lifecycle callbacks may be awaited. Do not await a session switch from inside the callback that the switch/idle operation must finish. If dispatch is kicked off there, the internal command must safely wait until the callback and run have settled; verify that behavior against real Pi. A mock event handler does not prove the absence of deadlock.

Use opaque single-use tokens to select pending plain data, not shell strings, raw prompts embedded in command arguments, or a general command executor. Internal dispatch must not appear in normal user action completions. A stale token cannot select a newer request even when names match. Invalid requests should have actionable bounded errors, not partially create a session.

Pi's extension API dispatch is fire-and-forget: `ExtensionAPI.sendUserMessage` returns `void`. In the selected `0.99.2` runtime, its wrapper catches asynchronous `AgentSession.sendUserMessage` failures and emits a `send_user_message` extension error; the bridge receives no promise to await or attach `.catch()` to. Do not invent an unhandled-promise bug or cast the public API to a promise. The real bridge requirement is bounded recovery when no internal command acknowledges/consumes the request.

Provide that failure/invalidation recovery so a request cannot block all subsequent operations forever. Timeout and lifecycle cancellation must release pending state and notify through a context that is still valid. Clear timers when consumed, cancelled, or invalidated, including `session_shutdown` before runtime replacement/reload; never retain an old session UI in a callback after teardown. No automatic replay or retries. Do not add a new disk-backed queue or persist tokens/prompts.

Register both tools regardless of permission and enforce permissions at execution. Do not toggle tool registration/activation as authorization. Flat TypeBox schemas follow Pi's tool API; declare the actual imported schema package in this child manifest so standalone development/package installation does not depend on workspace hoisting. No additional feature framework is needed.

## Authoritative sources and file ownership

Required package sources:

- `packages/pi-session-snapshot/AGENTS.md`: maintenance/safety authority; revise its old tool prohibition to the approved boundary.
- `packages/pi-session-snapshot/src/index.ts`: registration and lifecycle wiring.
- `packages/pi-session-snapshot/src/command.ts`: user command parsing, completions, dispatch adaptation.
- `packages/pi-session-snapshot/src/snapshots.ts`, `src/names.ts`, and `src/paths.ts`: existing snapshot operations and storage/name constraints.
- `packages/pi-session-snapshot/src/provisional.ts` and `src/ui/flow.ts`: restored-session cleanup and existing command session replacement.
- New focused authorization and agent-operation modules under `packages/pi-session-snapshot/src/`: implementation ownership without generic service abstractions.
- `packages/pi-session-snapshot/tests/`: isolated unit/regression and real-runtime integration evidence.

Selected Pi documentation/source anchors are under the installed `@earendil-works/pi-coding-agent` package, available globally under `/usr/local/share/npm-global/lib/node_modules/` and at the target package's development dependency:

- `docs/extensions.md`: tool/event/context contracts and notification-only settlement semantics.
- `dist/core/extensions/types.d.ts`: `ExtensionAPI.sendUserMessage`, `ExtensionCommandContext.switchSession`, and the `withSession` fresh context.
- `dist/core/agent-session.js`: `prompt`, `sendUserMessage`, idle-wait resolution, and `agent_settled` ordering.
- `dist/core/agent-session-runtime.js`: replacement teardown, rebind, fresh context, cancellation, and error boundaries.
- `dist/core/settings-manager.js` and its declarations: trusted project settings and read errors.
- Pi's current SDK/runtime, RPC, session-format, and extension examples as needed for isolated verification. Follow relevant docs cross-references; do not copy the old reload example's ineffective dispatch defaults without checking source.

Durable documentation roles:

- `projects/pi/AGENTS.md` owns the general extension configuration standard. This authorized correction applies to the standard, not a retroactive rewrite of every existing extension.
- Package `AGENTS.md` owns package-specific safety/maintenance guidance and should reference the same package behavior without copying this planning artifact.
- Package `README.md` is the complete user-facing source for commands, settings, permission lifetime, tool schemas, deferred timing, prompt behavior, minimum version, and security limits.
- Package `CHANGELOG.md` records the durable feature/compatibility release, not review chatter.
- `docs/pi-session-snapshot/PLAN.md` is the active superproject execution/acceptance record and remains outside the child repository.

Allowed integration changes are root `package.json`, `pnpm-lock.yaml`, and the target submodule pointer when needed for the selected API and final integration. Do not upgrade sibling manifests, reformat unrelated packages, introduce unrelated cleanup, or stage generated sessions/settings/archive files.

## Verification and acceptance

Before completion run package-local non-mutating formatting, typecheck, tests, build, and `npm pack --dry-run`. Format only changed paths. Run applicable root pnpm typecheck/tests/build from the superproject. Review lockfile changes for accidental unrelated upgrades; dependency resolver output is not an exemption from focused scope.

Deterministic tests must cover:

- default denial, independent global/project precedence, trusted/untrusted project behavior, malformed fields/namespaces and settings read failures;
- command allow/deny/reset/status/all, invalid commands, full-prefix completions, process-global override reuse without serialization;
- denied tools with no snapshot/fork work;
- queued save at the completed run boundary, snapshot content including completed call/results, source unchanged, duplicate names, explicit force;
- queued restore, conflicting request handling, stale/single-use tokens, changed session, revocation before execution, reload/shutdown cancellation and timeout recovery;
- fork errors, cancellation, switch rejection before and after replacement, no deletion of source/used restored session;
- literal prompt exactly once in the fresh context, no prompt, whitespace-only prompt, prompt failure without replay;
- existing command and provisional cleanup regression behavior.

Exercise a running Pi `0.99.2` process or `AgentSessionRuntime`, with real extension loading/tool execution/command dispatch/session replacement and isolated agent/project/session directories. A local scripted test provider may supply deterministic actual tool calls without network credentials; this is real runtime integration verification, not a replacement for the Pi runtime with mocks. Do not expose real credentials or read/write the production Pi agent directory.

Verify end-to-end:

1. Denied tools create no snapshots or forks.
2. Global and trusted/untrusted project config resolve as documented.
3. User permission commands work in the actual TUI; RPC additionally supplies observable notification evidence.
4. An agent save is queued during a run and completed at idle with a valid full path.
5. Restore switches only after the source run settles, forks a new session, and leaves the snapshot bytes unchanged.
6. Optional prompt begins a real replacement-session run exactly once, including leading-slash literal text. No-prompt restore stays idle.
7. Process-local grants survive reload/same-process replacement and disappear on process restart.
8. Existing unused-fork cleanup remains safe despite the user-only restore metadata, and used restored sessions remain on disk.
9. Reproduce the user's entire trial in one initiated run: save, restore with a literal continuation prompt, that fresh run requests restore again with no prompt, and the final restored session stays idle. There are exactly two replacements, no old-session response after either accepted restore, no restore call/result in the chained snapshot, and no restore-status record in model input. Cover consecutive assistant turns, same-assistant save/restore, and a mixed tool batch; all issued source calls must retain results. Keep deterministic real-runtime regression coverage, not just removed temporary harness evidence.

Do not label startup/status alone as end-to-end verification. Stop and report an infrastructure blocker rather than quietly reducing required evidence or inventing a workaround. Correct routine in-scope defects directly; return material behavior/API/security/scope choices to Architect/user.

Before acceptance, independently review the final corrected code and live evidence. Classify review findings and fix routine defects. Present user-facing behavior and actual verification faithfully, then obtain explicit user acceptance or a user-initiated waiver. No commit/tag of feature work before that gate. A clean reviewer report is not user acceptance and cannot override missing runtime evidence.

## Delivery and local release

The original feature's local release is `0.2.0`; the user-approved corrective local release is `0.2.1`. Preserve existing accepted logo/metadata and the original `v0.2.0` tag. Verification and user acceptance authorize the following local release mechanics:

1. Commit package implementation/docs/metadata atomically in the child repository using a durable Conventional Commit.
2. Create the local release tag under the package's established tag convention; verify it points at the accepted version/commit, and inspect packing without publishing.
3. Commit the superproject submodule pointer and required dependency/lockfile integration together. Keep planning/general-guidance changes in a separate superproject planning/documentation commit, as root guidance requires.
4. Report version/tag, checks, review/acceptance, child and superproject integration, and user-owned push/publication steps.

Do not push or publish. Remove spent temporary test artifacts and unattached scaffolding safely. Update this plan's active state to match what actually happened; do not leave it saying implementation has not started. Remove it only if closeout explicitly chooses that lifecycle disposition.

## Stop conditions

Stop for a required model switch failure, an unavailable necessary infrastructure service/credential, unsafe or unsupported session replacement, inability to establish literal replacement-session prompt behavior, dependency updates requiring unrelated migrations, unresolved trust/configuration policy, changes to the approved idle capture boundary, or a material product/security/architecture/scope/acceptance conflict. Report missing evidence plainly; do not turn test success into acceptance or local release preparation into publication authority.
