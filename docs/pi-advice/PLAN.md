# pi-advice option aliases and prompt calibration plan

## Status

The option aliases were implemented in child commit `553a3d0` and released locally as `v0.1.10`. Prompt calibration is implemented in child commit `be522fe` and prepared as local release `v0.1.11`; the updated superproject pointer is still pending. GitHub pushes and npm publication remain user-owned.

## Scope

Maintain concise, user-friendly reconsideration controls: add `-s` as an accepted alias for `--stop`, add `-t` as an accepted alias for `--tools`, and allow the advisor to conclude that no material improvement is needed without manufacturing criticism or actions.

## Implementation

- Extend shared command parsing to recognize `-s` anywhere `--stop` is accepted while preserving duplicate-option and leading-option validation.
- Extend the same shared option handling with `-t` as an alias for `--tools`.
- Keep the normalized command result as `stop: boolean` and `tools: boolean`; no controller changes are needed.
- Offer both aliases through autocomplete and update command usage, README guidance, changelog, and command descriptions.
- Add parser and completion tests for both aliases on both public commands.
- Update the reconsideration prompt and tests so no-change conclusions and no-action recommendations are explicitly valid.

## Verification and delivery

Package formatting, typechecking, tests, build, and `npm pack --dry-run` pass for `v0.1.11`; 117 tests pass. The child release is prepared and tagged. Commit the updated submodule pointer in the superproject, then leave GitHub pushes and npm publication to the user.
