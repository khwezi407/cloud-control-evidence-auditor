import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card } from "../common/Card";
import { useStore } from "../../store/useStore";
import { RULES, SEVERITY_RANK } from "../../data/rules";
import type { Finding } from "../../types";

const rise = {
  hidden: { opacity: 0, y: 14 },
  show:   (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.07, ease: [0.2,0.8,0.2,1] as const } }),
};

/** Projected score if a subset of open findings were fixed.
 *  Mirrors the auditor's formula: (resources_checked - open_after) / resources_checked * 100
 */
function projectedScore(allFindings: Finding[], fixedRuleIds: Set<string>, resourcesChecked: number): number {
  const stillOpen = allFindings.filter(
    (f) => f.status === "OPEN" && !fixedRuleIds.has(f.rule_id)
  ).length;
  return Math.round(((resourcesChecked - stillOpen) / resourcesChecked) * 100 * 10) / 10;
}

export function SimulatorView() {
  const summary  = useStore((s) => s.summary);
  const findings = useStore((s) => s.findings);
  const [fixed, setFixed] = useState<Set<string>>(new Set());

  if (!summary) return null;

  const open = findings.filter((f) => f.status === "OPEN");
  const ruleIds = [...new Set(open.map((f) => f.rule_id))].sort(
    (a, b) => SEVERITY_RANK[RULES[a].severity] - SEVERITY_RANK[RULES[b].severity]
  );

  const currentScore  = summary.posture.score_pct;
  const projected     = projectedScore(findings, fixed, summary.posture.resources_checked);
  const delta         = +(projected - currentScore).toFixed(1);
  const allFixed      = ruleIds.every((id) => fixed.has(id));

  const toggle = (id: string) => {
    const next = new Set(fixed);
    if (next.has(id)) next.delete(id); else next.add(id);
    setFixed(next);
  };
  const fixAll = () => setFixed(new Set(ruleIds));
  const reset  = () => setFixed(new Set());

  // Effort score per finding: CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1
  const effortMap: Record<string,number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const totalEffort = [...fixed].reduce((s, id) => s + effortMap[RULES[id]?.severity ?? "LOW"], 0);

  const arcC = 2 * Math.PI * 54;
  const arcFull = (pct: number) => (arcC * pct) / 100;

  return (
    <>
      <motion.div custom={0} variants={rise} initial="hidden" animate="show"
        style={{ marginBottom: 20, padding: "18px 24px", borderRadius: 20,
          border: "1px solid rgb(16 185 129 / 0.25)",
          background: "linear-gradient(105deg, rgb(16 185 129 / 0.10), var(--glass-bg) 65%)",
          backdropFilter: "blur(16px)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          What-if simulator
        </div>
        <p style={{ margin: 0, fontSize: 14.5, color: "var(--muted)", lineHeight: 1.6 }}>
          Tick the controls you plan to fix and see your projected posture score instantly.
          Use this to prioritise remediation work and brief your CISO on the impact.
        </p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

        {/* Left — control checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              {fixed.size} of {ruleIds.length} controls selected
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn sm" onClick={fixAll} disabled={allFixed}>Fix all</button>
              <button className="btn sm" onClick={reset}  disabled={fixed.size === 0}>Reset</button>
            </div>
          </div>

          {ruleIds.length === 0 ? (
            <Card animateDelay={0.1}>
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ok)" }}>
                <CheckCircle2 size={32} style={{ marginBottom: 10, opacity: 0.7 }} />
                <div style={{ fontWeight: 600 }}>No open findings — all controls passing</div>
              </div>
            </Card>
          ) : (
            ruleIds.map((id, i) => {
              const rule       = RULES[id];
              const ruleOpen   = open.filter((f) => f.rule_id === id);
              const isFixed    = fixed.has(id);
              const sevColors: Record<string,string> = {
                CRITICAL: "var(--crit)", HIGH: "var(--high)", MEDIUM: "var(--med)", LOW: "var(--low)"
              };
              const col = sevColors[rule.severity];
              return (
                <motion.div key={id} custom={i + 1} variants={rise} initial="hidden" animate="show">
                  <div
                    onClick={() => toggle(id)}
                    style={{
                      display: "grid", gridTemplateColumns: "auto auto 1fr auto",
                      gap: 14, alignItems: "center",
                      padding: "16px 20px", borderRadius: 16, cursor: "pointer",
                      border: `1px solid ${isFixed ? "rgb(16 185 129 / 0.4)" : "var(--glass-border)"}`,
                      background: isFixed ? "rgb(16 185 129 / 0.08)" : "var(--glass-bg)",
                      backdropFilter: "blur(12px)",
                      boxShadow: isFixed ? `0 0 20px rgb(16 185 129 / 0.12), inset 0 1px 0 var(--glass-shine)` : "inset 0 1px 0 var(--glass-shine)",
                      transition: "all 0.2s",
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                      border: `2px solid ${isFixed ? "var(--ok)" : "var(--glass-border-2)"}`,
                      background: isFixed ? "var(--ok)" : "transparent",
                      display: "grid", placeItems: "center",
                      transition: "all 0.2s",
                    }}>
                      {isFixed && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
                    </div>

                    {/* Rule badge */}
                    <span style={{
                      fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 600,
                      padding: "3px 9px", borderRadius: 7,
                      color: col, background: `${col}18`, border: `1px solid ${col}40`,
                    }}>{id}</span>

                    {/* Name + findings count */}
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink)" }}>{rule.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                        {ruleOpen.length} open finding{ruleOpen.length !== 1 ? "s" : ""} · {rule.severity}
                      </div>
                    </div>

                    {/* Score impact */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--faint)" }}>score impact</div>
                      <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, color: "var(--ok)", fontWeight: 600 }}>
                        +{(ruleOpen.length / summary.posture.resources_checked * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Right — projected score panel */}
        <div style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <Card animateDelay={0.1}>
            <h3>Projected score</h3>
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0 10px" }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="sim-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="var(--accent)" />
                    <stop offset="1" stopColor="var(--accent-2)" />
                  </linearGradient>
                </defs>
                {/* Background ring */}
                <circle cx="80" cy="80" r="54" fill="none" stroke="var(--glass-bg-2)" strokeWidth="10" />
                {/* Current score (muted) */}
                <circle cx="80" cy="80" r="54" fill="none"
                  stroke="var(--glass-border-2)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${arcFull(currentScore)} ${arcC}`}
                  transform="rotate(-90 80 80)" />
                {/* Projected score */}
                <circle cx="80" cy="80" r="54" fill="none"
                  stroke="url(#sim-grad)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${arcFull(projected)} ${arcC}`}
                  transform="rotate(-90 80 80)"
                  style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.2,.8,.2,1)", filter: "drop-shadow(0 0 8px var(--glow))" }} />
                <text x="80" y="74" textAnchor="middle"
                  fontFamily="'Instrument Serif', Georgia, serif" fontSize="32" fill="var(--ink)">
                  {projected}
                </text>
                <text x="80" y="90" textAnchor="middle" fontSize="11" fill="var(--faint)">projected</text>
              </svg>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
              <div style={{ textAlign: "center", padding: "12px", borderRadius: 12, background: "var(--glass-bg-2)", border: "1px solid var(--glass-border)" }}>
                <div style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Current</div>
                <div style={{ fontFamily: "'Instrument Serif'", fontSize: 26, color: "var(--muted)" }}>{currentScore}%</div>
              </div>
              <div style={{ textAlign: "center", padding: "12px", borderRadius: 12, background: delta > 0 ? "rgb(16 185 129 / 0.10)" : "var(--glass-bg-2)", border: `1px solid ${delta > 0 ? "rgb(16 185 129 / 0.3)" : "var(--glass-border)"}` }}>
                <div style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Delta</div>
                <div style={{ fontFamily: "'Instrument Serif'", fontSize: 26, color: delta > 0 ? "var(--ok)" : "var(--faint)" }}>
                  {delta > 0 ? `+${delta}` : delta}%
                </div>
              </div>
            </div>
          </Card>

          {/* Effort indicator */}
          <Card animateDelay={0.18}>
            <h3>Remediation effort</h3>
            <div style={{ marginTop: 12 }}>
              {[
                { label: "Controls to fix", value: fixed.size },
                { label: "Open findings closed", value: open.filter((f) => fixed.has(f.rule_id)).length },
                { label: "Effort score", value: `${totalEffort} / ${ruleIds.reduce((s,id) => s + effortMap[RULES[id]?.severity ?? "LOW"],0)}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--glass-border)" }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: "12px", borderRadius: 12, background: "var(--glass-bg-2)", border: "1px solid var(--glass-border)", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>
              <Zap size={13} style={{ display: "inline", marginRight: 5, color: "var(--accent)" }} />
              Effort score weights CRITICAL at 4× and LOW at 1×. Fixing high-severity findings first gives the best score per hour of work.
            </div>
          </Card>

          {/* CTA */}
          {delta > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: "14px 18px", borderRadius: 16,
                border: "1px solid rgb(16 185 129 / 0.35)", background: "rgb(16 185 129 / 0.10)",
                backdropFilter: "blur(12px)", fontSize: 13.5, color: "var(--ink)", lineHeight: 1.6 }}>
              <TrendingUp size={15} style={{ display: "inline", marginRight: 6, color: "var(--ok)" }} />
              Fixing {fixed.size} control{fixed.size !== 1 ? "s" : ""} moves your score from{" "}
              <strong>{currentScore}%</strong> to <strong style={{ color: "var(--ok)" }}>{projected}%</strong>.
              {projected >= 80 && currentScore < 80 && (
                <span style={{ color: "var(--ok)", fontWeight: 600 }}> This crosses the Healthy threshold.</span>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

