import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const DATA_DIR = path.join(CODEX_HOME, "quicknav");
const DATA_FILE = path.join(DATA_DIR, "shortcuts.json");

let queue = Promise.resolve();

async function readUnlocked() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    const shortcuts = Array.isArray(parsed?.shortcuts) ? parsed.shortcuts : [];
    return {
      version: 1,
      shortcuts: shortcuts.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.url === "string" &&
          typeof item.name === "string",
      ),
    };
  } catch (error) {
    if (error?.code === "ENOENT") return { version: 1, shortcuts: [] };
    throw error;
  }
}

async function writeUnlocked(data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

/** Serialize read-modify-write operations so concurrent UI clicks cannot clobber data. */
export function withStore(operation) {
  const run = queue.then(async () => {
    const data = await readUnlocked();
    const result = await operation(data);
    if (result?.changed) await writeUnlocked(data);
    return result?.value;
  });
  queue = run.catch(() => {});
  return run;
}

export function newShortcutId() {
  return crypto.randomUUID();
}

export { DATA_FILE };
