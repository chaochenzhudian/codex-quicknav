import { useEffect, useState } from "react";
import {
  App as McpApp,
  applyDocumentTheme,
  applyHostStyleVariables,
} from "@modelcontextprotocol/ext-apps";
import { CloudMark } from "./components/QuickNavIcon";
import { QuickNavPage } from "./components/QuickNavPage";
import { createHostBridge, createPreviewBridge } from "./lib/bridge";

function applyHostAppearance(context) {
  if (context?.theme) applyDocumentTheme(context.theme);
  else if (!document.documentElement.dataset.theme) {
    applyDocumentTheme(matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  if (context?.styles?.variables) applyHostStyleVariables(context.styles.variables);
}

function LoadingScreen() {
  return (
    <main className="qn-page">
      <div className="qn-hero">
        <CloudMark className="qn-cloud h-[68px] w-[68px]" />
        <h1 className="qn-title">我们要打开什么？</h1>
        <div className="qn-grid">
          <div className="qn-tile">
            <span className="qn-skeleton" />
            <span className="qn-label">加载中</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function ErrorScreen({ message }) {
  return (
    <main className="qn-page">
      <div className="qn-hero">
        <CloudMark className="qn-cloud h-[68px] w-[68px]" />
        <h1 className="qn-title">快捷导航暂时不可用</h1>
        <p className="qn-empty-hint">{message}</p>
        <p className="qn-subtitle">请关闭这个页面后重新点击侧边栏图标。</p>
      </div>
    </main>
  );
}

export default function App() {
  const [bridge, setBridge] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("preview")) {
      const preview = createPreviewBridge();
      applyHostAppearance({ theme: preview.theme });
      setBridge(preview);
      return;
    }

    let disposed = false;
    const app = new McpApp({ name: "Quick Navigation", version: "1.0.2" }, {});

    // Register every handler before connect(), as required by the MCP Apps
    // lifecycle. The host may send host-context notifications immediately.
    app.onhostcontextchanged = (context) => applyHostAppearance(context);
    app.onteardown = async () => ({});
    app.onerror = (reason) => console.error("[quicknav]", reason);

    app
      .connect()
      .then(() => {
        if (disposed) {
          void app.close();
          return;
        }
        applyHostAppearance(app.getHostContext());
        setBridge(createHostBridge(app));
      })
      .catch((reason) => {
        if (!disposed) {
          setError(reason instanceof Error ? reason.message : "MCP 连接失败");
        }
      });

    return () => {
      disposed = true;
      void app.close();
    };
  }, []);

  if (error) return <ErrorScreen message={error} />;
  if (!bridge) return <LoadingScreen />;
  return <QuickNavPage bridge={bridge} />;
}
