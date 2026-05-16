# IDEAS

## Near-term

1. Preserve and replay full structured user content (text + images), not just text.
2. Add cooldown/debounce to avoid repeated rapid retries.
3. Optional confirmation before replay when prior turn executed tools.
4. Status line indicator for queued refresh/replay.

## Mid-term

1. True "since last user message" branch replay by rewinding/forking session state.
2. Config file support (`.pi/settings.json`) instead of env-only shortcut overrides.
3. Command equivalents (`/refresh`, `/replay`) for non-shortcut workflows.

## Long-term

1. Provider-aware retry strategy (e.g., model/provider cycling hints).
2. Retry policy profiles (fast retry, conservative retry, tool-safe retry).
3. Extension telemetry hooks for retry outcomes and latency tracking.
