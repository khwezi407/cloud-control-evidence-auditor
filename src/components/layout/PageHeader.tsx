import { useLocation } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { when } from "../../lib/helpers";

const PAGES: Record<string, { title: string; em: string; desc: string }> = {
  overview: {
    title: "Posture",
    em: "overview",
    desc: "Daily automated evidence of seven cybersecurity controls — auditor-verifiable under Joint Standard 2 of 2024.",
  },
  findings: {
    title: "Every",
    em: "finding",
    desc: "Full finding lifecycle: open, waived with expiry, and resolved. Sortable, exportable, with the exact remediation command.",
  },
  evidence: {
    title: "Evidence",
    em: "chain",
    desc: "Each daily report stores the SHA-256 hash of the one before it. Change any old report and the chain breaks.",
  },
  controls: {
    title: "The seven",
    em: "controls",
    desc: "Every control checked read-only, every day. Free to run. The fixer only acts on tagged resources.",
  },
  compliance: {
    title: "Compliance",
    em: "mapping",
    desc: "How the seven controls evidence the themes of Joint Standard 2 of 2024 — with a downloadable evidence report.",
  },
};

function routeName(path: string): string {
  if (path === "/" || path === "") return "overview";
  return path.replace(/^\//, "");
}

export function PageHeader() {
  const location = useLocation();
  const summary  = useStore((s) => s.summary);
  const name     = routeName(location.pathname);
  const page     = PAGES[name] ?? PAGES.overview;

  const p        = summary?.posture;
  const good     = p ? p.score_pct >= 80 : null;
  const ok       = p ? p.score_pct >= 60 : null;
  const delta    = p?.previous_score_pct != null ? +(p.score_pct - p.previous_score_pct).toFixed(1) : null;

  let verdictText = "";
  let verdictCls  = "";
  if (p) {
    verdictText = good ? "Healthy" : ok ? "Needs work" : "At risk";
    if (delta != null) verdictText += `  ·  ${delta >= 0 ? "+" : ""}${delta} since last scan`;
    verdictCls = good ? "good" : ok ? "warn" : "bad";
  }

  return (
    <div className="head">
      <div>
        <h1>
          {page.title} <em>{page.em}</em>
        </h1>
        <p className="sub">{page.desc}</p>
        {summary && name === "overview" && (
          <p className="sub" style={{ marginTop: 4 }}>
            Last scan {when(summary.generated_at)} · {summary.posture.resources_checked} resources · {summary.reports} daily reports
          </p>
        )}
      </div>
      {verdictText && (
        <span className={`chip ${verdictCls}`}>{verdictText}</span>
      )}
    </div>
  );
}
