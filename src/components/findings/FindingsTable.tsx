import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { SEVERITY_RANK } from "../../data/rules";
import type { Finding } from "../../types";
import { day, findingKey, relative, titleCase } from "../../lib/helpers";

type SortKey = "rule" | "finding" | "severity" | "status" | "first_seen";
type Dir = "asc" | "desc";

interface Props {
  findings: Finding[];
  showStatus: boolean;
  onRowClick: (key: string) => void;
  emptyText: string;
  maxRows?: number;
  sortable?: boolean;
}

export function FindingsTable({ findings, showStatus, onRowClick, emptyText, maxRows, sortable = false }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [dir, setDir] = useState<Dir>("asc");

  function toggleSort(key: SortKey) {
    if (!sortable) return;
    if (key === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir("asc");
    }
  }

  let sorted = [...findings];
  if (sortable) {
    const mul = dir === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "rule":
          return a.rule_id.localeCompare(b.rule_id) * mul;
        case "finding":
          return a.title.localeCompare(b.title) * mul;
        case "severity":
          return (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) * mul;
        case "status":
          return a.status.localeCompare(b.status) * mul;
        case "first_seen":
          return (new Date(a.first_seen).getTime() - new Date(b.first_seen).getTime()) * mul;
      }
    });
  } else {
    // default: open first, then by severity
    sorted.sort(
      (a, b) => (a.status !== "OPEN" ? 1 : 0) - (b.status !== "OPEN" ? 1 : 0) || SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
    );
  }

  const rows = maxRows ? sorted.slice(0, maxRows) : sorted;
  const arrow = (key: SortKey) =>
    sortable && sortKey === key ? dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} /> : null;
  const th = (key: SortKey, label: string, cls = "") => (
    <th className={`${cls} ${sortable ? "sortable" : ""}`} onClick={() => toggleSort(key)}>
      <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
        {label}
        {arrow(key)}
      </span>
    </th>
  );

  return (
    <table className="stack">
      <thead>
        <tr>
          {th("rule", "Rule")}
          {th("finding", "Finding")}
          {showStatus && th("status", "Status")}
          {th("severity", "Severity")}
          {th("first_seen", "First seen", "num")}
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={showStatus ? 6 : 5} className="empty">
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((f) => (
            <tr
              key={findingKey(f)}
              tabIndex={0}
              data-l="Resource"
              onClick={() => onRowClick(findingKey(f))}
              onKeyDown={(e) => e.key === "Enter" && onRowClick(findingKey(f))}
            >
              <td data-l="Rule">
                <span className="rid">{f.rule_id}</span>
              </td>
              <td className="fname" data-l="Finding">
                <b>{f.title}</b>
                <span title={f.resource_arn}>{f.resource_arn}</span>
              </td>
              {showStatus && (
                <td data-l="Status">
                  <span className={`st ${f.status}`}>{titleCase(f.status) === "Suppressed" ? "Waived" : titleCase(f.status)}</span>
                </td>
              )}
              <td data-l="Severity">
                <span className={`sev ${f.severity}`}>{titleCase(f.severity)}</span>
              </td>
              <td className="num" data-l="First seen" title={relative(f.first_seen)}>
                {day(f.first_seen)}
              </td>
              <td className="chev" aria-hidden="true" data-l="">
                ›
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
