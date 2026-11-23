import { Download } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useUi } from "../../store/useUi";
import { Card } from "../common/Card";
import { FindingsTable } from "../findings/FindingsTable";
import { findingsToCsv } from "../../lib/export";
import { downloadText } from "../../lib/helpers";
import type { FindingStatus } from "../../types";

type Filter = "OPEN" | "SUPPRESSED" | "RESOLVED" | "ALL";

const LABELS: Record<Filter, string> = {
  OPEN: "Open",
  SUPPRESSED: "Waived",
  RESOLVED: "Resolved",
  ALL: "All",
};

export function FindingsView() {
  const findings = useStore((s) => s.findings);
  const filter = useStore((s) => s.filter);
  const setFilter = useStore((s) => s.setFilter);
  const query = useStore((s) => s.query);
  const setQuery = useStore((s) => s.setQuery);
  const setLastAction = useStore((s) => s.setLastAction);
  const openFinding = useUi((s) => s.openFinding);

  const open = findings.filter((f) => f.status === "OPEN");
  const waived = findings.filter((f) => f.status === "SUPPRESSED");
  const resolved = findings.filter((f) => f.status === "RESOLVED");
  const counts: Record<Filter, number> = {
    OPEN: open.length,
    SUPPRESSED: waived.length,
    RESOLVED: resolved.length,
    ALL: findings.length,
  };

  const statusFilter = (status: FindingStatus) => status === filter || filter === "ALL";
  const matches = (f: { title: string; resource_arn: string; rule_id: string }) =>
    !query || `${f.title} ${f.resource_arn} ${f.rule_id}`.toLowerCase().includes(query);

  const shown = findings.filter((f) => statusFilter(f.status) && matches(f));

  function exportCsv() {
    downloadText(`findings.csv`, findingsToCsv(shown), "text/csv");
    setLastAction(`Exported ${shown.length} findings as CSV.`);
  }

  return (
    <Card className="tablecard">
      <div className="thead">
        <h2>{query ? `Results for “${query}”` : `${LABELS[filter]} findings`}</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div className="seg" role="group" aria-label="Filter by status">
            {(Object.keys(LABELS) as Filter[]).map((k) => (
              <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>
                {LABELS[k]}
                <small>{counts[k]}</small>
              </button>
            ))}
          </div>
          <button className="btn sm" onClick={exportCsv} aria-label="Export these findings as CSV">
            <Download size={15} /> CSV
          </button>
        </div>
      </div>
      <FindingsTable
        findings={shown}
        showStatus
        onRowClick={openFinding}
        emptyText="No findings match. Try another filter or search."
        sortable
      />
      {query && (
        <div style={{ padding: "0 22px 16px" }}>
          <button className="btn sm" onClick={() => setQuery("")}>
            Clear search “{query}”
          </button>
        </div>
      )}
    </Card>
  );
}
