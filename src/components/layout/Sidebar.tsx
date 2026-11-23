import { NavLink } from "react-router-dom";
import {
  Grid2x2,
  AlertTriangle,
  Link2,
  ShieldCheck,
  ScrollText,
  Sun,
  Moon,
} from "lucide-react";
import { useStore } from "../../store/useStore";

function NavIcon({ name }: { name: string }) {
  const p = { size: 16, strokeWidth: 1.7 };
  switch (name) {
    case "overview":    return <Grid2x2 {...p} />;
    case "findings":    return <AlertTriangle {...p} />;
    case "evidence":    return <Link2 {...p} />;
    case "controls":    return <ShieldCheck {...p} />;
    default:            return <ScrollText {...p} />;
  }
}

export function Sidebar() {
  const summary     = useStore((s) => s.summary);
  const live        = useStore((s) => s.live);
  const theme       = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  const openFindings = useStore((s) => s.findings.filter((f) => f.status === "OPEN").length);
  const reports      = summary?.reports ?? 0;
  const p            = summary?.posture;
  const good         = p ? p.score_pct >= 80 : null;
  const ok           = p ? p.score_pct >= 60 : null;
  const scoreColor   = good ? "var(--ok)" : ok ? "var(--high)" : "var(--crit)";

  const links: [string, string, string | number | undefined][] = [
    ["overview",    "Overview",         undefined],
    ["findings",    "Findings",         openFindings || undefined],
    ["evidence",    "Evidence chain",   reports || undefined],
    ["controls",    "Controls",         7],
    ["compliance",  "Compliance",       undefined],
  ];

  return (
    <aside className="side">
      {/* Brand */}
      <div className="brand">
        <span className="logo">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 20 6v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6z" fill="#8b7bff" />
            <path d="m8.5 12 2.5 2.5 4.5-5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <b>Evidence Auditor</b>
          <small>Cloud control evidence</small>
        </div>
      </div>

      {/* Account pill */}
      <div className="acct">
        <b title={summary?.account_id}>{summary ? summary.account_id : "—"}</b>
        <span>{summary ? `${summary.region} · ${live ? "live" : "sample"}` : "not connected"}</span>
      </div>

      {/* Posture mini-score */}
      {p && (
        <div style={{
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid var(--line)",
          background: "var(--glass)",
        }}>
          <div style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            Current posture
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 34, lineHeight: 1, color: scoreColor }}>
              {p.score_pct}
            </span>
            <span style={{ fontSize: 14, color: "var(--faint)" }}>%</span>
          </div>
          {/* Mini bar */}
          <div style={{ height: 4, borderRadius: 99, background: "var(--glass-2)", marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${p.score_pct}%`, background: scoreColor, borderRadius: 99, transition: "width 1s ease" }} />
          </div>
        </div>
      )}

      {/* Nav */}
      <div>
        <p className="navlabel">Views</p>
        <nav className="nav" aria-label="Views">
          {links.map(([to, label, count]) => (
            <NavLink
              key={to}
              to={to === "overview" ? "/" : `/${to}`}
              className="nav-link"
            >
              <NavIcon name={to} />
              {label}
              {count != null ? <span className="count">{count}</span> : null}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="side-foot">
        <span className={`live ${live ? "on" : ""}`}>
          <i />
          <span>{live ? "Live" : "Sample data"}</span>
        </span>

        <button className="btn sm" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          {theme === "dark" ? "Light" : "Dark"} theme
        </button>

        {/* Compliance stamp */}
        <div style={{
          marginTop: 4,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgb(124 110 245 / 0.2)",
          background: "rgb(124 110 245 / 0.06)",
          fontSize: 11,
          color: "var(--faint)",
          lineHeight: 1.5,
        }}>
          <div style={{ color: "var(--accent-2)", fontWeight: 600, marginBottom: 2, fontSize: 11 }}>
            Joint Standard 2 of 2024
          </div>
          Cybersecurity &amp; cyber resilience — Prudential Authority &amp; FSCA, in force 1 June 2025
        </div>
      </div>
    </aside>
  );
}
