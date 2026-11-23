import { NavLink } from "react-router-dom";
import { Grid2x2, AlertTriangle, Link2, ShieldCheck, ScrollText, Briefcase } from "lucide-react";
import { useStore, type Theme, type Role } from "../../store/useStore";

const THEMES: { key: Theme; label: string }[] = [
  { key: "glass-dark",  label: "Dark"   },
  { key: "glass-light", label: "Light"  },
  { key: "nature",      label: "Nature" },
];

function NavIcon({ name }: { name: string }) {
  const p = { size: 16, strokeWidth: 1.7 };
  switch (name) {
    case "overview":    return <Grid2x2 {...p} />;
    case "findings":    return <AlertTriangle {...p} />;
    case "evidence":    return <Link2 {...p} />;
    case "controls":    return <ShieldCheck {...p} />;
    case "simulator":   return <Briefcase {...p} />;
    default:            return <ScrollText {...p} />;
  }
}

export function Sidebar() {
  const summary      = useStore((s) => s.summary);
  const live         = useStore((s) => s.live);
  const theme        = useStore((s) => s.theme);
  const role         = useStore((s) => s.role);
  const setTheme     = useStore((s) => s.setTheme);
  const setRole      = useStore((s) => s.setRole);
  const openCount    = useStore((s) => s.findings.filter((f) => f.status === "OPEN").length);
  const reports      = summary?.reports ?? 0;
  const p            = summary?.posture;
  const scoreColor   = p
    ? p.score_pct >= 80 ? "var(--ok)" : p.score_pct >= 60 ? "var(--high)" : "var(--crit)"
    : "var(--faint)";

  const links: [string, string, string | number | undefined][] = [
    ["overview",    "Overview",         undefined],
    ["findings",    "Findings",         openCount || undefined],
    ["evidence",    "Evidence chain",   reports   || undefined],
    ["controls",    "Controls",         7],
    ["compliance",  "Compliance",       undefined],
    ["simulator",   "What-if",          undefined],
  ];

  return (
    <aside className="side">
      {/* Brand */}
      <div className="brand">
        <span className="logo">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 20 6v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6z" fill="var(--accent)" />
            <path d="m8.5 12 2.5 2.5 4.5-5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <b>Evidence Auditor</b>
          <small>Cloud control evidence</small>
        </div>
      </div>

      {/* Account */}
      <div className="acct">
        <b title={summary?.account_id}>{summary ? summary.account_id : "—"}</b>
        <span>{summary ? `${summary.region} · ${live ? "live" : "sample"}` : "not connected"}</span>
      </div>

      {/* Live posture score */}
      {p && (
        <div className="side-score">
          <div className="label">Current posture</div>
          <div className="score-num" style={{ color: scoreColor }}>
            {p.score_pct}<span style={{ fontSize: 16, color: "var(--faint)" }}>%</span>
          </div>
          <div className="score-bar">
            <i style={{ width: `${p.score_pct}%`, background: scoreColor }} />
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
          <i /><span>{live ? "Live" : "Sample data"}</span>
        </span>

        {/* Role toggle */}
        <div className="theme-switcher">
          {(["ciso", "auditor"] as Role[]).map((r) => (
            <button
              key={r}
              className={`theme-btn ${role === r ? "active" : ""}`}
              onClick={() => setRole(r)}
              aria-label={`${r} view`}
            >
              {r === "ciso" ? "🏦 CISO" : "🔍 Auditor"}
            </button>
          ))}
        </div>

        {/* Theme switcher */}
        <div className="theme-switcher">
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={`theme-btn ${theme === t.key ? "active" : ""}`}
              onClick={() => setTheme(t.key)}
              aria-label={`${t.label} theme`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Compliance stamp */}
        <div className="compliance-stamp">
          <b>Joint Standard 2 of 2024</b>
          Cybersecurity &amp; cyber resilience — PA &amp; FSCA · in force 1 June 2025
        </div>
      </div>
    </aside>
  );
}
