import { ArrowIcon } from "./ArrowIcon";
import { GITHUB_URL } from "../constants";
import { UrlInput } from "./UrlInput";
import { focusAuditInput } from "../lib/focusAuditInput";

export function Hero() {
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
       <UrlInput onSubmit={(url) => console.log("audit:", url)} />
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