import { useEffect, useRef } from "react";

export function AddShortcutDialog({
  open,
  busy,
  error,
  url,
  name,
  onUrlChange,
  onNameChange,
  onClose,
  onSubmit,
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
      <form className="qn-dialog" onSubmit={onSubmit} role="dialog" aria-modal="true" aria-labelledby="qn-add-title">
        <h2 id="qn-add-title" className="qn-dialog-title">添加快捷方式</h2>
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

        {error ? <p className="qn-error" role="alert">{error}</p> : null}

        <div className="qn-dialog-actions">
          <button type="button" className="qn-button qn-button-secondary" onClick={onClose} disabled={busy}>
            取消
          </button>
          <button type="submit" className="qn-button qn-button-primary" disabled={busy || !url.trim()}>
            {busy ? "正在获取图标…" : "添加"}
          </button>
        </div>
      </form>
    </div>
  );
}
