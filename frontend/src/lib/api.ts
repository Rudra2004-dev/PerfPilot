export interface Metric {
  value: number;
  display: string;
  rating: "good" | "needs-improvement" | "poor";
}

export interface Issue {
  id: string;
  title: string;
  savingsMs: number;
  why: string;
  fix: string;
  code?: string;
  source: "ai" | "template";
}

export interface AuditResult {
  url: string;
  score: number;
  metrics: Record<string, Metric>;
  issues: Issue[];
  aiUsed: boolean;
}

const API = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {}

// Cheap request that wakes a sleeping free-tier server
export async function ping(signal: AbortSignal): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API}/health`, { signal });
  } catch {
    if (signal.aborted) throw signal.reason;
    throw new ApiError("Could not reach the server. Please try again in a moment.");
  }
  if (!res.ok) throw new ApiError("The server is not responding. Please try again.");
}

export async function runAudit(url: string, signal: AbortSignal): Promise<AuditResult> {
  let res: Response;
  try {
    res = await fetch(`${API}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal,
    });
  } catch {
    if (signal.aborted) throw signal.reason;
    throw new ApiError("Lost connection to the server. Please try again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? `Request failed (${res.status}).`);
  }
  return (await res.json()) as AuditResult;
}