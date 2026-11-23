import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useStore } from "../../store/useStore";
import { useUi } from "../../store/useUi";
import { FIX, RULES } from "../../data/rules";
import type { Finding } from "../../types";
import { esc, findingKey, relative, titleCase, whenFull } from "../../lib/helpers";

function highlight(json: string): string {
  return esc(json).replace(
    /(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?\b/g,
    (m, str, colon) =>
      str ? `<span class="${colon ? "k" : "s"}">${str}</span>${colon ?? ""}` : `<span class="n">${m}</span>`,
  );
}

function statusName(s: Finding["status"]) {
  return s === "SUPPRESSED" ? "Waived" : titleCase(s);
}

export function FindingDrawer() {
  const key = useUi((s) => s.activeFindingKey);
  const openFinding = useUi((s) => s.openFinding);
  const findings = useStore((s) => s.findings);
  const setLastAction = useStore((s) => s.setLastAction);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const finding = findings.find((f) => findingKey(f) === key) ?? null;
  const open = !!finding;

  // Pretty-print the raw AWS API evidence, and build the suggested fix command.
  const evidenceJson = finding
    ? (() => {
        try {
          return JSON.stringify(JSON.parse(finding.evidence), null, 2);
        } catch {
          return finding.evidence;
        }
      })()
    : "";
  const fixCommand =
    finding && FIX[finding.rule_id] && finding.status !== "RESOLVED" ? FIX[finding.rule_id](finding) : "";

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  async function copyCmd(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setLastAction("Command copied. Review it before running.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setLastAction("Copy isn't allowed here. Select the command and copy it.");
    }
  }

  return (
    <AnimatePresence>
      {open && finding && (
        <>
          <motion.div
            className="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => openFinding(null)}
          />
          <motion.aside
            className="drawer"
            role="dialog"
            aria-label="Finding details"
            aria-hidden="false"
            initial={{ x: "110%" }}
            animate={{ x: 0 }}
            exit={{ x: "110%" }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={`sev ${finding.severity}`}>{titleCase(finding.severity)}</span>
              <button className="btn sm" ref={closeRef} onClick={() => openFinding(null)} aria-label="Close">
                <X size={16} /> Close
              </button>
            </div>

            <h2>{finding.title}</h2>
            <p>{RULES[finding.rule_id]?.why}</p>

            <h4>Details</h4>
            <dl className="facts">
              <dt>Status</dt>
              <dd>{statusName(finding.status)}</dd>
              <dt>Control</dt>
              <dd>
                {finding.rule_id} · {RULES[finding.rule_id]?.name}
              </dd>
              <dt>Resource</dt>
              <dd className="mono">{finding.resource_arn}</dd>
              <dt>First seen</dt>
              <dd title={whenFull(finding.first_seen)}>
                {whenFull(finding.first_seen)} ({relative(finding.first_seen)})
              </dd>
              {finding.resolved_at ? (
                <>
                  <dt>Resolved</dt>
                  <dd title={whenFull(finding.resolved_at)}>{whenFull(finding.resolved_at)}</dd>
                </>
              ) : (
                <>
                  <dt>Last seen</dt>
                  <dd title={whenFull(finding.last_seen)}>{whenFull(finding.last_seen)}</dd>
                </>
              )}
            </dl>

            <h4>How to fix</h4>
            <p>{finding.remediation}</p>
            {fixCommand && (
              <div className="cmd" style={{ marginTop: 10 }}>
                <code>{fixCommand}</code>
                <button className="btn sm" style={{ padding: "0 10px" }} onClick={() => copyCmd(fixCommand)}>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            )}

            <h4>Evidence: the raw answer from the AWS API</h4>
            <pre>
              <code dangerouslySetInnerHTML={{ __html: highlight(evidenceJson) }} />
            </pre>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
