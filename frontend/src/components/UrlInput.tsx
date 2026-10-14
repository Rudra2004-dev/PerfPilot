import { useState } from "react";
import type { FormEvent } from "react";
import { normalizeUrl } from "../lib/normalizeUrl";


type UrlInputProps = { onSubmit: (url: string) => void };

export function UrlInput({ onSubmit }: UrlInputProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!value.trim()) {
      setStatus("Enter a URL first.");
      return;
    }
    const url = normalizeUrl(value);
    if (!url) {
      setStatus("Please enter a valid URL.");
      return;
    }
    setStatus(`URL ready: ${new URL(url).hostname}`);
    onSubmit(url);
  }

  return (
    <form className="url-input" id="audit" role="search" noValidate onSubmit={handleSubmit}>
      <button className="url-mode" type="button" aria-label="Change URL input mode">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10.6 13.4a4.2 4.2 0 0 0 5.94 0l2.1-2.1a4.2 4.2 0 0 0-5.94-5.94l-1.2 1.2M13.4 10.6a4.2 4.2 0 0 0-5.94 0l-2.1 2.1a4.2 4.2 0 0 0 5.94 5.94l1.2-1.2"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
          />
          <path d="m8.7 15.3 6.6-6.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <svg className="chevron" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="url-field">
        {value.length === 0 && (
          <div className="url-placeholder" aria-hidden="true">
            <span>Paste a URL to audit, e.g. yoursite.com</span>
          </div>
        )}
        <input
          value={value}
          id="audit-url"
          onChange={(e) => setValue(e.target.value)}
          type="url" inputMode="url" autoComplete="url" aria-label="Website URL"
        />
      </div>

      <button className="url-submit" type="submit" aria-label="Run audit">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <span className="url-status" role="status" aria-live="polite">{status}</span>
    </form>
  );
}