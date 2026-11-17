# 快捷导航

Codex 侧边栏快捷导航插件。保存常用网站，自动获取 Favicon，并在 Codex 内置浏览器中打开。

安装命令见仓库根目录的 `README.md`。

## 实现要点

- `quicknav.open` 使用 MCP App `global` entrypoint 注册侧边栏入口。
- `ui/open-link` 附加 `openTarget: "in-app-browser"`，优先打开 Codex 内置浏览器。
- Favicon 由本地 MCP Server 抓取，避免 iframe 的 CORS 和 CSP 限制。
- 快捷方式持久化到 `~/.codex/quicknav/shortcuts.json`。
- 页面滚动位置和管理模式缓存在 `localStorage`。

## 组件

- `ui/src/components/SidebarEntryButton.jsx`：侧边栏按钮参考组件。Codex 实际安装时由宿主根据 entrypoint 渲染按钮。
- `ui/src/components/QuickNavPage.jsx`：快捷导航主页面。
- `server/index.mjs`：MCP Server 源码。
- `server/index.bundled.mjs`：发布使用的单文件 Server。
