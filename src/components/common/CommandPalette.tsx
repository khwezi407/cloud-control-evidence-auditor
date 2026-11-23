import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useUi } from "../../store/useUi";
import { RULES, RULE_IDS } from "../../data/rules";
import { complianceReportHtml, findingsToCsv } from "../../lib/export";
import { downloadHtml, downloadText, esc, findingKey, titleCase } from "../../lib/helpers";

interface Command {
  label: string;
  hint: string;
  run: () => void;
}

const VIEW_ROUTES: Record<string, string> = {
  overview: "",
  findings: "findings",
  evidence: "evidence",
  controls: "controls",
  compliance: "compliance",
};

const VIEW_LABELS: Record<string, string> = {
  overview: "Posture overview",
  findings: "Every finding",
  evidence: "Evidence chain",
  controls: "The seven controls",
  compliance: "Compliance mapping",
};

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const closePalette = useUi((s) => s.closePalette);
  const openFinding = useUi((s) => s.openFinding);
  const navigate = useNavigate();

  const summary = useStore((s) => s.summary);
  const findings = useStore((s) => s.findings);
  const runScan = useStore((s) => s.runScan);
  const verifyReports = useStore((s) => s.verifyReports);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const setQuery = useStore((s) => s.setQuery);
  const setLastAction = useStore((s) => s.setLastAction);

  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  // Reset input each time the palette opens.
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [
      { label: "Run a scan now", hint: "action", run: () => runScan() },
      { label: "Verify the evidence chain", hint: "action", run: () => verifyReports() },
      { label: "Copy the auditor's brief", hint: "action", run: () => copyBrief() },
      {
        label: "Export findings (CSV)",
        hint: "download",
        run: () => {
          downloadText(`findings-${summary?.account_id ?? "account"}.csv`, findingsToCsv(findings), "text/csv");
          setLastAction("Findings exported as CSV.");
        },
      },
      {
        label: "Download compliance report",
        hint: "download",
        run: () => {
          if (summary) {
            downloadHtml(`compliance-report-${summary.account_id}.html`, complianceReportHtml(summary, findings));
            setLastAction("Compliance report downloaded.");
          }
        },
      },
      { label: "Toggle light / dark theme", hint: "view", run: () => toggleTheme() },
    ];

    for (const [key, label] of Object.entries(VIEW_LABELS)) {
      list.push({
        label: `Go to ${label.toLowerCase()}`,
        hint: "view",
        run: () => navigate(`/${VIEW_ROUTES[key]}`),
      });
    }

    for (const id of RULE_IDS) {
      list.push({
        label: `${id} · ${RULES[id].name}`,
        hint: "control",
        run: () => {
          setQuery(id.toLowerCase());
          navigate("/findings");
        },
      });
    }

    for (const f of findings) {
      list.push({
        label: f.title,
        hint: titleCase(f.status).toLowerCase(),
        run: () => openFinding(findingKey(f)),
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, findings, runScan, verifyReports, toggleTheme, setQuery, navigate, openFinding, setLastAction]);

  async function copyBrief() {
    const el = document.getElementById("brief-text");
    const text = el?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setLastAction("Brief copied. Paste it into an email or a status update.");
    } catch {
      setLastAction("Copy isn't allowed here. Select the brief and copy it.");
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = term ? commands.filter((c) => c.label.toLowerCase().includes(term)) : commands;
    return base.slice(0, 12);
  }, [q, commands]);

  // keep the active index in range as the filter changes
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePalette();
    }
  }

  function run(i: number) {
    const cmd = filtered[i];
    closePalette();
    if (cmd) cmd.run();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette"
          role="dialog"
          aria-label="Command palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePalette();
          }}
          onKeyDown={onKeyDown}
        >
          <motion.div
            className="pbox"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <div style={{ position: "relative" }}>
              <Search
                size={18}
                style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}
              />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type a command or search findings"
                aria-label="Command"
                style={{ paddingLeft: 44 }}
              />
            </div>
            <ul role="listbox">
              {filtered.length === 0 && <li>No matches</li>}
              {filtered.map((c, i) => (
                <li
                  key={`${c.label}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(i)}
                >
                  <span dangerouslySetInnerHTML={{ __html: highlight(c.label, q) }} />
                  <small>{c.hint}</small>
                </li>
              ))}
            </ul>
            <div className="pfoot">
              <span>↑ ↓ to move</span>
              <span>Enter to run</span>
              <span>Esc to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Highlight the matched substring. */
function highlight(label: string, term: string): string {
  const t = term.trim();
  if (!t) return esc(label);
  const i = label.toLowerCase().indexOf(t.toLowerCase());
  if (i < 0) return esc(label);
  return esc(label.slice(0, i)) + `<mark style="color:var(--accent-2)">${esc(label.slice(i, i + t.length))}</mark>` + esc(label.slice(i + t.length));
}
