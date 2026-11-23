import { create } from "zustand";
import type {
  AuditSummary,
  DashboardConfig,
  Finding,
  SealedReport,
  VerifyResult,
} from "../types";
import { SAMPLE_FINDINGS, SAMPLE_REPORTS, SAMPLE_SUMMARY } from "../data/sampleData";
import { loadFindings, loadReports, loadSummary, startScan, verifyApi } from "../lib/api";
import { getStoredToken } from "../lib/auth";
import { verifyChain } from "../lib/verify";

type Filter = "OPEN" | "SUPPRESSED" | "RESOLVED" | "ALL";
export type Theme = "glass-dark" | "glass-light" | "nature";
export type Role = "ciso" | "auditor";

const THEME_KEY = "eac-theme";
const ROLE_KEY  = "eac-role";

function initialTheme(): Theme {
  const s = typeof localStorage !== "undefined" ? localStorage.getItem(THEME_KEY) : null;
  if (s === "glass-light") return "glass-light";
  if (s === "nature")      return "nature";
  return "glass-dark";
}
function initialRole(): Role {
  const s = typeof localStorage !== "undefined" ? localStorage.getItem(ROLE_KEY) : null;
  return s === "ciso" ? "ciso" : "auditor";
}

export function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
}

interface State {
  config: DashboardConfig | null;
  live: boolean;
  summary: AuditSummary | null;
  findings: Finding[];
  reports: SealedReport[];
  verify: VerifyResult | null;
  filter: Filter;
  query: string;
  theme: Theme;
  role: Role;
  loading: boolean;
  error: string | null;
  signedIn: boolean;
  lastAction: string | null;

  init: () => void;
  load: () => Promise<void>;
  runScan: () => Promise<void>;
  verifyReports: () => Promise<void>;
  setFilter: (f: Filter) => void;
  setQuery: (q: string) => void;
  setTheme: (t: Theme) => void;
  setRole: (r: Role) => void;
  setSignedIn: (v: boolean) => void;
  setLastAction: (m: string | null) => void;
  // kept for backward compat with any remaining callers
  toggleTheme: () => void;
}

export const useStore = create<State>((set, get) => ({
  config: null,
  live: false,
  summary: null,
  findings: [],
  reports: [],
  verify: null,
  filter: "OPEN",
  query: "",
  theme: initialTheme(),
  role: initialRole(),
  loading: true,
  error: null,
  signedIn: false,
  lastAction: null,

  init: () => {
    const w = window as unknown as { DASH_CONFIG?: DashboardConfig };
    const config = w.DASH_CONFIG ?? null;
    set({ config, live: !!(config && config.apiUrl) });
    applyTheme(get().theme);
  },

  load: async () => {
    const { live, config } = get();
    set({ loading: true, error: null });
    if (!live) {
      set({ summary: SAMPLE_SUMMARY, findings: SAMPLE_FINDINGS, reports: SAMPLE_REPORTS, loading: false });
      return;
    }
    if (!config) return;
    if (!getStoredToken()) { set({ loading: false, summary: null }); return; }
    try {
      const [summary, findings, reports] = await Promise.all([
        loadSummary(config), loadFindings(config), loadReports(config),
      ]);
      set({ summary, findings, reports, loading: false, signedIn: true });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : "Load failed." });
    }
  },

  runScan: async () => {
    const { live, config } = get();
    if (!live || !config) {
      set({ lastAction: "Sample mode — connect your account to run a live scan." });
      return;
    }
    try {
      await startScan(config);
      set({ lastAction: "Scan started. New results in about a minute." });
      setTimeout(() => get().load(), 60_000);
    } catch (err) {
      set({ lastAction: err instanceof Error ? err.message : "Scan failed." });
    }
  },

  verifyReports: async () => {
    const { live, config, reports } = get();
    if (live && config) {
      try { const r = await verifyApi(config); set({ verify: r }); }
      catch (err) { set({ lastAction: err instanceof Error ? err.message : "Verify failed." }); }
      return;
    }
    const result = await verifyChain(reports);
    set({ verify: result });
  },

  setFilter:  (filter)  => set({ filter }),
  setQuery:   (query)   => set({ query }),

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },

  setRole: (role) => {
    localStorage.setItem(ROLE_KEY, role);
    set({ role });
  },

  toggleTheme: () => {
    const cycle: Theme[] = ["glass-dark", "glass-light", "nature"];
    const next = cycle[(cycle.indexOf(get().theme) + 1) % cycle.length];
    get().setTheme(next);
  },

  setSignedIn:    (signedIn)    => set({ signedIn }),
  setLastAction:  (lastAction)  => set({ lastAction }),
}));
