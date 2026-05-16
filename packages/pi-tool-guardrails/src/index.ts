import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const TOOL_GUARDRAILS = `
Pi tool-usage guardrails:
- Prefer recursive globs for repository scans (use **/name.ext unless you intentionally need one level only).
- If you already know likely locations, prefer a targeted directory scope before broad **/ scans.
- Validate tool argument types before calling tools (booleans, numbers, required fields).
- If find/grep returns no results and that seems unexpected, retry once with a broader pattern.
- When a tool call fails validation, acknowledge the exact bad argument and retry with corrected args.
`;

export default function piToolGuardrailsExtension(pi: ExtensionAPI): void {
  pi.on("before_agent_start", async (event) => {
    return {
      systemPrompt: `${event.systemPrompt}\n\n${TOOL_GUARDRAILS.trim()}`,
    };
  });
}
