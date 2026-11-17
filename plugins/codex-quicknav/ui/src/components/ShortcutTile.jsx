import { useEffect, useState } from "react";
import { letterIcon } from "../lib/icons";

export function ShortcutTile({ shortcut, onOpen }) {
  const fallback = letterIcon(shortcut.name, shortcut.hostname);
  const [src, setSrc] = useState(shortcut.icon || fallback);

  useEffect(() => {
    setSrc(shortcut.icon || fallback);
  }, [shortcut.icon, fallback]);

  return (
    <div className="qn-tile">
      <button
        type="button"
        className="flex w-full flex-col items-center gap-2.5 rounded-2xl outline-none"
        title={shortcut.url}
        onClick={() => onOpen(shortcut)}
      >
        <span className="qn-circle">
          <img
            className="qn-favicon"
            src={src}
            alt=""
            draggable="false"
            onError={() => setSrc(fallback)}
          />
        </span>
        <span className="qn-label">{shortcut.name}</span>
      </button>
    </div>
  );
}
