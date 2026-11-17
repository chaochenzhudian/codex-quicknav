# Codex Quick Navigation

A local Codex plugin that adds a persistent website launcher to the sidebar. It supports favicon fetching, local persistence, and opening links in the Codex in-app browser.

## Install on another computer

Requirements: Codex desktop with plugin support, Node.js 20 or newer available to Codex.

```powershell
codex plugin marketplace add chaochenzhudian/codex-quicknav
codex plugin add codex-quicknav@quicknav-local
```

Restart Codex after installation. Open **Explore** in the left navigation, find **快捷导航**, and pin it to the sidebar. Codex controls the exact rail position and keeps up to four pinned destinations.

No `npm install` is required. The MCP server is bundled with its runtime dependencies.

## Use

1. Click the compass icon in the sidebar.
2. Click **添加**.
3. Enter a URL. The name can be left blank.
4. Click a shortcut to open it in the Codex in-app browser.
5. Use **管理** to delete shortcuts.

Shortcuts are stored locally at `~/.codex/quicknav/shortcuts.json` (`%USERPROFILE%\.codex\quicknav\shortcuts.json` on Windows). Page state, including scroll position and manage mode, is cached in `localStorage`.

## Update

```powershell
codex plugin marketplace upgrade quicknav-local
codex plugin remove codex-quicknav@quicknav-local
codex plugin add codex-quicknav@quicknav-local
```

Restart Codex after updating.

## Uninstall

```powershell
codex plugin remove codex-quicknav@quicknav-local
codex plugin marketplace remove quicknav-local
```

The shortcut data file is intentionally kept after uninstalling. Delete it manually to reset all shortcuts.

## Repository layout

```text
.agents/plugins/marketplace.json
plugins/codex-quicknav/
  plugin.json
  .codex-plugin/plugin.json
  .mcp.json
  mcp.json
  assets/quicknav.svg
  server/index.bundled.mjs
  dist/mcp-app.html
  ui/                 React + Tailwind source
  scripts/             build and smoke tests
```

## Rebuild from source

```powershell
cd plugins/codex-quicknav
npm install
npm run build
npm run smoke
npm run test:tools
```

`npm run build` regenerates the single-file MCP App and the bundled MCP server.
