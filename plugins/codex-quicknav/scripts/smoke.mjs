import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SERVER_FILE = process.env.QUICKNAV_SERVER_FILE ?? "server/index.mjs";
const client = new Client({ name: "quicknav-smoke", version: "1.0.0" });
await client.connect(
  new StdioClientTransport({
    command: "node",
    args: [path.join(ROOT, SERVER_FILE)],
    cwd: ROOT,
    stderr: "inherit",
  }),
);

const tools = await client.listTools();
console.log(JSON.stringify(tools, null, 2));
const resource = await client.readResource({ uri: "ui://codex-quicknav/index.html" });
console.log(JSON.stringify({ ...resource, contents: resource.contents.map((c) => ({ ...c, text: c.text?.slice(0, 80) })) }, null, 2));
await client.close();
