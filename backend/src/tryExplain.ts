import { readFileSync } from "node:fs";
import { summarize } from "./summarize.js";
import { explain } from "./explain.js";

const file = process.argv[2];
if (!file) throw new Error("Usage: npx tsx src/tryExplain.ts fixtures/<site>.json");

const summary = summarize(JSON.parse(readFileSync(file, "utf8")));
const result = await explain(summary);

console.log("AI used:", result.aiUsed, result.error ? `(error: ${result.error})` : "");
console.log(JSON.stringify(result.issues, null, 2));