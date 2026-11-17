import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { inspectSite, normalizeUrl } from "./favicon.mjs";
import { newShortcutId, withStore } from "./store.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(HERE, "..");
const APP_HTML = path.join(PLUGIN_ROOT, "dist", "mcp-app.html");
const RESOURCE_URI = "ui://codex-quicknav/index.html";

// Inline glyph keeps the sidebar entrypoint available offline. Codex uses the
// tool icon first, then this MCP server icon for the navigation item.
//
// Codex was rendering the previous theme="dark" variant (#a3a3a3) on the light
// rail, which looked washed out next to the built-in icons. Ship one neutral
// glyph instead: 1.9 stroke on a 24px grid plus #75797f matches the built-in
// rail exactly (sampled: dark #767676, average #a6a6a6).
const ICON_RAIL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNCcgaGVpZ2h0PScyNCcgdmlld0JveD0nMCAwIDI0IDI0JyBmaWxsPSdub25lJyBzdHJva2U9JyM3NTc5N2YnIHN0cm9rZS13aWR0aD0nMS45JyBzdHJva2UtbGluZWNhcD0ncm91bmQnIHN0cm9rZS1saW5lam9pbj0ncm91bmQnPjxjaXJjbGUgY3g9JzEyJyBjeT0nMTInIHI9JzguNScvPjxwYXRoIGQ9J20xNS40IDguNi0xLjggNS01IDEuOCAxLjgtNXonLz48L3N2Zz4=";

const server = new McpServer({
  name: "Codex Quick Navigation",
  version: "1.0.3",
  icons: [{ src: ICON_RAIL, mimeType: "image/svg+xml", sizes: ["any"] }],
});

function jsonResult(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value,
  };
}

function errorResult(message) {
  return { isError: true, content: [{ type: "text", text: message }] };
}

function cleanName(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 40) : "";
}

// The global entrypoint is the sidebar registration. Codex renders the button
// from this tool's title and icon, then opens the linked ui:// resource when
// the user clicks it. The server must accept an empty argument object.
registerAppTool(
  server,
  "quicknav.open",
  {
    title: "快捷导航",
    description: "Open the Quick Navigation quick-link page.",
    inputSchema: z.object({}),
    _meta: {
      ui: { resourceUri: RESOURCE_URI },
      "openai/ui": { entrypoints: [{ type: "global" }] },
    },
  },
  async () => ({
    content: [{ type: "text", text: "Quick Navigation is ready." }],
  }),
);

// These tools are called by the MCP App through the host bridge. They are not
// entrypoints, so they do not create extra sidebar buttons.
server.registerTool(
  "quicknav.shortcuts.list",
  {
    title: "List quick links",
    description: "List saved quick-navigation shortcuts.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
  },
  async () =>
    withStore(async (data) => ({
      value: jsonResult({ shortcuts: data.shortcuts }),
    })),
);

server.registerTool(
  "quicknav.shortcuts.add",
  {
    title: "Add quick link",
    description: "Save a website shortcut and fetch its favicon.",
    inputSchema: z.object({
      url: z.string().min(1),
      name: z.string().optional(),
    }),
  },
  async ({ url, name }) => {
    try {
      const normalized = normalizeUrl(url);
      const existing = await withStore(async (data) => ({
        value: data.shortcuts.find((item) => item.url === normalized) ?? null,
      }));
      if (existing) return jsonResult({ shortcut: existing, duplicate: true });

      const site = await inspectSite(normalized, cleanName(name));
      const fresh = await withStore(async (data) => {
        const duplicate = data.shortcuts.find((item) => item.url === site.url);
        if (duplicate) return { value: duplicate };
        const shortcut = {
          id: newShortcutId(),
          url: site.url,
          name: cleanName(name) || site.title || site.hostname,
          hostname: site.hostname,
          icon: site.icon,
          createdAt: new Date().toISOString(),
        };
        data.shortcuts.push(shortcut);
        return { changed: true, value: shortcut };
      });
      return jsonResult({ shortcut: fresh, duplicate: false });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : String(error));
    }
  },
);

server.registerTool(
  "quicknav.shortcuts.remove",
  {
    title: "Remove quick link",
    description: "Delete a saved quick-navigation shortcut.",
    inputSchema: z.object({ id: z.string().min(1) }),
    annotations: { destructiveHint: true },
  },
  async ({ id }) => {
    const removed = await withStore(async (data) => {
      const index = data.shortcuts.findIndex((item) => item.id === id);
      if (index === -1) return { value: false };
      data.shortcuts.splice(index, 1);
      return { changed: true, value: true };
    });
    if (!removed) return errorResult("快捷方式不存在");
    return jsonResult({ ok: true });
  },
);

server.registerTool(
  "quicknav.shortcuts.rename",
  {
    title: "Rename quick link",
    description: "Change the display name of a saved shortcut.",
    inputSchema: z.object({ id: z.string().min(1), name: z.string().min(1) }),
  },
  async ({ id, name }) => {
    const updated = await withStore(async (data) => {
      const shortcut = data.shortcuts.find((item) => item.id === id);
      if (!shortcut) return { value: null };
      shortcut.name = cleanName(name);
      return { changed: true, value: shortcut };
    });
    if (!updated) return errorResult("快捷方式不存在");
    return jsonResult({ shortcut: updated });
  },
);

registerAppResource(
  server,
  "Quick Navigation",
  RESOURCE_URI,
  {
    description: "Persistent website quick links.",
    _meta: {
      ui: { csp: { resourceDomains: [], connectDomains: [], frameDomains: [] } },
    },
  },
  async () => ({
    contents: [
      {
        uri: RESOURCE_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: await fs.readFile(APP_HTML, "utf8"),
        _meta: {
          ui: { csp: { resourceDomains: [], connectDomains: [], frameDomains: [] } },
        },
      },
    ],
  }),
);

await server.connect(new StdioServerTransport());
