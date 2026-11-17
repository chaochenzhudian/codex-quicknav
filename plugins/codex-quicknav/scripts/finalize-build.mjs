import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(ROOT, "dist", "index.html");
const target = path.join(ROOT, "dist", "mcp-app.html");
await fs.copyFile(source, target);
console.log(`Built ${target}`);
