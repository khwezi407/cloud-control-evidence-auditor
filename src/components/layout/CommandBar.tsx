import { useNavigate } from "react-router-dom";
import { Search, Link2, Play, Command, RefreshCw } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useUi } from "../../store/useUi";
import { useState } from "react";

export function CommandBar() {
  const navigate       = useNavigate();
  const query          = useStore((s) => s.query);
  const setQuery       = useStore((s) => s.setQuery);
  const runScan        = useStore((s) => s.runScan);
  const verifyReports  = useStore((s) => s.verifyReports);
  const loading        = useStore((s) => s.loading);
  const openPalette    = useUi((s) => s.openPalette);
  const [verifying, setVerifying] = useState(false);

  async function handleVerify() {
    setVerifying(true);
    await verifyReports();
    setVerifying(false);
  }

  return (
    <div className="bar">
      <label className="search" htmlFor="search-input">
        <Search size={17} />
        <span className="kbd">/</span>
        <input
          id="search-input"
          type="search"
          placeholder="Search findings, resources, rules…"
          autoComplete="off"
          aria-label="Search findings"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value.trim().toLowerCase());
            if (e.target.value) navigate("/findings");
          }}
        />
      </label>

      <div className="actions">
        <button className="btn" onClick={openPalette} aria-label="Open command palette">
          <Command size={15} />
          Commands
          <kbd>Ctrl K</kbd>
        </button>

        <button className="btn" onClick={handleVerify} disabled={verifying} aria-label="Verify evidence chain">
          <Link2 size={15} style={verifying ? { animation: "spin 1s linear infinite" } : undefined} />
          {verifying ? "Verifying…" : "Verify chain"}
        </button>

        <button className="btn primary" onClick={runScan} disabled={loading} aria-label="Run a scan now">
          {loading
            ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />
            : <Play size={15} />
          }
          Run scan
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
