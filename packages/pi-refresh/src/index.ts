import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { KeyId } from "@earendil-works/pi-tui";

type RefreshMode = "single" | "since-last-user";

type RefreshPlan = {
  mode: RefreshMode;
  userText: string;
};

const DEFAULT_REFRESH_SHORTCUT = "ctrl+r" as KeyId;
const DEFAULT_REPLAY_SHORTCUT = "ctrl+shift+r" as KeyId;

function getShortcutEnv(name: string, fallback: KeyId): KeyId {
  const value = process.env[name]?.trim();
  return (value && value.length > 0 ? value : fallback) as KeyId;
}

function getLastUserText(ctx: ExtensionContext): string | undefined {
  const branch = ctx.sessionManager.getBranch();

  for (let i = branch.length - 1; i >= 0; i--) {
    const entry = branch[i];
    if (entry.type !== "message") continue;

    const message = entry.message;
    if (!("role" in message) || message.role !== "user") continue;

    if (typeof message.content === "string") {
      const text = message.content.trim();
      if (text.length > 0) return text;
      continue;
    }

    if (Array.isArray(message.content)) {
      const text = message.content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("\n")
        .trim();

      if (text.length > 0) return text;
    }
  }

  return undefined;
}

function buildRefreshPlan(mode: RefreshMode, ctx: ExtensionContext): RefreshPlan | undefined {
  const userText = getLastUserText(ctx);
  if (!userText) return undefined;

  return { mode, userText };
}

function executeRefreshPlan(pi: ExtensionAPI, ctx: ExtensionContext, plan: RefreshPlan): void {
  if (ctx.isIdle()) {
    pi.sendUserMessage(plan.userText);
    ctx.ui.notify("Refreshing last turn", "info");
    return;
  }

  ctx.abort();
  pi.sendUserMessage(plan.userText, { deliverAs: "followUp" });

  if (plan.mode === "since-last-user") {
    ctx.ui.notify("Replay queued from last user message", "info");
  } else {
    ctx.ui.notify("Refresh queued", "info");
  }
}

export default function piRefreshExtension(pi: ExtensionAPI): void {
  const refreshShortcut = getShortcutEnv("PI_REFRESH_SHORTCUT", DEFAULT_REFRESH_SHORTCUT);
  const replayShortcut = getShortcutEnv("PI_REFRESH_REPLAY_SHORTCUT", DEFAULT_REPLAY_SHORTCUT);

  async function runRefresh(mode: RefreshMode, ctx: ExtensionContext): Promise<void> {
    const plan = buildRefreshPlan(mode, ctx);
    if (!plan) {
      ctx.ui.notify("No user message found to refresh", "warning");
      return;
    }

    executeRefreshPlan(pi, ctx, plan);
  }

  pi.registerShortcut(refreshShortcut as KeyId, {
    description: "Refresh last/in-progress response",
    handler: async (ctx) => {
      await runRefresh("single", ctx);
    },
  });

  pi.registerShortcut(replayShortcut as KeyId, {
    description: "Replay from the last user message",
    handler: async (ctx) => {
      await runRefresh("since-last-user", ctx);
    },
  });
}
