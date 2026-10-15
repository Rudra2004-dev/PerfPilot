import { validateTarget } from "./security/validateUrl.js";

const cases = [
  "example.com",
  "https://www.bbc.com",
  "http://localhost",
  "http://127.0.0.1",
  "http://169.254.169.254/latest/meta-data",
  "http://192.168.1.1",
  "http://10.0.0.5",
  "http://[::1]",
  "http://[::ffff:127.0.0.1]",
  "http://2130706433", // 127.0.0.1 written as one number
  "file:///etc/passwd",
  "https://user:pass@example.com",
  "https://example.com:8080",
  "http://intranet",
  "not a url",
];

for (const c of cases) {
  try {
    console.log("ALLOWED ", c, "->", await validateTarget(c));
  } catch (e) {
    console.log("BLOCKED ", c, "->", (e as Error).message);
  }
}