import type { AuditSummary, Finding } from "../types";
import { RULES } from "../data/rules";
import { esc, toCsv, whenFull } from "./helpers";

/** Export findings to CSV. */
export function findingsToCsv(findings: Finding[]): string {
  const header = ["Rule", "Rule name", "Finding", "Severity", "Status", "Resource ARN", "First seen", "Last seen", "Resolved", "Remediation"];
  const rows = [header, ...findings.map((f) => [
    f.rule_id,
    RULES[f.rule_id]?.name ?? "",
    f.title,
    f.severity,
    f.status,
    f.resource_arn,
    f.first_seen,
    f.last_seen,
    f.resolved_at ?? "",
    f.remediation,
  ])];
  return toCsv(rows);
}

/** Build a self-contained, printable HTML compliance evidence report.
 * An auditor could open this, verify the chain note, and print or archive it. */
export function complianceReportHtml(summary: AuditSummary, findings: Finding[]): string {
  const open = findings.filter((f) => f.status === "OPEN");
  const waived = findings.filter((f) => f.status === "SUPPRESSED");
  const resolved = findings.filter((f) => f.status === "RESOLVED");
  const p = summary.posture;
  const stamp = whenFull(summary.generated_at);

  const findingRow = (f: Finding) => `<tr>
    <td><b>${esc(f.rule_id)}</b> ${esc(RULES[f.rule_id]?.name ?? "")}</td>
    <td>${esc(f.title)}</td>
    <td>${esc(f.severity)}</td>
    <td>${esc(f.status)}</td>
    <td><code>${esc(f.resource_arn)}</code></td>
    <td>${esc(whenFull(f.first_seen))}</td>
  </tr>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Cybersecurity control evidence — ${esc(summary.account_id)} — ${esc(stamp)}</title>
<style>
  :root{color-scheme:light}
  body{font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#15151c;max-width:880px;margin:32px auto;padding:0 24px}
  h1{font-size:26px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 10px;border-bottom:2px solid #eee;padding-bottom:6px}
  .meta{color:#666;font-size:13px;margin:0 0 24px}
  .kpi{display:flex;gap:32px;margin:18px 0;flex-wrap:wrap}
  .kpi div{flex:1;min-width:140px}
  .kpi b{font-size:30px;display:block}
  table{width:100%;border-collapse:collapse;margin:8px 0}
  th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #e5e5ea;font-size:13px}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#888}
  code{font:12px ui-monospace,monospace;background:#f4f4f8;padding:1px 5px;border-radius:4px;word-break:break-all}
  .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600}
  .OPEN{background:#ffe0e3;color:#c01f33}.SUPPRESSED{background:#fff3d6;color:#9a6a00}
  .RESOLVED{background:#d6f5e6;color:#13844f}.HIGH{background:#fff0d9;color:#9a6a00}
  .MEDIUM{background:#e0efff;color:#1a5fa8}.CRITICAL{background:#ffe0e3;color:#c01f33}
  .seal{float:right;width:84px;text-align:center;border:1.5px solid #444;border-radius:50%;padding:12px 6px;font-size:10px;line-height:1.3;transform:rotate(-6deg);margin:0 0 12px 16px}
  .seal b{display:block;font-size:11px}
  footer{margin-top:32px;padding-top:14px;border-top:2px solid #eee;color:#888;font-size:12px}
  @media print{body{margin:0;max-width:none}}
</style></head>
<body>
  <div class="seal"><b>EVIDENCE</b><br>tamper-evident<br>${esc(summary.reports)} reports</div>
  <h1>Cybersecurity control evidence report</h1>
  <p class="meta">AWS account <b>${esc(summary.account_id)}</b> · region ${esc(summary.region)} · generated ${esc(stamp)} · reference implementation for Joint Standard 2 of 2024</p>

  <h2>Posture summary</h2>
  <div class="kpi">
    <div><b>${p.score_pct}%</b>posture score</div>
    <div><b>${p.resources_checked}</b>resources checked</div>
    <div><b>${open.length}</b>open findings</div>
    <div><b>${resolved.length}</b>resolved</div>
    <div><b>${waived.length}</b>accepted risks</div>
  </div>
  <p>Head report SHA-256: <code>${esc(summary.head_hash)}</code>. The evidence chain holds ${summary.reports} sealed daily reports; each report stores the hash of the one before it, so any later change to an old report breaks the chain.</p>

  <h2>Open findings (${open.length})</h2>
  ${open.length ? `<table><thead><tr><th>Control</th><th>Finding</th><th>Severity</th><th>Status</th><th>Resource</th><th>First seen</th></tr></thead>
  <tbody>${open.map(findingRow).join("")}</tbody></table>` : "<p>No open findings. Every check passed.</p>"}

  ${waived.length ? `<h2>Accepted risks (${waived.length})</h2><table><thead><tr><th>Control</th><th>Finding</th><th>Severity</th><th>Status</th><th>Resource</th><th>First seen</th></tr></thead><tbody>${waived.map(findingRow).join("")}</tbody></table>` : ""}

  ${resolved.length ? `<h2>Resolved findings (${resolved.length})</h2><table><thead><tr><th>Control</th><th>Finding</th><th>Severity</th><th>Status</th><th>Resource</th><th>First seen</th></tr></thead><tbody>${resolved.map(findingRow).join("")}</tbody></table>` : ""}

  <h2>The seven controls</h2>
  <table><thead><tr><th>Rule</th><th>What it catches</th><th>Severity</th><th>Why it matters</th></tr></thead><tbody>
  ${Object.values(RULES).map((r) => `<tr><td><b>${esc(r.id)}</b></td><td>${esc(r.name)}</td><td><span class="badge ${r.severity}">${esc(r.severity)}</span></td><td>${esc(r.why)}</td></tr>`).join("")}
  </tbody></table>

  <footer>Reference implementation · AWS Lambda, DynamoDB, S3, Cognito · generated by the Evidence Auditor Console · built by Khwezi Maphumulo</footer>
</body></html>`;
}
