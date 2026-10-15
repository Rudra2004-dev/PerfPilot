import type { MouseEvent } from "react";

export function focusAuditInput(e: MouseEvent) {
  e.preventDefault(); // stop the browser's jump-to-#audit
  const input = document.getElementById("audit-url") as HTMLInputElement | null;
  if (!input) return;

  if (input.value.trim()) {
    input.form?.requestSubmit(); // same as pressing the arrow or Enter
  } else {
    input.focus({ preventScroll: true });
  }
}