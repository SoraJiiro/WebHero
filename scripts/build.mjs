import { access, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await copyFile(
	path.join(root, "node_modules", "fflate", "esm", "browser.js"),
	path.join(root, "public", "js", "fflate.browser.js"),
);
await access(path.join(root, "public", "index.html"));
await access(path.join(root, "public", "js", "game.js"));
await access(path.join(root, "public", "js", "web_hero_chart.mjs"));
await access(path.join(root, "public", "js", "game-renderer.mjs"));
await access(path.join(root, "public", "js", "chart-storage.mjs"));
await access(path.join(root, "public", "js", "utils.js"));
console.log("WebHero static client is ready.");
