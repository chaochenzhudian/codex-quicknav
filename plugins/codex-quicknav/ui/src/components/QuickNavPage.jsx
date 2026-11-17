import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddShortcutDialog } from "./AddShortcutDialog";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { CloudMark, PlusGlyph } from "./QuickNavIcon";
import { ShortcutTile } from "./ShortcutTile";
import { readState, writeState } from "../lib/storage";

const TOAST_MS = 2400;

export function QuickNavPage({ bridge }) {
  const initial = useMemo(() => readState(), []);
  const [shortcuts, setShortcuts] = useState(initial.shortcuts);
  const [loading, setLoading] = useState(initial.shortcuts.length === 0);
  const [managing, setManaging] = useState(initial.manage);
  const [addOpen, setAddOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");
  const restoredScroll = useRef(false);

  const showToast = useCallback((message) => setToast(message), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    bridge
      .listShortcuts()
      .then((items) => {
        if (cancelled) return;
        setShortcuts(items);
        setLoading(false);
        writeState({ shortcuts: items });
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bridge]);

  useEffect(() => {
    writeState({ shortcuts, manage: managing });
  }, [shortcuts, managing]);

  // Suppress the host's native context menu (which exposes DevTools) on this
  // page. Capture phase ensures nested dialogs cannot re-enable it.
  useEffect(() => {
    const blockContextMenu = (event) => event.preventDefault();
    document.addEventListener("contextmenu", blockContextMenu, true);
    return () => {
      document.removeEventListener("contextmenu", blockContextMenu, true);
    };
  }, []);

  // Restore scroll after the first paint that contains the cached shortcuts.
  useEffect(() => {
    if (restoredScroll.current) return;
    restoredScroll.current = true;
    if (!initial.scrollTop) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        window.scrollTo({ top: initial.scrollTop, behavior: "instant" });
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [initial.scrollTop]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        writeState({ scrollTop: window.scrollY });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const openAdd = useCallback(() => {
    setAddError("");
    setAddOpen(true);
  }, []);

  const closeAdd = useCallback(() => {
    if (adding) return;
    setAddOpen(false);
    setAddError("");
  }, [adding]);

  const handleAdd = useCallback(
    async (event) => {
      event.preventDefault();
      if (adding || !url.trim()) return;
      setAdding(true);
      setAddError("");
      try {
        const result = await bridge.addShortcut({ url: url.trim(), name: name.trim() });
        const shortcut = result.shortcut;
        setShortcuts((current) =>
          current.some((item) => item.id === shortcut.id) ? current : [...current, shortcut],
        );
        setAddOpen(false);
        setUrl("");
        setName("");
        showToast(result.duplicate ? "这个网站已经在列表里了" : "已添加快捷方式");
      } catch (error) {
        setAddError(error instanceof Error ? error.message : "添加失败，请检查网址");
      } finally {
        setAdding(false);
      }
    },
    [adding, bridge, name, showToast, url],
  );

  const handleOpen = useCallback(
    async (shortcut) => {
      try {
        await bridge.openLink(shortcut.url);
      } catch {
        showToast("无法打开这个网址，请检查链接设置");
      }
    },
    [bridge, showToast],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await bridge.removeShortcut(pendingDelete.id);
      setShortcuts((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      showToast("已删除快捷方式");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  }, [bridge, deleting, pendingDelete, showToast]);

  const hasShortcuts = shortcuts.length > 0;

  return (
    <main className="qn-page">
      <div className="qn-actions">
        {hasShortcuts ? (
          <button
            type="button"
            className="qn-text-button"
            data-active={managing ? "true" : "false"}
            onClick={() => setManaging((value) => !value)}
          >
            {managing ? "完成" : "管理"}
          </button>
        ) : null}
      </div>

      <section className="qn-hero">
        <CloudMark className="qn-cloud h-[68px] w-[68px]" />
        <h1 className="qn-title">我们要打开什么？</h1>

        <div className="qn-grid" aria-label="快捷方式">
          {shortcuts.map((shortcut) => (
            <ShortcutTile
              key={shortcut.id}
              shortcut={shortcut}
              managing={managing}
              onOpen={handleOpen}
              onDelete={setPendingDelete}
            />
          ))}

          <div className="qn-tile">
            <button
              type="button"
              className="flex w-full flex-col items-center gap-2.5 rounded-2xl outline-none"
              aria-label="添加快捷方式"
              onClick={openAdd}
            >
              <span className="qn-circle qn-add-circle">
                <PlusGlyph className="h-[22px] w-[22px]" />
              </span>
              <span className="qn-label">添加</span>
            </button>
          </div>
        </div>

        {loading && !hasShortcuts ? (
          <div className="qn-loading" role="status">正在加载快捷方式…</div>
        ) : null}

        {!loading && !hasShortcuts ? (
          <p className="qn-empty-hint">还没有快捷方式。添加一个常用网站，之后从这里一键打开。</p>
        ) : null}

        {hasShortcuts ? (
          <p className="qn-subtitle">点击图标将在 Codex 内置浏览器中打开</p>
        ) : null}
      </section>

      <p className="qn-footer">快捷导航 · 状态会自动保留</p>

      <AddShortcutDialog
        open={addOpen}
        busy={adding}
        error={addError}
        url={url}
        name={name}
        onUrlChange={setUrl}
        onNameChange={setName}
        onClose={closeAdd}
        onSubmit={handleAdd}
      />

      <ConfirmDeleteDialog
        shortcut={pendingDelete}
        busy={deleting}
        onCancel={() => !deleting && setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {toast ? (
        <div className="qn-toast" role="status">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
