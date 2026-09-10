# pi-advice short stop-option alias plan

## Scope

Add `-s` as an accepted alias for the existing `--stop` option on `/advise` and `/advise-every`.

## Implementation

- Extend shared command parsing to recognize `-s` anywhere `--stop` is accepted while preserving duplicate-option and leading-option validation.
- Keep the normalized command result as `stop: boolean`; no controller changes are needed.
- Offer `-s` through autocomplete and update command usage, README guidance, changelog, and command descriptions.
- Add parser and completion tests for the alias on both public commands.

## Verification and delivery

Run package formatting, typechecking, tests, build, and `npm pack --dry-run`. Verify the command surface in an isolated Pi session if available. Commit the child package change, prepare the local patch release, then commit the updated submodule pointer and this plan in the superproject. Do not push or publish.
