import type { Finding, Severity } from "../types";

export const $ = (id: string) => document.getElementById(id);

/** Escape text for safe HTML interpolation. */
export function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

const SA_DATE = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
});

const SA_DATETIME = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const SA_DATETIME_YEAR = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const day = (t?: string) => (t ? SA_DATE.format(new Date(t)) : "");
export const when = (t?: string) => (t ? SA_DATETIME.format(new Date(t)) : "");
export const hhmm = when; // alias used in new components
export const whenFull = (t?: string) => (t ? SA_DATETIME_YEAR.format(new Date(t)) : "");

export const short = (h?: string) => (h ? `${h.slice(0, 8)}…${h.slice(-6)}` : "");

/** Title-case a single-word constant, e.g. "OPEN" -> "Open". */
export const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Relative time, e.g. "3 days ago". */
export function relative(t: string): string {
  const ms = Date.now() - new Date(t).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

/** A finding's unique key in the table. */
export const findingKey = (f: Finding) => `${f.resource_arn}|${f.rule_id}`;

/** Mean time to resolve, formatted for humans. */
export function mttr(hours: number | null): string {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 24) return `${hours} h`;
  return `${(hours / 24).toFixed(1)} days`;
}

/** Format a number with thousands separators. */
export const fmtNum = (n: number) => n.toLocaleString("en-ZA");

/** CSV-safe quoting. */
export function csvCell(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

/** Trigger a browser download of a text blob. */
export function downloadText(filename: string, text: string, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadHtml(filename: string, html: string) {
  downloadText(filename, html, "text/html");
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: "#ff5d6c",
  HIGH: "#ffb547",
  MEDIUM: "#5ea8ff",
  LOW: "#8a8aa0",
};

export const prefersReducedMotion =
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
