import { useNavigate } from "react-router-dom";
import { Copy, Download, FileText, AlertTriangle, ShieldCheck, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../../store/useStore";
import { useUi } from "../../store/useUi";
import { Card } from "../common/Card";
import { PostureConstellation } from "../overview/PostureConstellation";
import { TrendChart } from "../overview/TrendChart";
import { EvidenceChain } from "../overview/EvidenceChain";
import { ScanTimeline } from "../overview/ScanTimeline";
import { FindingsTable } from "../findings/FindingsTable";
import { CisoView } from "./CisoView";
import { briefHtml, briefText } from "../../lib/brief";
import { complianceReportHtml, findingsToCsv } from "../../lib/export";
import { downloadHtml, downloadText, mttr, titleCase } from "../../lib/helpers";
import type { Severity } from "../../types";

const SEV_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const SEV_COLORS: Record<Severity, string> = {
  CRITICAL: "var(--crit)",
  HIGH:     "var(--high)",
  MEDIUM:   "var(--med)",
  LOW:      "var(--low)",
};

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] as const } }),
};

export function OverviewView() {
  const navigate  = useNavigate();
  const summary   = useStore((s) => s.summary);
  const findings  = useStore((s) => s.findings);
  const reports   = useStore((s) => s.reports);
  const verify    = useStore((s) => s.verify);
  const live      = useStore((s) => s.live);
  const role      = useStore((s) => s.role);
  const setLastAction = useStore((s) => s.setLastAction);
  const openFinding   = useUi((s) => s.openFinding);

  if (!summary) return null;

  // CISO mode shows the executive view instead
  if (role === "ciso") return <CisoView />;

  const open     = findings.filter((f) => f.status === "OPEN");
  const waived   = findings.filter((f) => f.status === "SUPPRESSED");
  const resolved = findings.filter((f) => f.status === "RESOLVED");
  const p        = summary.posture;
  const total    = open.length || 1;
  const good     = p.score_pct >= 80;
  const ok       = p.score_pct >= 60;
  const delta    = p.previous_score_pct == null ? null : +(p.score_pct - p.previous_score_pct).toFixed(1);
  const high     = open.filter((f) => f.severity === "HIGH" || f.severity === "CRITICAL").length;

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(briefText(summary!, findings, verify));
      setLastAction("Brief copied. Paste it into an email or a status update.");
    } catch {
      setLastAction("Copy isn't allowed here. Select the brief and copy it.");
    }
  }

  function exportCsv() {
    downloadText(`findings-${summary?.account_id}.csv`, findingsToCsv(findings), "text/csv");
    setLastAction("Findings exported as CSV.");
  }

  function exportReport() {
    if (!summary) return;
    downloadHtml(`compliance-report-${summary.account_id}.html`, complianceReportHtml(summary, findings));
    setLastAction("Compliance report downloaded.");
  }

  return (
    <>
      {/* ── Hero compliance context banner ── */}
      <motion.div
        custom={0} variants={rise} initial="hidden" animate="show"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1,
          borderRadius: 20,
          border: "1px solid var(--line)",
          overflow: "hidden",
          marginBottom: 20,
          background: "var(--glass)",
        }}
      >
        {/* Score cell */}
        <div style={{
          padding: "22px 24px",
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          background: good
            ? "linear-gradient(135deg, rgb(52 208 140 / 0.08), transparent)"
            : ok
            ? "linear-gradient(135deg, rgb(245 166 35 / 0.08), transparent)"
            : "linear-gradient(135deg, rgb(249 79 94 / 0.08), transparent)",
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Posture score
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <span style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 52,
              lineHeight: 1,
              color: good ? "var(--ok)" : ok ? "var(--high)" : "var(--crit)",
            }}>
              {p.score_pct}
            </span>
            <span style={{ fontSize: 20, color: "var(--faint)" }}>%</span>
          </div>
          {delta != null && (
            <span style={{ fontSize: 13, color: delta >= 0 ? "var(--ok)" : "var(--crit)", display: "flex", alignItems: "center", gap: 5 }}>
              <TrendingUp size={13} />
              {delta >= 0 ? "+" : ""}{delta} pts since last scan
            </span>
          )}
          <span style={{ fontSize: 12, color: "var(--faint)", marginTop: 2 }}>
            {p.resources_checked} resources · {summary.reports} daily reports
          </span>
        </div>

        {/* Open findings cell */}
        <div style={{
          padding: "22px 24px",
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Open findings
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 52, lineHeight: 1, color: open.length > 0 ? "var(--high)" : "var(--ok)" }}>
              {open.length}
            </span>
          </div>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {high > 0
              ? <><span style={{ color: "var(--crit)", fontWeight: 600 }}>{high}</span> high or critical</>
              : "none high or critical"}
          </span>
          <span style={{ fontSize: 12, color: "var(--faint)", marginTop: 2 }}>
            {waived.length} waived · {resolved.length} resolved
          </span>
        </div>

        {/* Chain / compliance cell */}
        <div style={{
          padding: "22px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Evidence chain
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 52, lineHeight: 1, color: "var(--accent-2)" }}>
              {summary.reports}
            </span>
          </div>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {verify
              ? verify.intact
                ? <><span style={{ color: "var(--ok)" }}>✓</span> verified intact</>
                : <><span style={{ color: "var(--crit)" }}>✕</span> {verify.problems.length} problem(s)</>
              : "tamper-evident sealed reports"}
          </span>
          <span style={{ fontSize: 12, color: "var(--faint)", marginTop: 2 }}>
            Joint Standard 2 of 2024 · daily
          </span>
        </div>
      </motion.div>

      {/* ── Auditor's brief ── */}
      <motion.div
        custom={1} variants={rise} initial="hidden" animate="show"
        className="brief"
      >
        <span className="seal" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M12 3 20 6v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6z" fill="none" stroke="#c9bfff" strokeWidth="1.8" />
            <path d="m8.5 12 2.5 2.5 4.5-5" stroke="#c9bfff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <small>The auditor's brief</small>
          <p id="brief-text" dangerouslySetInnerHTML={{ __html: briefHtml(summary, findings, verify) }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <button className="btn sm" onClick={copyBrief}><Copy size={14} /> Copy</button>
          <button className="btn sm" onClick={exportCsv}><Download size={14} /> CSV</button>
          <button className="btn sm" onClick={exportReport}><FileText size={14} /> Report</button>
        </div>
      </motion.div>

      {/* ── Bento grid ── */}
      <div className="bento">
        <Card className="score-card" animateDelay={0.16}>
          <div>
            <PostureConstellation score={p.score_pct} open={open} />
            <p className="caption">
              Each point is a control. Lit spokes have open findings — click to see them.
            </p>
          </div>
          <div>
            <h3>Severity breakdown</h3>
            <div className="bigstat" style={{ marginTop: 8 }}>{open.length} open</div>
            <div className="sevbar" style={{ marginTop: 14 }}>
              {SEV_ORDER.map((k) => (
                <i key={k} style={{ width: `${((summary.open_by_severity[k] || 0) / total) * 100}%`, background: SEV_COLORS[k] }} />
              ))}
            </div>
            <div className="sevkeys">
              {SEV_ORDER.map((k) => (
                <span key={k}>
                  <i className="dot" style={{ background: SEV_COLORS[k] }} />
                  {summary.open_by_severity[k] || 0} {titleCase(k)}
                </span>
              ))}
            </div>
            <TrendChart reports={reports} />
          </div>
        </Card>

        <Card className="chain-card" animateDelay={0.22}>
          <h3>Evidence chain</h3>
          <EvidenceChain reports={reports} verify={verify} headHash={summary.head_hash} />
        </Card>

        {/* KPI strip */}
        <div className="stats" style={{ gridColumn: "span 12" }}>
          {[
            {
              label: "Mean time to resolve",
              value: mttr(summary.mean_hours_to_resolve),
              sub: "from first seen to fixed",
              icon: <TrendingUp size={16} style={{ color: "var(--ok)" }} />,
              delay: 0.28,
            },
            {
              label: "Accepted risks",
              value: String(waived.length),
              sub: "waived with an expiry date",
              icon: <AlertTriangle size={16} style={{ color: "var(--high)" }} />,
              delay: 0.34,
            },
            {
              label: "Resolved recently",
              value: String(resolved.length),
              sub: "including automatic fixes",
              icon: <ShieldCheck size={16} style={{ color: "var(--ok)" }} />,
              delay: 0.40,
            },
          ].map((s) => (
            <Card key={s.label} className="stat" animateDelay={s.delay}>
              <h3>{s.label} {s.icon}</h3>
              <strong>{s.value}</strong>
              <p>{s.sub}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Scan timeline ── */}
      <ScanTimeline reports={reports} />

      {/* ── Needs attention table ── */}
      <Card className="tablecard" animateDelay={0.44}>
        <div className="thead">
          <div>
            <h2>Needs attention</h2>
            {open.length === 0 && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ok)" }}>
                ✓ Every control is passing
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {!live && (
              <span style={{ fontSize: 12, color: "var(--faint)", alignSelf: "center" }}>
                Sample data · connect config.js for live
              </span>
            )}
            <button className="btn sm" onClick={() => navigate("/findings")}>
              All findings
            </button>
          </div>
        </div>
        <FindingsTable
          findings={open}
          showStatus={false}
          onRowClick={openFinding}
          emptyText="Nothing needs attention. Every check passed."
          maxRows={5}
        />
      </Card>
    </>
  );
}
