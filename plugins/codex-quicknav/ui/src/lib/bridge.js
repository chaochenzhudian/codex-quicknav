import { McpUiOpenLinkResultSchema } from "@modelcontextprotocol/ext-apps";

function resultText(result) {
  return result?.content?.find((item) => item.type === "text")?.text ?? "";
}

function unwrap(result) {
  if (result?.isError) {
    throw new Error(resultText(result) || "操作失败");
  }
  if (result?.structuredContent && typeof result.structuredContent === "object") {
    return result.structuredContent;
  }
  const text = resultText(result);
  if (!text) throw new Error("宿主返回了空结果");
  return JSON.parse(text);
}

/**
 * Host bridge used inside the Codex MCP App iframe.
 *
 * `callServerTool` is proxied by Codex to this plugin's MCP server. The raw
 * `ui/open-link` request includes `openTarget: "in-app-browser"` so a shortcut
 * lands in Codex's built-in browser even when the global link preference is
 * set to the system browser. The standard `openLink` call is the fallback.
 */
export function createHostBridge(app) {
  const call = async (name, args = {}) =>
    unwrap(await app.callServerTool({ name, arguments: args }));

  return {
    kind: "host",
    get theme() {
      return app.getHostContext()?.theme ?? null;
    },
    async listShortcuts() {
      const data = await call("quicknav.shortcuts.list");
      return Array.isArray(data.shortcuts) ? data.shortcuts : [];
    },
    async addShortcut(input) {
      return call("quicknav.shortcuts.add", input);
    },
    async removeShortcut(id) {
      return call("quicknav.shortcuts.remove", { id });
    },
    async renameShortcut(id, name) {
      return call("quicknav.shortcuts.rename", { id, name });
    },
    async openLink(url) {
      try {
        const result = await app.request(
          { method: "ui/open-link", params: { url, openTarget: "in-app-browser", disposition: "new-tab" } },
          McpUiOpenLinkResultSchema,
        );
        if (!result?.isError) return;
      } catch {
        // Older hosts may reject the extra target hint; use the standard call.
      }
      const fallback = await app.openLink({ url });
      if (fallback?.isError) throw new Error("宿主拒绝打开这个网址");
    },
  };
}

const PREVIEW_KEY = "codex-quicknav.preview.shortcuts.v1";

function previewIcon(url) {
  try {
    const host = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`;
  } catch {
    return "";
  }
}

function readPreview() {
  try {
    const value = JSON.parse(localStorage.getItem(PREVIEW_KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

/**
 * Browser-only bridge for design review (`?preview=1`). It deliberately uses
 * localStorage instead of the MCP server so the page can be opened standalone.
 */
export function createPreviewBridge() {
  return {
    kind: "preview",
    theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    async listShortcuts() {
      return readPreview();
    },
    async addShortcut({ url, name }) {
      const normalized = new URL(/^[a-z]+:/i.test(url) ? url : `https://${url}`);
      normalized.hash = "";
      const items = readPreview();
      const existing = items.find((item) => item.url === normalized.toString());
      if (existing) return { shortcut: existing, duplicate: true };
      const shortcut = {
        id: crypto.randomUUID(),
        url: normalized.toString(),
        name: name?.trim() || normalized.hostname.replace(/^www\./, ""),
        hostname: normalized.hostname,
        icon: previewIcon(normalized.toString()),
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(PREVIEW_KEY, JSON.stringify([...items, shortcut]));
      return { shortcut, duplicate: false };
    },
    async removeShortcut(id) {
      localStorage.setItem(
        PREVIEW_KEY,
        JSON.stringify(readPreview().filter((item) => item.id !== id)),
      );
      return { ok: true };
    },
    async renameShortcut(id, name) {
      const items = readPreview().map((item) =>
        item.id === id ? { ...item, name } : item,
      );
      localStorage.setItem(PREVIEW_KEY, JSON.stringify(items));
      return { shortcut: items.find((item) => item.id === id) };
    },
    async openLink(url) {
      window.open(url, "_blank", "noopener,noreferrer");
    },
  };
}
