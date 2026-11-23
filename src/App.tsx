import { useEffect } from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { CommandBar } from "./components/layout/CommandBar";
import { PageHeader } from "./components/layout/PageHeader";
import { OverviewView } from "./components/views/OverviewView";
import { FindingsView } from "./components/views/FindingsView";
import { EvidenceView } from "./components/views/EvidenceView";
import { ControlsView } from "./components/views/ControlsView";
import { ComplianceView } from "./components/views/ComplianceView";
import { CommandPalette } from "./components/common/CommandPalette";
import { Toast } from "./components/common/Toast";
import { FindingDrawer } from "./components/findings/FindingDrawer";
import { useStore } from "./store/useStore";
import { useUi } from "./store/useUi";
import { finishSignIn } from "./lib/auth";

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    document.querySelector(".main")?.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}

function AppShell() {
  const theme = useStore((s) => s.theme);
  const init = useStore((s) => s.init);
  const load = useStore((s) => s.load);
  const config = useStore((s) => s.config);
  const live = useStore((s) => s.live);
  const setSignedIn = useStore((s) => s.setSignedIn);
  const togglePalette = useUi((s) => s.togglePalette);
  const closePalette = useUi((s) => s.closePalette);
  const openFinding = useUi((s) => s.openFinding);

  // Apply the theme attribute and boot the store once.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      init();
      if (live && config) {
        const err = await finishSignIn(config);
        if (err) useStore.getState().setLastAction(err);
        if (!cancelled) setSignedIn(true);
      }
      if (!cancelled) load();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
        return;
      }
      if (e.key === "Escape") {
        closePalette();
        openFinding(null);
      }
      if (e.key === "/" && !inField) {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePalette, closePalette, openFinding]);

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <CommandBar />
        <PageHeader />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<OverviewView />} />
          <Route path="/findings" element={<FindingsView />} />
          <Route path="/evidence" element={<EvidenceView />} />
          <Route path="/controls" element={<ControlsView />} />
          <Route path="/compliance" element={<ComplianceView />} />
        </Routes>
        <footer>
          <span id="note">
            {live ? "" : "Sample data that mirrors the seeded lab. Add config.js to connect your account."}
          </span>
          <span>
            Reference implementation · AWS Lambda, DynamoDB, S3, Cognito · built by Khwezi Maphumulo
          </span>
        </footer>
      </main>
      <CommandPalette />
      <Toast />
      <FindingDrawer />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
