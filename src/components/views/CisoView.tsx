import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, TrendingUp, FileText, Clock, Award } from "lucide-react";
import { Card } from "../common/Card";
import { useStore } from "../../store/useStore";
import { COMPLIANCE_DOMAINS } from "../../data/rules";
import { complianceReportHtml } from "../../lib/export";
import { downloadHtml, mttr } from "../../lib/helpers";
import { ScanTimeline } from "../overview/ScanTimeline";

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: [0.2,0.8,0.2,1] as const } }),
};

/** CISO mode: a single-page executive brief. All the numbers, none of the
 *  technical detail. Designed for a 5-minute Board or EXCO update. */
export function CisoView() {
  const summary  = useStore((s) => s.summary);
  const findings = useStore((s) => s.findings);
  const reports  = useStore((s) => s.reports);
  const setAction = useStore((s) => s.setLastAction);

  if (!summary) return null;

  const open     = findings.filter((f) => f.status === "OPEN");
  const waived   = findings.filter((f) => f.status === "SUPPRESSED");
  const resolved = findings.filter((f) => f.status === "RESOLVED");
  const high     = open.filter((f) => f.severity === "HIGH" || f.severity === "CRITICAL").length;
  const p        = summary.posture;
  const delta    = p.previous_score_pct != null ? +(p.score_pct - p.previous_score_pct).toFixed(1) : null;
  const postureCls = p.score_pct >= 80 ? "good" : p.score_pct >= 60 ? "warn" : "bad";
  const postureLabel = p.score_pct >= 80 ? "HEALTHY" : p.score_pct >= 60 ? "NEEDS WORK" : "AT RISK";
  const scoreColor = p.score_pct >= 80 ? "var(--ok)" : p.score_pct >= 60 ? "var(--high)" : "var(--crit)";

  // Per-domain compliance coverage
  const domainStatus = COMPLIANCE_DOMAINS.map((d) => {
    const passing = d.controls.filter((id) => !open.some((f) => f.rule_id === id)).length;
    return { ...d, passing, all: passing === d.controls.length };
  });

  function downloadReport() {
    downloadHtml(`compliance-report-${summary!.account_id}.html`, complianceReportHtml(summary!, findings));
    setAction("Evidence report downloaded.");
  }

  const bigMetrics = [
    { label: "Posture score",        value: `${p.score_pct}%`, color: scoreColor,       sub: delta != null ? `${delta >= 0 ? "+" : ""}${delta} pts vs last scan` : "first scan", icon: <Award size={18} /> },
    { label: "Open findings",        value: open.length,       color: open.length > 0 ? "var(--high)" : "var(--ok)",  sub: `${high} high or critical`, icon: <AlertTriangle size={18} /> },
    { label: "Mean time to resolve", value: mttr(summary.mean_hours_to_resolve), color: "var(--ink)", sub: "first seen → fixed", icon: <Clock size={18} /> },
    { label: "Sealed reports",       value: summary.reports,   color: "var(--accent-2)", sub: `${waived.length} accepted risks`, icon: <ShieldCheck size={18} /> },
    { label: "Resolved findings",    value: resolved.length,   color: "var(--ok)",       sub: "including auto-fixes", icon: <TrendingUp size={18} /> },
  ];

  return (
    <>
      {/* Executive status banner */}
      <motion.div custom={0} variants={rise} initial="hidden" animate="show"
        style={{
          display: "grid", gridTemplateColumns: "auto 1fr auto",
          gap: 24, alignItems: "center", marginBottom: 20,
          padding: "24px 28px", borderRadius: 22,
          border: `1px solid ${scoreColor}44`,
          background: `linear-gradient(105deg, ${scoreColor}14, var(--glass-bg) 60%)`,
          backdropFilter: "blur(16px)",
          boxShadow: `inset 0 1px 0 var(--glass-shine), 0 0 40px ${scoreColor}10`,
        }}>
        <div style={{ textAlign: "center", minWidth: 90 }}>
          <div style={{ fontFamily: "'Instrument Serif'", fontSize: 56, lineHeight: 1, color: scoreColor }}>
            {p.score_pct}<span style={{ fontSize: 22, color: "var(--faint)" }}>%</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <span className={`chip ${postureCls}`} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
              {postureLabel}
            </span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Executive security brief · {summary.account_id} · {summary.region}
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--ink)" }}>
            {open.length === 0
              ? "Every security control is passing. The account is in a healthy posture."
              : `${open.length} finding${open.length !== 1 ? "s" : ""} require attention, ${high} of which are high or critical severity.`}
            {delta != null && ` Score has ${delta >= 0 ? "improved" : "declined"} by ${Math.abs(delta)} points since the last scan.`}
            {" "}The evidence chain holds {summary.reports} tamper-evident sealed daily reports.
          </p>
        </div>
        <button className="btn primary" onClick={downloadReport} style={{ whiteSpace: "nowrap" }}>
          <FileText size={15} /> Download evidence report
        </button>
      </motion.div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
        {bigMetrics.map((m, i) => (
          <motion.div key={m.label} custom={i + 1} variants={rise} initial="hidden" animate="show">
            <Card animateDelay={0} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
                  {m.label}
                </span>
                <span style={{ color: m.color, opacity: 0.6 }}>{m.icon}</span>
              </div>
              <div style={{ fontFamily: "'Instrument Serif'", fontSize: 36, lineHeight: 1, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4 }}>{m.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Scan timeline */}
      <ScanTimeline reports={reports} />

      {/* Compliance domains */}
      <motion.div custom={8} variants={rise} initial="hidden" animate="show" style={{ marginTop: 16 }}>
        <Card>
          <h3 style={{ marginBottom: 16 }}>Joint Standard 2 of 2024 — domain coverage</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {domainStatus.map((d) => (
              <div key={d.clauseId} style={{
                padding: "14px 16px", borderRadius: 14,
                border: `1px solid ${d.all ? "rgb(16 185 129 / 0.3)" : "rgb(245 158 11 / 0.3)"}`,
                background: d.all ? "rgb(16 185 129 / 0.07)" : "rgb(245 158 11 / 0.07)",
                backdropFilter: "blur(8px)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Geist Mono'", fontSize: 11, fontWeight: 600, color: d.all ? "var(--accent-2)" : "var(--high)" }}>
                    {d.clauseId}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: d.all ? "var(--ok)" : "var(--high)" }}>
                    {d.passing}/{d.controls.length}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{d.clauseTitle}</div>
                <div style={{ height: 3, borderRadius: 99, background: "var(--glass-bg-2)", marginTop: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(d.passing / d.controls.length) * 100}%`, background: d.all ? "var(--ok)" : "var(--high)", borderRadius: 99, transition: "width 0.8s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Footnote */}
      <motion.p custom={9} variants={rise} initial="hidden" animate="show"
        className="mono" style={{ marginTop: 16, color: "var(--faint)", maxWidth: 760 }}>
        This report covers {summary.posture.resources_checked} resources checked against 7 security controls.
        Evidence is sealed with SHA-256 and verifiable at any time. Generated {new Date(summary.generated_at).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })} SAST.
        Reference implementation — not a substitute for a formal compliance assessment.
      </motion.p>
    </>
  );
}

