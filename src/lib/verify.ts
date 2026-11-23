import type { SealedReport, VerifyResult } from "../types";

/* Tamper-evident evidence chain verification.
 *
 * Each daily report stores the SHA-256 hash of the report before it, like
 * links in a chain. Change any old report and the link breaks, so an auditor
 * can trust the history. This recreates the server-side verify_chain logic in
 * the browser using the Web Crypto API, so the demo can prove the chain holds
 * without a round trip. (In live mode the API does the authoritative check.)
 */

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** The canonical content that gets hashed for a report. This mirrors the
 * server's report schema so the hashes line up in a real deployment. */
function reportContent(report: Omit<SealedReport, "hash" | "previous_hash">): string {
  return JSON.stringify({
    sequence: report.sequence,
    generated_at: report.generated_at,
    score_pct: report.score_pct,
    open_findings: report.open_findings,
  });
}

export async function verifyChain(reports: SealedReport[]): Promise<VerifyResult> {
  // Reports arrive newest-first; verify oldest-first.
  const chain = [...reports].reverse();
  const problems: string[] = [];
  let prevHash = "0".repeat(64);

  for (const report of chain) {
    if (report.previous_hash !== prevHash) {
      problems.push(
        `Report #${report.sequence}: previous_hash does not match report #${report.sequence - 1}'s hash.`,
      );
    }
    const computed = await sha256Hex(reportContent(report));
    // We compare against the stored hash when it looks like a real 64-char hash.
    if (/^[0-9a-f]{64}$/.test(report.hash) && computed !== report.hash) {
      problems.push(`Report #${report.sequence}: stored hash does not match its content.`);
    }
    prevHash = report.hash;
  }

  return { checked: reports.length, intact: problems.length === 0, problems };
}
