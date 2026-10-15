import { useEffect, useRef } from "react";
import type { AuditResult, Issue } from "../lib/api";

const METRIC_LABELS: Record<string, string> = {
  fcp: "First Contentful Paint",
  lcp: "Largest Contentful Paint",
  tbt: "Total Blocking Time",
  cls: "Cumulative Layout Shift",
  speedIndex: "Speed Index",
};

function tone(score: number): "good" | "ok" | "poor" {
  if (score >= 90) return "good";
  if (score >= 50) return "ok";
  return "poor";
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className={`ring ring-${tone(score)}`} role="img" aria-label={`Performance score ${score} out of 100`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r={r} />
        <circle
          className="ring-value"
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <span className="ring-num">{score}</span>
    </div>
  );
}

function IssueCard({ issue, rank }: { issue: Issue; rank: number }) {
  const hasCode = Boolean(issue.code?.trim());
  return (
    <li className="issue">
      <div className="issue-head">
        <span className="issue-rank">{rank}</span>
        <h3>{issue.title}</h3>
        {issue.savingsMs > 0 && (
          <span className="chip chip-save">~{(issue.savingsMs / 1000).toFixed(1)} s</span>
        )}
        <span className={issue.source === "ai" ? "chip chip-ai" : "chip"}>
          {issue.source === "ai" ? "AI" : "Template"}
        </span>
      </div>
      <p className="issue-label">Why it matters</p>
      <p className="issue-text">{issue.why}</p>
      <p className="issue-label">How to fix</p>
      <p className="issue-text">{issue.fix}</p>
      {hasCode && (
        <pre className="issue-code">
          <code>{issue.code}</code>
        </pre>
      )}
    </li>
  );
}

type ResultsProps = { result: AuditResult; onClose: () => void };

export function Results({ result, onClose }: ResultsProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const metrics = Object.entries(result.metrics);

  return (
    <div className="results" role="dialog" aria-modal="true" aria-label="Audit results">
      <button ref={closeRef} className="results-close" onClick={onClose}>
        New audit
      </button>

      <div className="results-inner">
        <section className="score-card">
          <ScoreRing score={result.score} />
          <div className="score-info">
            <p className="score-kicker">Performance score</p>
            <h2>{hostname(result.url)}</h2>
            <p className="score-sub">
              {result.issues.length === 0
                ? "No significant issues found."
                : `${result.issues.length} issue${result.issues.length === 1 ? "" : "s"} found, ranked by impact.`}
            </p>
          </div>
        </section>

        <section className="metrics" aria-label="Core metrics">
          {metrics.map(([key, m]) => (
            <div key={key} className="metric">
              <span className="metric-label">{METRIC_LABELS[key] ?? key}</span>
              <span className={`metric-value rate-${m.rating}`}>{m.display || m.value}</span>
            </div>
          ))}
        </section>

        {result.issues.length > 0 && (
          <section>
            <h2 className="section-title">What to fix first</h2>
            {result.aiUsed && (
              <p className="ai-note">Explanations and code snippets are AI-generated. Review before applying.</p>
            )}
            <ol className="issues">
              {result.issues.map((issue, i) => (
                <IssueCard key={issue.id} issue={issue} rank={i + 1} />
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}