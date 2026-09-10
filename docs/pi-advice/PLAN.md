# pi-advice short stop-option alias plan

## Status

Implemented in child commit `553a3d0`, prepared as local package release `v0.1.10`, and integrated through superproject commit `4451037`. Package and root validation pass; GitHub pushes and npm publication remain user-owned.

## Scope

Add `-s` as an accepted alias for the existing `--stop` option on `/advise` and `/advise-every`; the implementation also adds the requested `-t` alias for `--tools`.

## Implementation

- Extend shared command parsing to recognize `-s` anywhere `--stop` is accepted while preserving duplicate-option and leading-option validation.
- Extend the same shared option handling with `-t` as an alias for `--tools`.
- Keep the normalized command result as `stop: boolean` and `tools: boolean`; no controller changes are needed.
- Offer both aliases through autocomplete and update command usage, README guidance, changelog, and command descriptions.
- Add parser and completion tests for both aliases on both public commands.

## Verification and delivery

Package formatting, typechecking, tests, build, and `npm pack --dry-run` pass. An isolated Pi TUI startup check loaded the extension successfully. The child package change is committed, the local `v0.1.10` patch release is prepared and tagged, and the superproject pointer is committed. Do not push or publish.
