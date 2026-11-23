import type { SealedReport } from "../../types";
import { when } from "../../lib/helpers";

function chainHtml(list: SealedReport[], n: number) {
  const items = [...list].slice(0, n).reverse();
  return items.map((r, i) => (
    <span key={r.sequence} style={{ display: "inline-flex", alignItems: "center" }}>
      {i ? <i className="link" /> : null}
      <div className={`blk${i === items.length - 1 ? " head" : ""}`} title={`Report ${r.sequence}`}>
        <small>#</small>
        {r.sequence}
      </div>
    </span>
  ));
}

interface Props {
  reports: SealedReport[];
  verify: { intact: boolean; checked: number; problems: string[] } | null;
  headHash: string;
  limit?: number;
}

/** The visual hash-chain of sealed daily reports. The head block glows violet;
 * if verification found a break, it glows red instead. */
export function EvidenceChain({ reports, verify, headHash, limit = 6 }: Props) {
  const broken = !!(verify && !verify.intact);
  return (
    <>
      <div className={`chain${broken ? " broken" : ""}`} aria-label="Evidence chain">
        {chainHtml(reports, limit)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <b style={{ fontWeight: 600 }}>{reports.length} sealed reports</b>
        <span className={`chip ${verify ? (verify.intact ? "good" : "bad") : ""}`}>
          {verify ? (verify.intact ? `Intact · ${verify.checked} verified` : `Broken · ${verify.problems.length} problem(s)`) : "Not verified yet"}
        </span>
      </div>
      <p className="mono" style={{ margin: "8px 0 0" }}>
        head {headHash.slice(0, 8)}…{headHash.slice(-6)}
      </p>
      <ul className="recent">
        {reports.slice(0, 3).map((r) => (
          <li key={r.sequence}>
            <b>#{r.sequence}</b>
            <span>{when(r.generated_at)}</span>
            <b>{r.score_pct}%</b>
          </li>
        ))}
      </ul>
    </>
  );
}
