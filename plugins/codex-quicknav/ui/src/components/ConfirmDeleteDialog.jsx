import { useEffect } from "react";

export function ConfirmDeleteDialog({ shortcut, busy, onCancel, onConfirm }) {
  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut, busy, onCancel]);

  if (!shortcut) return null;

  return (
    <div
      className="qn-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className="qn-dialog" role="dialog" aria-modal="true" aria-labelledby="qn-delete-title">
        <h2 id="qn-delete-title" className="qn-dialog-title">删除快捷方式？</h2>
        <p className="qn-dialog-copy">
          “{shortcut.name}” 会从快捷导航中移除。网站本身不受影响。
        </p>
        <div className="qn-dialog-actions">
          <button type="button" className="qn-button qn-button-secondary" onClick={onCancel} disabled={busy}>
            取消
          </button>
          <button
            type="button"
            className="qn-button qn-button-primary"
            style={{ background: "var(--qn-danger)", color: "#fff" }}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "正在删除…" : "删除"}
          </button>
        </div>
      </div>
    </div>
  );
}
