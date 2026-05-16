# pi-tool-guardrails

> Appends Pi-specific tool-usage guardrails to the system prompt.

This extension adds a short guardrail block on each turn via `before_agent_start` to reduce common tool misuse issues (glob scope mistakes, bad argument types, and weak fallback behavior).

## Installation

### From local clone

```bash
pi install /path/to/pi-tool-guardrails
```

### From GitHub

```bash
pi install git:github.com/arcanemachine/pi-tool-guardrails
```

## Behavior

The extension appends guardrails that remind the agent to:

1. Use recursive globs by default for repo scans.
2. Prefer targeted directory scope first when likely locations are known.
3. Validate tool argument types before calls.
4. Retry once with broader patterns only when empty results seem unexpected.
5. Report invalid arguments and retry with corrections.
