import { ArrowIcon } from "./ArrowIcon";
import { GITHUB_URL } from "../constants";
import { UrlInput } from "./UrlInput";
import { focusAuditInput } from "../lib/focusAuditInput";
import type { AuditState } from "../hooks/useAudit";

function statusText(state: AuditState): string {
  switch (state.status) {
    case "connecting":
      return state.waking
        ? "Server is waking up… the first request can take up to a minute."
        : "Connecting…";
    case "auditing":
      return "Running Lighthouse audit… usually 20 to 40 seconds.";
    case "error":
      return state.message;
    case "success":
      return `Score ${state.result.score}/100, ${state.result.issues.length} issues found. (Full results UI comes in F2.)`;
    default:
      return "";
  }
}

type HeroProps = { onAudit: (url: string) => void; state: AuditState };

export function Hero({ onAudit, state }: HeroProps) {
  const busy = state.status === "connecting" || state.status === "auditing";
  const text = statusText(state);

  return (
    <section className="hero-inner">
      <h1>
        <span className="ln"><span className="ln-i">Slow Sites</span></span>
        <span className="ln"><span className="ln-i">Diagnosed</span></span>
      </h1>

      <p className="sub">
        Paste any URL. PerfPilot runs a Lighthouse audit,<br />
        explains what's slowing the page down,<br />
        and ranks the fixes by impact.
      </p>

      <UrlInput onSubmit={onAudit} busy={busy} />
      <p
        className={state.status === "error" ? "audit-note is-error" : "audit-note"}
        role="status"
        aria-live="polite"
      >
        {text}
      </p>

      <div className="ctas">
        <a className="btn btn-lg btn-primary" href="#audit" onClick={focusAuditInput}>
          Run an Audit<ArrowIcon />
        </a>
        <a className="btn btn-lg btn-ghost" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          View on GitHub<ArrowIcon />
        </a>
      </div>
    </section>
  );
}