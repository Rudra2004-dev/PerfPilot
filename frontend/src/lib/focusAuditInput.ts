import type { MouseEvent } from "react";

export function focusAuditInput(e: MouseEvent) {
  e.preventDefault(); // stop the browser's jump-to-#audit
  document.getElementById("audit-url")?.focus({ preventScroll: true });
}