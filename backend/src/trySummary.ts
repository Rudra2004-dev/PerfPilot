import { readFileSync } from "node:fs";
import { summarize } from "./summarize.js";

const file = process.argv[2];
if (!file) throw new Error("Usage: npx tsx src/trySummary.ts fixtures/<site>.json");

const raw = readFileSync(file, "utf8");
const summary = summarize(JSON.parse(raw));

console.log(JSON.stringify(summary, null, 2));
console.log(`\nShrunk ${raw.length} chars -> ${JSON.stringify(summary).length} chars`);