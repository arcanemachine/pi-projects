/**
 * Web Search Extension
 *
 * Provides a /search tool to search the web, and /grep_url_content to search
 * for specific content within a web page. Requires SearXNG to be running
 * (default: http://127.0.0.1:8080)
 *
 * Usage:
 * - /search: Search the web using SearXNG
 * - /grep_url_content: Fetch a URL and grep for specific content
 * - Set SEARXNG_URL environment variable if your SearXNG instance is at a different URL
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const SearchParams = Type.Object({
  action: Type.Unsafe<"search" | "load">({
    type: "string",
    enum: ["search", "load"],
  }),
  input: Type.String({ description: "Search query or full URL" }),
});

const GrepUrlContentParams = Type.Object({
  url: Type.String({ description: "The URL to fetch" }),
  query: Type.String({ description: "The search query to grep for" }),
  beforeLines: Type.Optional(
    Type.Number({
      description: "Number of lines of context before each match (default: 1)",
    }),
  ),
  afterLines: Type.Optional(
    Type.Number({
      description: "Number of lines of context after each match (default: 1)",
    }),
  ),
});

// Cache entry with timestamp for expiration (5 minutes default TTL)
interface CacheEntry {
  text: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MINUTES || "5") * 60 * 1000;

export default function (pi: ExtensionAPI) {
  // Search tool - searches the web or loads/extracts text from a URL
  pi.registerTool({
    name: "search",
    label: "Search",
    description: "Search the web or load and extract text from a URL",
    promptSnippet:
      "Search the web or load page text; when available, prefer subagents for broader investigations and Playwright for dynamic pages.",
    promptGuidelines: [
      "Use search for lightweight web lookups and quick URL text extraction.",
      "If available, prefer spawn_subagent or spawn_parallel for multi-step web research to preserve main-agent context.",
      "If available, prefer Playwright-based browsing for dynamic or interactive pages that require JavaScript rendering.",
    ],
    parameters: SearchParams,

    async execute(_toolCallId, params, _onUpdate, _ctx, _signal) {
      const action = params.action as "search" | "load";
      const input = params.input as string;

      if (action === "search") {
        const searxngUrl = process.env.SEARXNG_URL ?? "http://127.0.0.1:8080";
        const url = `${searxngUrl}/search?q=${encodeURIComponent(input)}&format=json&categories=general`;
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`SearXNG error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        const results = (data.results ?? [])
          .slice(0, 5)
          .map(
            (r: any, i: number) =>
              `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.content ?? ""}`,
          )
          .join("\n\n");
        const text = `Search query: ${input}\n\n${results || "No results found."}`;

        return {
          content: [{ type: "text" as const, text }],
          details: { query: input },
        };
      } else {
        const cached = cache.get(input);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          return {
            content: [{ type: "text" as const, text: cached.text }],
            details: { url: input, cached: true },
          };
        }

        const res = await fetch(input, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; pi-agent/1.0)" },
        });

        if (!res.ok) {
          throw new Error(
            `Failed to load page: ${res.status} ${res.statusText}`,
          );
        }

        const html = await res.text();
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, "")
          .replace(/\n\s*\n/g, "\n\n")
          .replace(/^\s+|\s+$/g, "")
          .trim();

        cache.set(input, { text, timestamp: Date.now() });

        return {
          content: [{ type: "text" as const, text: text }],
          details: { url: input, cached: false },
        };
      }
    },
  });

  // Grep URL Content tool - fetches a URL and searches for specific content
  pi.registerTool({
    name: "grep_url_content",
    label: "Grep URL Content",
    description:
      "Fetch a web page and grep for specific content, returning matching lines with configurable lines of context before and after each match (default: 1 before, 1 after). Uses cache to avoid repeated fetches. Results contain line numbers to help economize context sprawl.",
    promptSnippet:
      "Fetch a page and grep matching lines; when available, prefer Playwright for dynamic pages and subagents for broader research tasks.",
    promptGuidelines: [
      "Use grep_url_content for targeted extraction from known or likely static URLs.",
      "If available, prefer Playwright-based browsing when page content depends on JavaScript rendering.",
      "If available, prefer spawn_subagent or spawn_parallel for deep, multi-page investigations to keep main-agent context compact.",
    ],
    parameters: GrepUrlContentParams,

    async execute(_toolCallId, params, _onUpdate, _ctx, _signal) {
      const url = params.url as string;
      const query = params.query!;
      const beforeLines = (params.beforeLines as number | undefined) ?? 1;
      const afterLines = (params.afterLines as number | undefined) ?? 1;

      const cached = cache.get(url);
      let text: string = "";
      const isCached = cached && Date.now() - cached.timestamp < CACHE_TTL_MS;

      if (isCached) {
        text = cached.text;
      } else {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; pi-agent/1.0)" },
        });

        if (!res.ok) {
          throw new Error(
            `Failed to load page: ${res.status} ${res.statusText}`,
          );
        }

        const contentType = res.headers.get("content-type") || "";

        // Handle HTML pages
        if (contentType.includes("text/html") || url.endsWith(".html")) {
          const html = await res.text();
          text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, "")
            .replace(/\n\s*\n/g, "\n\n")
            .replace(/^\s+|\s+$/g, "")
            .trim();
        } else {
          // Handle plain text or other content types directly
          const textContent = await res.text();
          text = textContent
            .replace(/\n\s*\n/g, "\n\n")
            .replace(/^\s+|\s+$/g, "")
            .trim();
        }

        cache.set(url, { text, timestamp: Date.now() });
      }

      return {
        content: [
          {
            type: "text" as const,
            text: grepWithContext(text, query, beforeLines, afterLines),
          },
        ],
        details: { url, query, cached: isCached },
      };
    },
  });
}

function grepWithContext(
  text: string,
  query: string,
  beforeLines: number = 1,
  afterLines: number = 1,
): string {
  const lines = text.split("\n");
  const matches: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(query.toLowerCase())) {
      const start = Math.max(0, i - beforeLines);
      const end = Math.min(lines.length, i + afterLines + 1);
      for (let j = start; j < end; j++) {
        matches.push(`${j + 1}: ${lines[j]}`);
      }
    }
  }

  return matches.join("\n");
}
