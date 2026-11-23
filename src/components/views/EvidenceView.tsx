import { Link2 } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../common/Card";
import { short, when } from "../../lib/helpers";

export function EvidenceView() {
  const reports = useStore((s) => s.reports);
  const summary = useStore((s) => s.summary);
  const verify = useStore((s) => s.verify);

  if (!summary) return null;

  return (
    <Card className="tablecard">
      <div className="thead">
        <h2>Sealed reports</h2>
        <span className={`chip ${verify ? (verify.intact ? "good" : "bad") : ""}`}>
          {verify ? (verify.intact ? `Intact · ${verify.checked} verified` : `Broken · ${verify.problems.length} problem(s)`) : "Not verified yet"}
        </span>
      </div>

      <div className="bigchain" aria-label="Evidence chain">
        {(() => {
          const items = [...reports].slice(0, 15).reverse();
          return items.map((r, i) => (
            <span key={r.sequence} style={{ display: "inline-flex", alignItems: "center" }}>
              {i ? <i className="link" /> : null}
              <div className={`blk${i === items.length - 1 ? " head" : ""}`} title={`Report ${r.sequence}: ${r.hash}`}>
                <small>#</small>
                {r.sequence}
              </div>
            </span>
          ));
        })()}
      </div>

      {verify && !verify.intact && (
        <div style={{ padding: "0 22px 16px" }}>
          {verify.problems.map((p, i) => (
            <p key={i} className="mono" style={{ color: "var(--crit)", margin: "4px 0" }}>
              ✕ {p}
            </p>
          ))}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Generated</th>
              <th className="num">Score</th>
              <th className="num">Open</th>
              <th>SHA-256</th>
              <th>Previous hash</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.sequence}>
                <td className="num">{r.sequence}</td>
                <td>{when(r.generated_at)}</td>
                <td className="num">{r.score_pct}%</td>
                <td className="num">{r.open_findings}</td>
                <td className="mono">{short(r.hash)}</td>
                <td className="mono">{short(r.previous_hash)}</td>
                <td>
                  {r.html_url ? (
                    <a href={r.html_url} target="_blank" rel="noopener" style={{ color: "var(--accent-2)" }}>
                      <Link2 size={14} />
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
