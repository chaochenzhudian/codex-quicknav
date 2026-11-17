import crypto from "node:crypto";

const MAX_HTML_BYTES = 1_000_000;
const MAX_ICON_BYTES = 512_000;
const TIMEOUT_MS = 6500;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36 CodexQuickNav/1.0";

export function normalizeUrl(input) {
  if (typeof input !== "string" || !input.trim()) throw new Error("请输入网址");
  const trimmed = input.trim();
  const withScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withScheme);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("只支持 http 或 https 网址");
  }
  if (url.username || url.password) throw new Error("网址不能包含账号或密码");
  url.hash = "";
  return url.toString();
}

async function fetchLimited(url, { as = "text", maxBytes }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: as === "text" ? "text/html,application/xhtml+xml" : "image/*,*/*;q=0.8",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) throw new Error("response too large");
    return { buffer, response };
  } finally {
    clearTimeout(timer);
  }
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function readAttribute(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? decodeHtmlEntities(match[1] ?? match[2] ?? match[3] ?? "").trim() : null;
}

function collectIconCandidates(html, baseUrl) {
  const candidates = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (readAttribute(tag, "rel") ?? "").toLowerCase();
    if (!/(^|\s)(icon|shortcut icon|apple-touch-icon|apple-touch-icon-precomposed|mask-icon)(\s|$)/.test(rel)) {
      continue;
    }
    const href = readAttribute(tag, "href");
    if (!href) continue;
    const sizes = readAttribute(tag, "sizes") ?? "";
    const size = Math.max(0, ...(sizes.match(/\d+/g) ?? []).map(Number));
    let score = size;
    if (rel.includes("apple-touch-icon")) score += 64;
    if (rel.includes("svg")) score += 32;
    try {
      const resolved = new URL(href, baseUrl).toString();
      if (resolved.startsWith("data:image/")) candidates.push({ url: resolved, score: score + 100 });
      else if (resolved.startsWith("http:") || resolved.startsWith("https:")) {
        candidates.push({ url: resolved, score });
      }
    } catch {
      // Ignore malformed icon URLs and try the next candidate.
    }
  }
  return candidates.sort((a, b) => b.score - a.score);
}

function sniffImageType(buffer, contentType, url) {
  if (contentType?.startsWith("image/")) return contentType.split(";")[0].toLowerCase();
  if (buffer.subarray(0, 4).toString("hex") === "89504e47") return "image/png";
  if (buffer.subarray(0, 3).toString("ascii") === "GIF") return "image/gif";
  if (buffer.subarray(0, 2).toString("ascii") === "\xff\xd8") return "image/jpeg";
  if (buffer.subarray(0, 4).toString("ascii") === "<svg" || buffer.subarray(0, 5).toString("ascii") === "<?xml") {
    return "image/svg+xml";
  }
  if (url.toLowerCase().includes(".svg")) return "image/svg+xml";
  return null;
}

async function iconToDataUrl(candidate) {
  if (candidate.url.startsWith("data:image/")) return candidate.url;
  const { buffer, response } = await fetchLimited(candidate.url, {
    as: "buffer",
    maxBytes: MAX_ICON_BYTES,
  });
  const type = sniffImageType(buffer, response.headers.get("content-type"), candidate.url);
  if (!type) throw new Error("not an image");
  return `data:${type};base64,${buffer.toString("base64")}`;
}

export function makeLetterIcon(name, hostname) {
  const label = Array.from((name || hostname || "?").trim())[0]?.toUpperCase() || "?";
  const palettes = [
    ["#e8f0ff", "#2f6fed"],
    ["#e9f7ef", "#1f8a4c"],
    ["#fff1e8", "#c2571a"],
    ["#f3e8ff", "#7c3aed"],
    ["#e8f7f7", "#0f766e"],
  ];
  const hash = crypto.createHash("sha1").update(hostname || label).digest()[0];
  const [background, foreground] = palettes[hash % palettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${background}"/><text x="32" y="40" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="28" font-weight="600" fill="${foreground}">${label.replace(/[<>&]/g, "")}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Fetch the page title and best available favicon, converting it to a data URL. */
export async function inspectSite(rawUrl, preferredName) {
  const url = normalizeUrl(rawUrl);
  const parsed = new URL(url);
  let title = "";
  let candidates = [];

  try {
    const { buffer } = await fetchLimited(url, { as: "text", maxBytes: MAX_HTML_BYTES });
    const html = buffer.toString("utf8");
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    title = titleMatch ? decodeHtmlEntities(titleMatch[1]).replace(/\s+/g, " ").trim() : "";
    candidates = collectIconCandidates(html, url);
  } catch {
    // A site can block HTML fetches. The favicon endpoint may still work.
  }

  candidates.push({ url: new URL("/favicon.ico", parsed.origin).toString(), score: -1 });
  for (const candidate of candidates) {
    try {
      const icon = await iconToDataUrl(candidate);
      return {
        url,
        title: title.slice(0, 80),
        icon,
        hostname: parsed.hostname.replace(/^www\./, ""),
      };
    } catch {
      // Try the next icon source.
    }
  }

  const hostname = parsed.hostname.replace(/^www\./, "");
  const name = (preferredName || title || hostname).slice(0, 40);
  return { url, title: title.slice(0, 80), icon: makeLetterIcon(name, hostname), hostname };
}
