import { ArrowIcon } from "./ArrowIcon";
import { focusAuditInput } from "../lib/focusAuditInput";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "What It Checks", href: "#what-it-checks" },
  { label: "Sample Report", href: "#sample-report" },
];

const GITHUB_URL = "https://github.com/YOUR-USERNAME/perfpilot";

export function Navbar() {
  return (
    <header className="nav">
      <a className="logo" href="#">PerfPilot</a>

      <nav className="nav-links" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
      </nav>

      <div className="nav-actions">
        <a className="btn btn-login" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a className="btn btn-nav-start" href="#audit" onClick={focusAuditInput}>
          Run an Audit<ArrowIcon />
        </a>
      </div>

      <button className="burger" id="burger" aria-label="Open menu"
        aria-expanded="false" aria-controls="menu">
        <span></span>
      </button>
    </header>
  );
}