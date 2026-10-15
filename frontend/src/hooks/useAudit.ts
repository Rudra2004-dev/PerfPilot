import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, ping, runAudit } from "../lib/api";
import type { AuditResult } from "../lib/api";

export type AuditState =
  | { status: "idle" }
  | { status: "connecting"; waking: boolean }
  | { status: "auditing" }
  | { status: "success"; result: AuditResult }
  | { status: "error"; message: string };

export function useAudit() {
  const [state, setState] = useState<AuditState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const start = useCallback(async (url: string) => {
    controller.current?.abort();
    const c = new AbortController();
    controller.current = c;
    const limit = (ms: number) => AbortSignal.any([c.signal, AbortSignal.timeout(ms)]);

    setState({ status: "connecting", waking: false });
    const wakingTimer = setTimeout(() => {
      setState((s) => (s.status === "connecting" ? { status: "connecting", waking: true } : s));
    }, 3000);

    try {
      await ping(limit(90_000)); // cold starts can take a while
      clearTimeout(wakingTimer);
      setState({ status: "auditing" });
      const result = await runAudit(url, limit(150_000));
      setState({ status: "success", result });
    } catch (e) {
      if (c.signal.aborted) return; // replaced by a newer request or unmounted
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof DOMException && e.name === "TimeoutError"
            ? "The server took too long to respond. Please try again."
            : "Something went wrong. Please try again.";
      setState({ status: "error", message });
    } finally {
      clearTimeout(wakingTimer);
    }
  }, []);

  return { state, start };
}