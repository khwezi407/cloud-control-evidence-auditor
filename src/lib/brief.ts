import type { AuditSummary, Finding, VerifyResult } from "../types";
import { SHORT_NAMES } from "../data/rules";

/** The plain-English, one-paragraph auditor's brief. Plain text is returned so
 * it can be copied into an email or status update; the Overview renders the
 * HTML-marked-up version via briefHtml(). */
export function briefText(summary: AuditSummary, findings: Finding[], verify: VerifyResult | null): string {
  const p = summary.posture;
  const open = findings.filter((f) => f.status === "OPEN");
  const waived = findings.filter((f) => f.status === "SUPPRESSED");
  const delta = p.previous_score_pct == null ? null : +(p.score_pct - p.previous_score_pct).toFixed(1);

  const byRule: Record<string, number> = {};
  open.forEach((f) => (byRule[f.rule_id] = (byRule[f.rule_id] || 0) + 1));
  const parts = Object.entries(byRule)
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => `${n} on ${SHORT_NAMES[id]}`);
  const list = parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts[0];
  const high = open.filter((f) => f.severity === "HIGH" || f.severity === "CRITICAL").length;

  const sentences = [
    `Posture is ${p.score_pct}%${delta == null ? "" : `, ${delta >= 0 ? "up" : "down"} ${Math.abs(delta)} points since the last scan`}.`,
    open.length ? `${open.length} findings are open (${high} high or critical): ${list}.` : "No findings are open.",
    waived.length ? `${waived.length} accepted risk${waived.length > 1 ? "s are" : " is"} waived until expiry.` : "",
    `The evidence chain holds ${summary.reports} sealed reports${
      verify ? (verify.intact ? ", verified intact just now" : ", and verification FAILED") : ""
    }.`,
  ];
  return sentences.filter(Boolean).join(" ");
}

/** The same brief, but with the numbers bolded for the on-screen display. */
export function briefHtml(summary: AuditSummary, findings: Finding[], verify: VerifyResult | null): string {
  let html = briefText(summary, findings, verify);
  // bold the percentages and counts so the eye lands on the numbers
  html = html.replace(/(\d+(?:\.\d+)?%|\d+ findings|\d+ accepted risk[s]?)/g, "<b>$1</b>");
  return html;
}
