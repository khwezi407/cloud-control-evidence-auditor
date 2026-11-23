import { useNavigate } from "react-router-dom";
import { ShieldCheck, AlertTriangle, FileText, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../../store/useStore";
import { Card } from "../common/Card";
import { COMPLIANCE_DOMAINS, RULES } from "../../data/rules";
import { complianceReportHtml } from "../../lib/export";
import { downloadHtml } from "../../lib/helpers";

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.07, ease: [0.2, 0.8, 0.2, 1] as const } }),
};

export function ComplianceView() {
  const navigate     = useNavigate();
  const findings     = useStore((s) => s.findings);
  const summary      = useStore((s) => s.summary);
  const setQuery     = useStore((s) => s.setQuery);
  const setLastAction = useStore((s) => s.setLastAction);

  if (!summary) return null;
  const open = findings.filter((f) => f.status === "OPEN");

  const controlSatisfied = (ruleId: string) => !open.some((f) => f.rule_id === ruleId);

  function domainStatus(controls: string[]) {
    const satisfied = controls.filter(controlSatisfied).length;
    return { satisfied, total: controls.length, all: satisfied === controls.length };
  }

  const totalControls      = Object.keys(RULES).length;
  const satisfiedControls  = totalControls - new Set(open.map((f) => f.rule_id)).size;
  const coverage           = Math.round((satisfiedControls / totalControls) * 100);

  function downloadReport() {
    downloadHtml(`compliance-report-${summary!.account_id}.html`, complianceReportHtml(summary!, findings));
    setLastAction("Compliance report downloaded.");
  }

  return (
    <>
      {/* ── Hero callout ── */}
      <motion.div custom={0} variants={rise} initial="hidden" animate="show"
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 24,
          alignItems: "flex-start",
          marginBottom: 20,
          padding: "24px 28px",
          borderRadius: 22,
          border: "1px solid var(--line)",
          background: "linear-gradient(105deg, rgb(124 110 245 / 0.09), var(--glass) 60%)",
        }}
      >
        <div style={{ textAlign: "center", paddingTop: 4 }}>
          <div style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 60,
            lineHeight: 1,
            color: "var(--accent-2)",
          }}>
            {coverage}<span style={{ fontSize: 24, color: "var(--faint)" }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4 }}>
            Controls satisfied
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-2)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            Joint Standard 2 of 2024 · Reference compliance mapping
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 15, lineHeight: 1.65, color: "var(--ink)", fontWeight: 400 }}>
            Since <strong>1 June 2025</strong> every bank, insurer, and financial institution in South Africa must meet the Joint Standard on cybersecurity and cyber resilience — issued jointly by the Prudential Authority and the FSCA.
            A core requirement is being able to <em>prove</em> that you comply, not just claim it.
          </p>
          <p style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)" }}>
            This reference implementation runs seven daily checks, keeps a tamper-evident SHA-256 chain of evidence, and maps every result to the standard's cybersecurity themes below.
            Click any control badge to see its open findings. Use the button below to download a printable evidence report you could share with an auditor.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn sm primary" onClick={downloadReport}>
              <FileText size={14} /> Download evidence report
            </button>
            <button className="btn sm" onClick={() => navigate("/evidence")}>
              <ExternalLink size={14} /> View chain
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Coverage summary bar ── */}
      <motion.div custom={1} variants={rise} initial="hidden" animate="show"
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 20,
          padding: "16px 24px",
          borderRadius: 16,
          border: "1px solid var(--line)",
          background: "var(--glass)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}>
          {satisfiedControls} of {totalControls} controls passing
        </span>
        <div style={{ flex: 1, minWidth: 120, height: 6, borderRadius: 99, background: "var(--glass-2)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${coverage}%`,
            background: coverage >= 80 ? "var(--ok)" : coverage >= 60 ? "var(--high)" : "var(--crit)",
            borderRadius: 99,
            transition: "width 1.2s ease",
          }} />
        </div>
        <span style={{ fontSize: 13, color: "var(--faint)", flexShrink: 0 }}>
          {totalControls - satisfiedControls > 0
            ? `${totalControls - satisfiedControls} with open findings`
            : "All controls satisfied"}
        </span>
      </motion.div>

      {/* ── Domain cards ── */}
      <div className="compliance-grid">
        {COMPLIANCE_DOMAINS.map((domain, i) => {
          const { satisfied, total, all } = domainStatus(domain.controls);
          return (
            <Card key={domain.clauseId} className="cdomain" animateDelay={0.08 + i * 0.06}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <span className="cid">{domain.clauseId}</span>
                <span className={`chip ${all ? "good" : "warn"}`} style={{ fontSize: 11 }}>
                  {all ? <><ShieldCheck size={11} /> {satisfied}/{total}</> : <><AlertTriangle size={11} /> {satisfied}/{total}</>}
                </span>
              </div>
              <h3>{domain.clauseTitle}</h3>
              <p>{domain.description}</p>

              <div className="ctags">
                {domain.controls.map((rid) => {
                  const passing = controlSatisfied(rid);
                  return (
                    <button
                      key={rid}
                      className="chip"
                      style={{
                        cursor: "pointer",
                        color:        passing ? "var(--ok)"   : "var(--high)",
                        borderColor:  passing ? "rgb(52 208 140 / 0.28)"  : "rgb(245 166 35 / 0.28)",
                        background:   passing ? "rgb(52 208 140 / 0.07)"  : "rgb(245 166 35 / 0.07)",
                        gap: 5,
                        fontSize: 11.5,
                      }}
                      onClick={() => { setQuery(rid.toLowerCase()); navigate("/findings"); }}
                      title={`${rid} · ${RULES[rid].name} — ${passing ? "passing" : "open findings"}`}
                    >
                      {passing ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                      {rid}
                    </button>
                  );
                })}
              </div>

              <div className="note">
                {all ? (
                  <span style={{ color: "var(--ok)" }}>✓ All {total} control{total !== 1 ? "s" : ""} satisfied</span>
                ) : (
                  <span style={{ color: "var(--high)" }}>
                    {satisfied}/{total} passing — {total - satisfied} with open findings
                  </span>
                )}
                <br />
                {domain.note}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Disclaimer ── */}
      <motion.p
        custom={COMPLIANCE_DOMAINS.length + 2} variants={rise} initial="hidden" animate="show"
        className="mono"
        style={{ marginTop: 20, maxWidth: 760, color: "var(--faint)" }}
      >
        Illustrative reference mapping, not legal advice. A compliance team would map each control to the exact clause text of the standard. This tool demonstrates the kind of automated evidence generation that supports a formal compliance programme.
      </motion.p>
    </>
  );
}
