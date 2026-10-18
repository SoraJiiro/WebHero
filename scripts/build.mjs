import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await access(path.join(root, "public", "index.html"));
await access(path.join(root, "public", "js", "game.js"));
console.log("WebHero static client is ready.");
