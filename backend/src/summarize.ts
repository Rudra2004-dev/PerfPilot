type Rating = "good" | "needs-improvement" | "poor";

export interface Metric {
  value: number;
  display: string;
  rating: Rating;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  displayValue?: string;
  score: number | null;
  savingsMs: number;
  savingsBytes: number;
  items: Record<string, string | number>[];
}

export interface Summary {
  url: string;
  score: number;
  metrics: Record<string, Metric>;
  issues: Issue[];
  diagnostics: Diagnostics;
}

// Minimal shape of the Lighthouse result that we actually read
interface Lhr {
  finalDisplayedUrl?: string;
  finalUrl?: string;
  categories: { performance: { score: number | null; auditRefs: any[] } };
  audits: Record<string, any>;
}

export interface Diagnostics {
  lcpElement?: { selector: string; snippet: string; label: string };
  lcpPhases: { phase: string; ms: number }[];
  heavyScripts: { url: string; scriptingMs: number }[];
  thirdParties: { name: string; mainThreadMs: number; kb: number }[];
}

const METRICS = [
  { key: "fcp", id: "first-contentful-paint", good: 1800, poor: 3000 },
  { key: "lcp", id: "largest-contentful-paint", good: 2500, poor: 4000 },
  { key: "tbt", id: "total-blocking-time", good: 200, poor: 600 },
  { key: "cls", id: "cumulative-layout-shift", good: 0.1, poor: 0.25 },
  { key: "speedIndex", id: "speed-index", good: 3400, poor: 5800 },
];

function rate(value: number, good: number, poor: number): Rating {
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

// Remove markdown links: "[Learn more](https://...)" -> "Learn more"
function cleanText(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").trim();
}

// Keep only short primitive fields from a details row, so the summary stays small
function trimItem(item: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(item)) {
    if (Object.keys(out).length >= 6) break;
    if (typeof value === "number") out[key] = Math.round(value * 100) / 100;
    else if (typeof value === "string") out[key] = value.slice(0, 200);
  }
  return out;
}

function estimateSavingsMs(audit: any): number {
  if (typeof audit.details?.overallSavingsMs === "number") {
    return audit.details.overallSavingsMs;
  }
  const ms = audit.metricSavings ?? {};
  return Math.max(0, ms.LCP ?? 0, ms.FCP ?? 0);
}

// Detail rows, minus the wrapper entries Lighthouse mixes into "list" details
function cleanItems(audit: any): Record<string, unknown>[] {
  const skip = ["table", "node", "list", "debugdata"];
  return (audit.details?.items ?? []).filter(
    (i: any) => i && !skip.includes(i.type)
  );
}


function extractDiagnostics(audits: Record<string, any>): Diagnostics {
  const d: Diagnostics = { lcpPhases: [], heavyScripts: [], thirdParties: [] };

  const lcpItems: any[] = audits["lcp-breakdown-insight"]?.details?.items ?? [];
  const node = lcpItems.find((i) => i?.type === "node");
  if (node) {
    d.lcpElement = {
      selector: String(node.selector ?? "").slice(0, 200),
      snippet: String(node.snippet ?? "").slice(0, 300),
      label: String(node.nodeLabel ?? "").slice(0, 120),
    };
  }
  const table = lcpItems.find((i) => i?.type === "table");
  d.lcpPhases = (table?.items ?? [])
    .map((r: any) => ({
      phase: String(r.label ?? r.subpart ?? ""),
      ms: Math.round(Number(r.duration ?? 0)),
    }))
    .filter((p: { phase: string }) => p.phase);

  d.heavyScripts = (audits["bootup-time"]?.details?.items ?? [])
    .map((i: any) => ({
      url: String(i.url ?? "").slice(0, 200),
      scriptingMs: Math.round(Number(i.scripting ?? 0)),
    }))
    .sort((a: any, b: any) => b.scriptingMs - a.scriptingMs)
    .slice(0, 3);

    d.thirdParties = (audits["third-parties-insight"]?.details?.items ?? [])
    .map((i: any) => ({
      name: typeof i.entity === "string" ? i.entity : String(i.entity?.text ?? "unknown"),
      mainThreadMs: Math.round(Number(i.mainThreadTime ?? 0)),
      kb: Math.round(Number(i.transferSize ?? 0) / 1024),
    }))
    .filter((t: { mainThreadMs: number }) => t.mainThreadMs > 0)
    .sort((a: any, b: any) => b.mainThreadMs - a.mainThreadMs)
    .slice(0, 5);

  return d;
}

export function summarize(lhr: Lhr, maxIssues = 8): Summary {
  const metrics: Record<string, Metric> = {};
  for (const m of METRICS) {
    const audit = lhr.audits[m.id];
    if (!audit || typeof audit.numericValue !== "number") continue;
    metrics[m.key] = {
      value: Math.round(audit.numericValue * 100) / 100,
      display: audit.displayValue ?? "",
      rating: rate(audit.numericValue, m.good, m.poor),
    };
  }

  const issues: (Issue & { weight: number })[] = [];
  for (const ref of lhr.categories.performance.auditRefs) {
    if (ref.group === "metrics") continue; // metrics are handled above
    const audit = lhr.audits[ref.id];
    if (!audit) continue;

    const mode = audit.scoreDisplayMode;
    if (mode === "notApplicable" || mode === "manual" || mode === "error") continue;

    const savingsMs = estimateSavingsMs(audit);
    const savingsBytes = Math.round(audit.details?.overallSavingsBytes ?? 0);
    const failing = audit.score !== null && audit.score < 0.9;
    const meaningful = savingsMs >= 100 || savingsBytes >= 10_000;
    if (!failing || !meaningful) continue;

    issues.push({
      id: audit.id,
      title: audit.title,
      description: cleanText(audit.description ?? ""),
      displayValue: audit.displayValue,
      score: audit.score,
      savingsMs: Math.round(savingsMs),
      savingsBytes,
      items: cleanItems(audit).slice(0, 3).map(trimItem),
      weight: ref.weight ?? 0,
    });
  }

  // Deterministic ranking: time savings, then byte savings, then score impact
  issues.sort(
    (a, b) =>
      b.savingsMs - a.savingsMs ||
      b.savingsBytes - a.savingsBytes ||
      (1 - (b.score ?? 1)) * b.weight - (1 - (a.score ?? 1)) * a.weight
  );

  return {
    url: lhr.finalDisplayedUrl ?? lhr.finalUrl ?? "",
    score: Math.round((lhr.categories.performance.score ?? 0) * 100),
    metrics,
    issues: issues.slice(0, maxIssues).map(({ weight, ...issue }) => issue),
    diagnostics: extractDiagnostics(lhr.audits),
  };
}