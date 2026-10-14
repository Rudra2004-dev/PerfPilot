import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "./ArrowIcon";
import { GITHUB_URL } from "../constants";
import { focusAuditInput } from "../lib/focusAuditInput";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "What It Checks", href: "#what-it-checks" },
  { label: "Sample Report", href: "#sample-report" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || burgerRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <>
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

        <button
          ref={burgerRef}
          className="burger"
          id="burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen(!open)}
        >
          <span></span>
        </button>
      </header>

      <nav
        ref={menuRef}
        className={open ? "menu open" : "menu"}
        id="menu"
        aria-label="Mobile"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
        <div className="divider"></div>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
        <a className="m-start" href="#audit" onClick={focusAuditInput}>
          Run an Audit<ArrowIcon />
        </a>
      </nav>
    </>
  );
}