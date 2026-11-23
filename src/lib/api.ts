import type { AuditSummary, Finding, SealedReport, VerifyResult } from "../types";
import { clearToken, getStoredToken } from "./auth";

const authHeaders = (): Record<string, string> => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function api(config: { apiUrl: string }, path: string, method = "GET"): Promise<unknown> {
  const res = await fetch(config.apiUrl + path, { method, headers: authHeaders() });
  if (res.status === 401) {
    clearToken();
    throw new Error("Your session expired. Sign in again.");
  }
  if (!res.ok) throw new Error(`${method} ${path} failed (${res.status})`);
  return res.json();
}

export async function loadSummary(config: { apiUrl: string }): Promise<AuditSummary> {
  return (await api(config, "/summary")) as AuditSummary;
}

export async function loadFindings(config: { apiUrl: string }): Promise<Finding[]> {
  const data = (await api(config, "/findings")) as { findings: Finding[] };
  return data.findings;
}

export async function loadReports(config: { apiUrl: string }): Promise<SealedReport[]> {
  const data = (await api(config, "/reports")) as { reports: SealedReport[] };
  return data.reports;
}

export async function verifyApi(config: { apiUrl: string }): Promise<VerifyResult> {
  return (await api(config, "/verify")) as VerifyResult;
}

export async function startScan(config: { apiUrl: string }): Promise<void> {
  await api(config, "/scan", "POST");
}
