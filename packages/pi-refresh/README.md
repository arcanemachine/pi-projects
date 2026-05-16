# pi-refresh

> Retry the current/last turn with a shortcut (default `Ctrl+R`).

A Pi extension that lets you quickly re-issue the last user prompt, including while a response is still streaming.

## Shortcuts

- `Ctrl+R`: Refresh last/in-progress response
- `Ctrl+Shift+R`: Replay from the last user message

Current implementation re-sends the most recent user text message in both cases, with separate hooks in the code for future behavior divergence.

## Installation

### From local clone

```bash
pi install /path/to/pi-refresh
```

### From GitHub

```bash
pi install git:github.com/arcanemachine/pi-refresh
```

## Configuration

Default shortcuts can be overridden with environment variables:

```bash
PI_REFRESH_SHORTCUT="ctrl+r" PI_REFRESH_REPLAY_SHORTCUT="ctrl+shift+r" pi
```

## Behavior

1. If Pi is idle, refresh sends the last user message immediately.
2. If Pi is streaming, refresh aborts the current turn and queues the retry.
3. If no prior user message is found, the extension shows a warning.

## Notes

- `Ctrl+R` may conflict with other views/keymaps depending on where focus is in Pi.
- This extension currently extracts text from the last user message. Non-text-only payload replay is a future improvement.
