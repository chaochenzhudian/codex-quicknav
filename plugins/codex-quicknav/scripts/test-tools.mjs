import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SERVER_FILE = process.env.QUICKNAV_SERVER_FILE ?? "server/index.mjs";
const TEST_HOME = await fs.mkdtemp(path.join(os.tmpdir(), "quicknav-test-"));
const client = new Client({ name: "quicknav-tools", version: "1.0.0" });
await client.connect(
  new StdioClientTransport({
    command: "node",
    args: [path.join(ROOT, SERVER_FILE)],
    cwd: ROOT,
    env: { ...process.env, CODEX_HOME: TEST_HOME },
    stderr: "inherit",
  }),
);

const call = async (name, args = {}) => {
  const result = await client.callTool({ name, arguments: args });
  console.log(name, JSON.stringify(result.structuredContent ?? result.content));
  return result;
};

await call("quicknav.shortcuts.list");
const added = await call("quicknav.shortcuts.add", { url: "github.com", name: "GitHub" });
await call("quicknav.shortcuts.list");
const shortcut = added.structuredContent?.shortcut;
if (shortcut?.id) await call("quicknav.shortcuts.remove", { id: shortcut.id });
await call("quicknav.shortcuts.list");
await client.close();
await fs.rm(TEST_HOME, { recursive: true, force: true });
