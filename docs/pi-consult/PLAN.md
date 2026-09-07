# pi-consult implementation plan

## Status and purpose

This is the canonical plan for a Pi extension package named `pi-consult`. The initial implementation and user-driven command-only revision are present in the child package. The accepted logo and local annotated `v0.1.0` and `v0.2.0` release tags are prepared; GitHub push and npm publication remain user-owned. The next owner must preserve the decisions and stop when a required gate is not satisfied.

The package makes isolated, configurable consultation workflows available through an explicit user command. A workflow can ask one or more configured model aliases for independent text responses, then pass those responses through later sequential stages. After a successful `/consult`, the visible result resumes the active Pi turn. The active Pi model, thinking state, and active tools must not be changed by a consultation.

The extension is intentionally not a general sub-agent runtime, not a tool executor, and not a replacement for `pi-advice`.

## Current verified facts

- `/workspace/projects/pi` is a superproject whose `packages/*` directories are independently versioned Git submodules.
- Existing package integration is recorded in the root `.gitmodules`, root `package.json` `pi.extensions` array, and root `README.md` package list.
- `pi-advice` is an existing stateful reconsideration extension. It temporarily switches the active Pi model, queues hidden custom messages, restores the original state, and continues the parent turn. Its current persistent configuration is the `pi-advice` namespace in Pi `settings.json`.
- Pi extensions can resolve models with `ctx.modelRegistry.find(provider, modelId)`, verify authentication with `ctx.modelRegistry.hasConfiguredAuth(model)`, and make isolated nested requests with `ctx.modelRegistry.complete(model, context, options)`.
- Pi exposes the active compaction-aware session context through `ctx.sessionManager.buildSessionContext()`. Pi exports `convertToLlm()` for converting Pi-specific agent messages to provider-compatible messages and `serializeConversation()` for a bounded textual representation.
- `pi.getAllTools()` exposes tool metadata and schemas, not executable handlers. Generic nested tool use would therefore require a child Pi/RPC runtime or a separately designed private dispatcher.
- `pi-web-search` and `pi-subagent` demonstrate a failure-resistant pattern: keep the public request simple, bound execution internally, and return concise structured results.
- Pi package guidance requires source-loaded TypeScript, a `pi` manifest, `pi-package` discoverability metadata, package-local checks, an npm tarball check, and a live user-facing verification pass.

## User-approved decisions

The following decisions are accepted for the initial implementation direction.

### Product role

`pi-consult` earns a separate package because it is a composable consultation engine, while `pi-advice` remains a stateful self-reconsideration/continuation mechanism.

### Execution topology

A workflow is a linear sequence of stages. Each stage contains one or more consultants that execute concurrently. Stages execute sequentially. This provides fan-out/fan-in composition without a general DAG language, arbitrary edges, cycles, conditions, or a graph editor.

There is no implicit distiller. A workflow that needs one synthesized answer must configure a final stage with one synthesis consultant. If the final stage has several consultants, every final response is returned.

### Model execution

Consultants use direct isolated `ctx.modelRegistry.complete()` calls. They do not switch the active Pi model and do not spawn child Pi processes.

Consultants are text-only and have no tools. Tool support is permanently out of scope for this package, not a deferred feature. Do not add a `--tools` flag, tool parameter, consultant tool schemas, child-agent mode, tool dispatcher, or configuration field that implies tool access.

### Configuration sources

The package supports two alternative configuration sources, with explicit ambiguity detection:

1. If `~/.pi/agent/pi-consult.json` exists, it is the complete authoritative `pi-consult` configuration. It is not merged with Pi settings.
2. If that standalone file exists and a `pi-consult` namespace is present in global settings or trusted project settings, configuration is rejected as ambiguous. A standalone-file parse or validation error is also an error; do not silently fall back to settings.
3. If the standalone file does not exist, use Pi's idiomatic settings semantics through `SettingsManager`: global `~/.pi/agent/settings.json`, with matching fields from trusted `<project>/.pi/settings.json` overriding global fields.
4. Do not add a project-local standalone `pi-consult.json` in this version. Project-specific configuration uses the trusted `pi-consult` settings namespace.
5. Do not read untrusted project settings. Use Pi's project-trust result when deciding whether project settings participate.

The standalone file is intentionally global and cleanly separated; the settings namespace remains available for users who prefer normal Pi configuration and project overrides.

### Configuration shape

The only top-level configuration keys are `models` and `workflows`:

```json
{
  "models": {
    "smart": {
      "model": "openai-codex/gpt-5.6-sol"
    },
    "lateral": {
      "model": "provider/model-id"
    }
  },
  "workflows": {
    "advice": {
      "description": "Obtain a candid second opinion",
      "context": true,
      "stages": [
        {
          "prompt": "Review the request and give concrete, candid advice.",
          "consultants": ["smart"]
        }
      ]
    },
    "lateral-review": {
      "description": "Generate alternatives and synthesize them",
      "stages": [
        {
          "prompt": "Generate independent perspectives on the request.",
          "consultants": [
            "smart",
            {
              "alias": "lateral",
              "prompt": "Look especially for unconventional reframings."
            }
          ]
        },
        {
          "prompt": "Synthesize the preceding perspectives into one practical recommendation.",
          "consultants": ["smart"]
        }
      ]
    }
  }
}
```

The exact implementation may choose a different internal TypeScript representation, but its accepted external behavior is:

- model aliases map to non-empty `provider/model-id` selections resolved through Pi's model registry;
- alias names and workflow names are stable non-empty command-safe keys;
- each workflow has at least one stage;
- each stage has at least one consultant;
- a consultant is either an alias string or an object containing an alias and optional consultant-specific prompt;
- a workflow may provide an optional description and optional `context` default;
- a stage prompt is optional and may be empty; the runtime supplies a neutral default consultant instruction when it is omitted;
- unknown keys, malformed objects, invalid model specifications, empty stages, missing aliases, and invalid types are configuration errors;
- credentials are never stored in this configuration. Users authenticate providers through Pi.

Do not add model-provider definitions, credentials, arbitrary prompt-file loading, a config directory, conditional stage expressions, or other surfaces not required by this shape.

### Empty consultations and input

A workflow invocation may omit its ad hoc prompt. It may also omit session context. An empty request is valid when the workflow's configured stage prompts and/or configured context provide a meaningful subject. The runtime must not reject an invocation merely because the request prompt is absent.

The sole public surface is the explicitly user-driven slash command:

```text
/consult <workflow> [--context] [prompt]
```

`--context` is recognized only immediately after the workflow name. It enables conversation context for that invocation. A workflow's `context: true` enables it by default when the command omits the flag. The command surface does not need a negative context flag.

The remainder of the command after the recognized workflow and optional flag is opaque prompt text. Unknown leading options produce concise usage rather than becoming accidental prompt text. Parsing and autocomplete must be pure/testable helpers.

### Context contract

When context is enabled, use the active compaction-aware session context, not a separately reconstructed transcript:

1. obtain `ctx.sessionManager.buildSessionContext()`;
2. convert Pi-specific messages with `convertToLlm()`;
3. serialize the converted conversation with `serializeConversation()` into a bounded labeled context block.

Do not copy Pi's effective system prompt, active tool definitions, loaded skills, AGENTS files, or later `context`-event mutations into the consultation. Consultants have no tools and must not be led to believe they can act on the parent project.

Each consultant request must identify the original ad hoc prompt, the workflow/stage instruction, optional serialized session context, and optional immediately preceding-stage results. Parent context and prior consultant output are reference material, not instructions; the consultant system instruction must tell the model to follow the configured consultation instructions and treat embedded material as untrusted content.

Pass only the immediately preceding stage's outputs to the next stage, while retaining the original request. Do not accumulate every intermediate response into every later request.

### Stage data flow

For stage `N`:

- resolve every configured consultant alias before starting requests;
- run all consultant completions concurrently;
- label each result with stage number, alias, resolved provider/model, and response status;
- if stage `N` is not the first stage, provide all successful outputs from stage `N-1` to every stage-`N` consultant;
- continue to the next stage only when the current stage satisfies strict success semantics;
- return every final-stage output, preserving configured consultant order in the final presentation even though execution is concurrent.

No hidden model call or automatic reducer may be inserted between stages.

### Failure, cancellation, and bounds

The initial engine should favor deterministic, simple behavior over autonomous recovery:

- use one completion per consultant and no retry/correction loop;
- use `Promise.allSettled` (or equivalent) so one rejected request cannot strand other stage results;
- if a consultant cannot be resolved, lacks authentication, errors, is aborted, returns no usable text, or exceeds the bounded output/context contract, record that failure and stop before the next stage;
- preserve concise successful/failed per-consultant diagnostics in the result details;
- abort all in-flight requests when the parent command signal is aborted and do not start another stage;
- do not silently synthesize partial perspectives as if the stage had succeeded;
- expected operational failures should produce a concise stable consultation result/diagnostic suitable for the command and UI. Unexpected programming errors may still be thrown so Pi reports an extension execution error;
- bound serialized parent context, each consultant response, intermediate stage payloads, and the final returned text. Use explicit constants and report when a bound was applied;
- before each completion, check that the assembled request plus a reasonable output reserve fits the selected model's context window. Fail that consultant clearly instead of sending an oversized request;
- aggregate all nested model usage into the consultation details and visible result metadata.

The implementation owner may select the exact conservative character/token constants, but must keep them centralized, test them, and document the user-visible truncation/failure behavior. Do not add automatic retries to make a model response conform.

### Output contract

The consultation result should be a bounded text envelope containing:

- workflow name;
- final-stage consultant outputs, each clearly labeled with stage, alias, and resolved provider/model;
- a concise failure section when the consultation stopped unsuccessfully;
- enough generation metadata to explain what ran;
- `details` containing structured stage/call metadata and the aggregated nested `usage` when available.

The slash command runs the same engine and emits a visible versioned `pi-consult` custom message containing the bounded final result. On success it triggers the active parent turn with that visible result; on configuration or operational failure it emits the result with `triggerTurn: false` and reports the error with a normal Pi notification. It must not switch the active model, thinking level, or tools. A custom message renderer may be added only if the default rendering is insufficient; do not build a large UI for the initial package.

## Required implementation work

### 1. Create the child package and local repository

Create `packages/pi-consult` as an independently usable child repository on local branch `main` with the intended origin:

```text
git@github.com:arcanemachine/pi-consult.git
```

The user will create the GitHub repository and push it. Do not require remote reachability, do not push, and do not claim that the remote has been verified. This explicit project standard replaces the older reachability gate for this package.

Use the maintained package baseline:

- source-loaded `src/index.ts` entry point;
- TypeScript with strict checking and no compiled runtime artifact;
- Vitest tests and Prettier scripts matching the maintained sibling baseline;
- package name `@arcanemachine/pi-consult` unless a direct user decision changes it;
- `pi` manifest pointing at `./src/index.ts`;
- `pi-package` keyword and complete npm metadata;
- optional Pi peer dependency metadata matching the current extension package convention;
- `files` containing source, README, changelog, license, and the logo asset;
- `repository`, `homepage`, `bugs`, Node engine, and public `publishConfig` using the standard arcanemachine values.

Read `/workspace/projects/pi/_git/pi-package-template/AGENTS.md` and its `package.json` before creating the package, then adapt the current maintained `pi-advice` metadata rather than copying stale fields.

### 2. Implement configuration loading and validation

Keep file I/O, source selection, validation, and normalized runtime configuration separate and testable. Use Pi's `SettingsManager` and `getAgentDir()` for the settings source, and direct bounded JSON loading for the standalone file.

The loader must:

- detect standalone-file existence before deciding whether to use settings;
- detect a conflicting `pi-consult` namespace in the relevant settings sources;
- preserve source-specific diagnostics;
- honor trusted-project settings only;
- reject malformed JSON, non-object roots, unknown fields, invalid model specs, invalid stage/consultant shapes, and unknown aliases;
- return a normalized configuration or a concise diagnostic without throwing for expected user configuration mistakes;
- revalidate on session start/reload and at command execution when the runtime needs current configuration.

Do not use environment variables, credentials, session entries, or command arguments as configuration storage.

### 3. Implement command parsing and autocomplete

Add `/consult` with pure parsing helpers and dynamic workflow-name completion. Completion behavior should be conservative and Pi-idiomatic:

- workflow names are offered in the first argument position;
- `--context` is offered after a recognized workflow and separating whitespace;
- no completion is offered inside opaque prompt text;
- malformed leading options return usage from the handler rather than being silently accepted;
- empty prompt text is accepted;
- completion data is refreshed from the current valid configuration without exposing prompt contents or credentials.

Follow the `pi-advice` leading-option parsing style and the Pi `registerCommand` `getArgumentCompletions` contract.

### 4. Implement the shared consultation engine

Implement one engine invoked by the slash command. It should accept the normalized workflow name, optional prompt, context choice, context snapshot, model registry, abort signal, and result-reporting hooks as needed.

For each consultant completion:

- resolve `provider/model-id` through the registry;
- check configured authentication;
- construct an isolated system prompt and one bounded consultation input;
- omit tools entirely from the completion context;
- pass the active abort signal;
- extract text blocks and classify empty/error/aborted responses;
- return usage and generation metadata.

Use stage barriers and concurrent fan-out. Keep the engine independent of TUI rendering and command-specific notifications.

### 5. Register the user-driven command

Register `/consult` with the shared engine and command parser. Do not register an agent-callable consultation tool. Use `ctx.hasUI` checks for notifications, keep print/RPC behavior deterministic and usable, and send the visible versioned result with `triggerTurn: true` only when the consultation succeeds.

### 6. Add package documentation and metadata

Before finalizing documentation, perform the project-required focused documentation survey: inspect several recently maintained sibling packages and recent documentation conventions, then independently verify the findings. The survey must cover README installation/configuration/usage language, package AGENTS instructions, changelog structure, metadata, and whether a logo is shown in the README.

Create or update, in the child package only:

- `README.md` documenting the distinction from `pi-advice`, configuration source precedence/conflict behavior, model aliases, workflow/stage semantics, empty consultations, context behavior, command-only syntax and continuation, strict failure behavior, text-only/no-tools boundary, installation, and authentication;
- `AGENTS.md` with child-repository commit/verification instructions and package-specific invariants, without duplicating superproject coordination details unnecessarily;
- `CHANGELOG.md` with an initial unreleased entry;
- `LICENSE.md` using the standard project license;
- `logo.jpg`, exactly 500×500 pixels and JPEG encoded, with a centered 250-pixel README presentation and descriptive alt text;
- complete `package.json` metadata and `pi` manifest.

The logo is a required package/gallery deliverable for this package. Present the candidate visual or a concise preview description to the user before final release preparation if the exact design has not already been accepted. Do not publish it or any package artifact.

### 7. Integrate the package into the superproject

After the child repository has a verified local commit:

- add the `packages/pi-consult` submodule entry to `.gitmodules` with the standard SSH origin;
- add `./packages/pi-consult/src/index.ts` to root `package.json` `pi.extensions`;
- add `pi-consult` to the appropriate root `README.md` package list with a concise accurate description;
- keep coordination plans under `docs/pi-consult/`, never inside the child package;
- stage only files belonging to this effort.

Do not alter unrelated package pointers or run the destructive root formatter.

### 8. Apply reusable guidance lessons

At closeout, update `/workspace/projects/pi/AGENTS.md` only where the durable guidance materially changes. Preserve the existing general principles, but encode these verified lessons:

- most extensions should use Pi's namespaced `settings.json` by default; a package-owned config file is an explicit exception requiring an intentional source/precedence/conflict contract;
- a new package's standard GitHub origin may be configured locally without requiring remote reachability when the user owns repository creation/push;
- logo/gallery asset work and npm release preparation are standard closeout items to offer for new public packages;
- the user owns GitHub pushes and npm publication; agents may perform local repository commits, tags, packing, and release preparation but must not push or publish without explicit authorization;
- explicit user-driven commands are safer than agent-callable tools when an operation must require user intent;
- `getAllTools()` metadata is not executable tool access, so nested general Pi tools require a separate runtime architecture and must not be implied by a direct completion call.

Avoid adding transient task details, agent names, commit hashes, or speculative future-work notes to guidance.

## Verification plan

### Package-local automated checks

From `packages/pi-consult`, run and record successful results for:

```bash
npm run format:check
npm run typecheck
npm run test
npm run build
npm pack --dry-run
```

Tests should cover at minimum:

- standalone-file selection, settings fallback, global/project merge, trusted-project gating, and standalone/settings conflict;
- strict unknown-key/type/model/stage/consultant validation;
- empty prompt/context-valid workflows;
- command parsing and usage diagnostics;
- workflow-name and `--context` completion positions;
- stage ordering, concurrent consultant fan-out, result labeling, and immediately-previous-stage handoff;
- no implicit distiller and no tools in nested completion contexts;
- missing model/auth, empty/error/aborted responses, strict stage failure, cancellation, context-window rejection, output bounds, and usage aggregation;
- command use of the shared engine and its success-only continuation behavior;
- model/active-tool state remains unchanged by consultation.

Use fakes for model registry and completion calls. Unit tests must not require live provider calls or credentials.

### Root checks

From `/workspace/projects/pi`, run the applicable root pnpm validation after the child package is integrated:

```bash
pnpm install
pnpm run typecheck
pnpm run test
pnpm run build
```

Do not run `pnpm run format` for focused package work. Use package-local formatting checks or targeted Prettier writes only.

### Live user-facing check

Run an isolated Pi session using only the new package (for example `pi -ne -e . --no-session` from the child package or an equivalent root path). Verify:

- `/consult` appears and offers workflow/flag completion;
- a configured workflow runs without changing the active parent model or tools;
- an empty ad hoc prompt works when the workflow is self-contained or context-enabled;
- context-enabled execution receives the effective conversation context but no Pi system prompt/tools;
- multi-consultant output is labeled and multi-stage synthesis receives the prior stage;
- configuration errors and cancellation are concise and do not leave background calls or altered active state;
- RPC/print behavior does not depend on TUI-only APIs.

Use authenticated configured models only as needed for this check and do not expose keys or sensitive request data in logs or reports.

## Commit and release order

The selected route grants local implementation and release-preparation work but not network publication:

1. Create and validate the child package.
2. Commit the child repository atomically with a durable Conventional Commit message.
3. Prepare the child package's local release metadata/tag according to the maintained package convention; run `npm pack --dry-run`. Do not run `npm publish`.
4. Commit the updated submodule pointer, root manifest, root README, `.gitmodules`, and any integration changes atomically in the superproject.
5. Update the root `AGENTS.md` guidance in a separate documentation commit when the implementation lessons are verified.
6. Report child and superproject commits, local release/tag preparation, verification results, logo status, and any remaining user-owned actions. Do not push Git commits or publish npm artifacts.

No commit may include failing checks, unrelated files, generated runtime data, or work awaiting a required user-facing acceptance gate.

## Acceptance gates and stop conditions

The implementation owner must stop and return to the user when:

- the exact package name, public command name, or standalone config path needs to change;
- a design decision would add tools, child-agent execution, graph topology, conditional routing, retries, or another materially larger capability;
- config source precedence or trust behavior cannot be implemented as specified;
- the selected model API cannot safely receive the assembled bounded request;
- an authenticated live verification path is unavailable for user-facing behavior;
- the logo candidate or package metadata contains an unresolved user-facing choice;
- package-local or root checks fail;
- the child repository cannot be initialized on local `main` with the intended origin;
- a push, GitHub repository creation, npm publication, or other network-side release action would be required;
- active state, documentation, or repository structure contradicts this plan.

Before architecture closeout, require explicit user-facing acceptance of the running extension behavior. At final closeout, offer (do not perform) the user-owned actions:

1. push the child and superproject commits to GitHub;
2. publish the prepared package to npm;
3. make any requested logo/gallery revision.

## Out of scope

- Any consultant or nested model tool access, including `--tools`.
- Child Pi/RPC agents or subprocess orchestration.
- General DAGs, arbitrary graph edges, cycles, conditions, branching, loops, or hidden reducers.
- Automatic schedules or background consultations.
- Active-model switching or parent-state mutation.
- Credential storage or provider registration.
- Project-local standalone config files or a config directory.
- Prompt-template directories, arbitrary external workflow code, or workflow editing UI.
- Automatic retries, corrective prompting loops, or silent partial synthesis.
- Publishing to npm, pushing GitHub commits, or creating the remote repository.
