import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useStore } from "../../store/useStore";
import { Card } from "../common/Card";
import { RULES, RULE_IDS } from "../../data/rules";

const SEVERITY_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: "Critical", color: "var(--crit)", bg: "rgb(249 79  94 / 0.10)" },
  HIGH:     { label: "High",     color: "var(--high)", bg: "rgb(245 166 35 / 0.10)" },
  MEDIUM:   { label: "Medium",   color: "var(--med)",  bg: "rgb( 74 158 255 / 0.10)" },
  LOW:      { label: "Low",      color: "var(--low)",  bg: "var(--glass-2)" },
};

const riseItem = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.055, ease: [0.2, 0.8, 0.2, 1] as const },
  }),
};

export function ControlsView() {
  const navigate     = useNavigate();
  const findings     = useStore((s) => s.findings);
  const summary      = useStore((s) => s.summary);
  const setQuery     = useStore((s) => s.setQuery);
  const open         = findings.filter((f) => f.status === "OPEN");

  const passing  = RULE_IDS.filter((id) => !open.some((f) => f.rule_id === id)).length;
  const failing  = RULE_IDS.length - passing;

  return (
    <>
      {/* ── Summary row ── */}
      <motion.div
        custom={0} variants={riseItem} initial="hidden" animate="show"
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          padding: "14px 20px",
          borderRadius: 16,
          border: "1px solid var(--line)",
          background: "var(--glass)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--ok)", fontWeight: 500 }}>✓ {passing} passing</span>
        <span style={{ color: "var(--line-2)" }}>·</span>
        <span style={{ fontSize: 13, color: failing > 0 ? "var(--high)" : "var(--faint)", fontWeight: failing > 0 ? 500 : 400 }}>
          {failing > 0 ? `${failing} with open findings` : "none with open findings"}
        </span>
        <span style={{ color: "var(--line-2)" }}>·</span>
        <span style={{ fontSize: 13, color: "var(--faint)" }}>7 controls · all read-only · all free to run</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--faint)" }}>
          Click a card to see its findings
        </span>
      </motion.div>

      {/* ── Control cards ── */}
      <div className="controls-grid">
        {RULE_IDS.map((id, i) => {
          const rule     = RULES[id];
          const n        = open.filter((f) => f.rule_id === id).length;
          const err      = summary?.rule_errors?.[id];
          const sv       = SEVERITY_LABEL[rule.severity];
          const chipCls  = err ? "bad" : n ? "warn" : "good";
          const chipTxt  = err ? "Could not run" : n ? `${n} open` : "Passing";

          return (
            <motion.div key={id} custom={i + 1} variants={riseItem} initial="hidden" animate="show">
              <Card className="control">
                <div className="top">
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="rid">{id}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "2px 9px",
                      color: sv.color, background: sv.bg, border: `1px solid ${sv.color}30`,
                    }}>
                      {sv.label}
                    </span>
                  </div>
                  <span className={`chip ${chipCls}`} style={{ fontSize: 11 }}>{chipTxt}</span>
                </div>

                <h3 className="name">{rule.name}</h3>
                <p>{rule.why}</p>

                {n > 0 && (
                  <button
                    className="btn sm"
                    onClick={() => { setQuery(id.toLowerCase()); navigate("/findings"); }}
                  >
                    See {n} finding{n !== 1 ? "s" : ""}
                  </button>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Design note ── */}
      <motion.div
        custom={RULE_IDS.length + 2} variants={riseItem} initial="hidden" animate="show"
        style={{
          marginTop: 20,
          padding: "16px 20px",
          borderRadius: 16,
          border: "1px solid var(--line)",
          background: "var(--glass)",
          fontSize: 13,
          color: "var(--muted)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--ink)", display: "block", marginBottom: 4 }}>Design principle: least privilege</strong>
        The auditor function only reads. A second function — the fixer — is scoped to exactly one action: enabling Block Public Access on S3 buckets tagged <code style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, background: "var(--code-bg)", padding: "1px 6px", borderRadius: 5 }}>auto-remediate=true</code>. The component that reads everything cannot change anything.
      </motion.div>
    </>
  );
}
