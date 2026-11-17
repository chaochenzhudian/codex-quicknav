import { useEffect, useRef, useState } from "react";
import { CloseGlyph } from "./QuickNavIcon";
import { letterIcon } from "../lib/icons";

function ManageRow({ shortcut, onDelete }) {
  const fallback = letterIcon(shortcut.name, shortcut.hostname);
  const [src, setSrc] = useState(shortcut.icon || fallback);

  useEffect(() => {
    setSrc(shortcut.icon || fallback);
  }, [shortcut.icon, fallback]);

  return (
    <li className="qn-manage-item">
      <img
        className="qn-manage-favicon"
        src={src}
        alt=""
        draggable="false"
        onError={() => setSrc(fallback)}
      />
      <span className="qn-manage-meta">
        <span className="qn-manage-name">{shortcut.name}</span>
        <span className="qn-manage-url">{shortcut.hostname}</span>
      </span>
      <button type="button" className="qn-manage-remove" onClick={() => onDelete(shortcut)}>
        删除
      </button>
    </li>
  );
}

export function ManageDialog({
  open,
  busy,
  error,
  url,
  name,
  shortcuts,
  onUrlChange,
  onNameChange,
  onClose,
  onSubmit,
  onDelete,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="qn-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <form
        className="qn-dialog qn-manage"
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qn-manage-title"
      >
        <div className="qn-manage-header">
          <h2 id="qn-manage-title" className="qn-dialog-title">
            管理快捷方式
          </h2>
          <button
            type="button"
            className="qn-icon-button"
            aria-label="关闭"
            onClick={onClose}
            disabled={busy}
          >
            <CloseGlyph className="h-4 w-4" />
          </button>
        </div>
        <p className="qn-dialog-copy">输入网址后会自动获取网站图标。名称留空时使用网站标题。</p>

        <label className="qn-field">
          <span className="qn-field-label">网址</span>
          <input
            ref={inputRef}
            className="qn-input"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck="false"
            placeholder="https://example.com"
            value={url}
            disabled={busy}
            onChange={(event) => onUrlChange(event.target.value)}
          />
        </label>

        <label className="qn-field">
          <span className="qn-field-label">名称（可选）</span>
          <input
            className="qn-input"
            type="text"
            maxLength={40}
            placeholder="例如 GitHub"
            value={name}
            disabled={busy}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>

        {error ? (
          <p className="qn-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="qn-dialog-actions">
          <button type="submit" className="qn-button qn-button-primary" disabled={busy || !url.trim()}>
            {busy ? "正在获取图标…" : "保存"}
          </button>
        </div>

        {shortcuts.length > 0 ? (
          <div className="qn-manage-section">
            <p className="qn-field-label">已保存 · {shortcuts.length}</p>
            <ul className="qn-manage-list">
              {shortcuts.map((shortcut) => (
                <ManageRow key={shortcut.id} shortcut={shortcut} onDelete={onDelete} />
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </div>
  );
}
