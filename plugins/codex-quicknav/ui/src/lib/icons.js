const palettes = [
  ["#e8f0ff", "#2f6fed"],
  ["#e9f7ef", "#1f8a4c"],
  ["#fff1e8", "#c2571a"],
  ["#f3e8ff", "#7c3aed"],
  ["#e8f7f7", "#0f766e"],
];

/** Fallback tile icon when a favicon fails to decode inside the sandbox. */
export function letterIcon(name, hostname = "") {
  const label = Array.from((name || hostname || "?").trim())[0]?.toUpperCase() || "?";
  let hash = 0;
  for (const char of hostname || label) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const [background, foreground] = palettes[hash % palettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${background}"/><text x="32" y="41" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="28" font-weight="600" fill="${foreground}">${label.replace(/[<>&]/g, "")}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
