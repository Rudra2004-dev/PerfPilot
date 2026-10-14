import { mkdirSync, writeFileSync } from "node:fs";
import { runLighthouse } from "./lighthouse/runLighthouse.js";

const url = process.argv[2] ?? "https://example.com";
console.log("Auditing", url, "...");

const lhr = await runLighthouse(url);
console.log("Score:", Math.round((lhr.categories.performance.score ?? 0) * 100));
console.log("LCP:", lhr.audits["largest-contentful-paint"].displayValue);

mkdirSync("fixtures", { recursive: true });
const file = `fixtures/${new URL(url).hostname}.json`;
writeFileSync(file, JSON.stringify(lhr));
console.log("Saved", file);