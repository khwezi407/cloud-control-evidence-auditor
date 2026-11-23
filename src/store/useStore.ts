import { create } from "zustand";
import type {
  AuditSummary,
  DashboardConfig,
  Finding,
  SealedReport,
  VerifyResult,
} from "../types";
import { SAMPLE_FINDINGS, SAMPLE_REPORTS, SAMPLE_SUMMARY } from "../data/sampleData";
import {
  loadFindings,
  loadReports,
  loadSummary,
  startScan,
  verifyApi,
} from "../lib/api";
import { getStoredToken } from "../lib/auth";
import { verifyChain } from "../lib/verify";

type Filter = "OPEN" | "SUPPRESSED" | "RESOLVED" | "ALL";
type Theme = "dark" | "light";

interface State {
  // configuration / mode
  config: DashboardConfig | null;
  live: boolean;

  // data
  summary: AuditSummary | null;
  findings: Finding[];
  reports: SealedReport[];
  verify: VerifyResult | null;

  // ui state
  filter: Filter;
  query: string;
  theme: Theme;
  loading: boolean;
  error: string | null;
  signedIn: boolean;
  lastAction: string | null;

  // actions
  init: () => void;
  load: () => Promise<void>;
  runScan: () => Promise<void>;
  verifyReports: () => Promise<void>;
  setFilter: (f: Filter) => void;
  setQuery: (q: string) => void;
  toggleTheme: () => void;
  setSignedIn: (v: boolean) => void;
  setLastAction: (m: string | null) => void;
}

const THEME_KEY = "eac-theme";

function initialTheme(): Theme {
  const saved = typeof localStorage !== "undefined" ? localStorage.getItem(THEME_KEY) : null;
  return saved === "light" ? "light" : "dark";
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
  loading: true,
  error: null,
  signedIn: false,
  lastAction: null,

  init: () => {
    const w = window as unknown as { DASH_CONFIG?: DashboardConfig };
    const config = w.DASH_CONFIG ?? null;
    set({ config, live: !!(config && config.apiUrl) });
  },

  load: async () => {
    const { live, config } = get();
    set({ loading: true, error: null });
    if (!live) {
      // Sample mode: everything is local and instant.
      set({
        summary: SAMPLE_SUMMARY,
        findings: SAMPLE_FINDINGS,
        reports: SAMPLE_REPORTS,
        loading: false,
      });
      return;
    }
    if (!config) return;
    if (!getStoredToken()) {
      set({ loading: false, summary: null });
      return;
    }
    try {
      const [summary, findings, reports] = await Promise.all([
        loadSummary(config),
        loadFindings(config),
        loadReports(config),
      ]);
      set({ summary, findings, reports, loading: false, signedIn: true });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : "Load failed." });
    }
  },

  runScan: async () => {
    const { live, config } = get();
    if (!live || !config) {
      set({ lastAction: "Sample mode: with your account connected, this starts the auditor in the background." });
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
      try {
        const result = await verifyApi(config);
        set({ verify: result });
      } catch (err) {
        set({ lastAction: err instanceof Error ? err.message : "Verify failed." });
      }
      return;
    }
    // Sample mode: prove the chain locally with the Web Crypto API.
    const result = await verifyChain(reports);
    set({ verify: result });
  },

  setFilter: (filter) => set({ filter }),
  setQuery: (query) => set({ query }),

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.dataset.theme = next;
    set({ theme: next });
  },

  setSignedIn: (signedIn) => set({ signedIn }),
  setLastAction: (lastAction) => set({ lastAction }),
}));
