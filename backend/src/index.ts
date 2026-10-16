import "dotenv/config";
import express from "express";
import cors from "cors";
import { runLighthouse } from "./lighthouse/runLighthouse.js";
import { summarize } from "./summarize.js";
import { explain } from "./explain.js";
import { validateTarget, UrlError } from "./security/validateUrl.js";
import rateLimit from "express-rate-limit";

const app = express();
// Cloud Run puts exactly one proxy in front of the app; this makes req.ip the real client
app.set("trust proxy", 1);

const auditLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 6, // audits per IP per hour
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Rate limit reached: 6 audits per hour. Please try again later." },
});
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

// Used by the frontend's "server is waking up" check and by Docker later
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Lighthouse + Chrome is heavy: allow one audit at a time
let busy = false;
const AUDIT_TIMEOUT_MS = 120_000;

class TimeoutError extends Error {}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError("Audit timed out")), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

app.post("/audit", auditLimiter, async (req, res) => {
  let url: string;
  try {
    url = await validateTarget(req.body?.url);
  } catch (err) {
    if (err instanceof UrlError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }

  if (busy) {
    res.status(429).json({ error: "Another audit is running. Please try again in a minute." });
    return;
  }
  busy = true;
  // busy is released when Chrome actually finishes, even if we already timed out
  const work = runLighthouse(url).finally(() => {
    busy = false;
  });

  try {
    const lhr = await withTimeout(work, AUDIT_TIMEOUT_MS);

    if (lhr.runtimeError) {
      res.status(422).json({ error: "Could not load that page. Is the site up and public?" });
      return;
    }

    const summary = summarize(lhr as any);
    const explained = await explain(summary);
    if (explained.error) console.warn("AI fallback used:", explained.error);

    res.json({
      url: summary.url,
      score: summary.score,
      metrics: summary.metrics,
      issues: explained.issues,
      aiUsed: explained.aiUsed,
    });
  } catch (err) {
    console.error("Audit failed:", err);
    if (err instanceof TimeoutError) {
      res.status(504).json({ error: "The audit took too long. Try a lighter page." });
    } else {
      res.status(502).json({ error: "The audit failed. Please try again." });
    }
  }
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`PerfPilot API listening on http://localhost:${port}`));