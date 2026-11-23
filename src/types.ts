// The data model for the Evidence Auditor Console.
// These shapes mirror the auditor's API responses and the sample data.

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type FindingStatus = "OPEN" | "RESOLVED" | "SUPPRESSED";

export interface Finding {
  rule_id: string;
  severity: Severity;
  status: FindingStatus;
  resource_arn: string;
  title: string;
  remediation: string;
  first_seen: string;
  last_seen: string;
  resolved_at?: string;
  evidence: string; // raw JSON string from the AWS API
}

export interface SealedReport {
  sequence: number;
  generated_at: string;
  score_pct: number;
  open_findings: number;
  hash: string;
  previous_hash: string;
  html_url: string | null;
}

export interface PostureSummary {
  resources_checked: number;
  open_findings: number;
  score_pct: number;
  previous_score_pct: number | null;
}

export interface AuditSummary {
  reports: number;
  account_id: string;
  region: string;
  generated_at: string;
  posture: PostureSummary;
  open_by_severity: Record<Severity, number>;
  rule_errors: Record<string, string> | Record<string, never>;
  mean_hours_to_resolve: number | null;
  head_hash: string;
}

export interface VerifyResult {
  checked: number;
  intact: boolean;
  problems: string[];
}

export interface Rule {
  id: string;
  name: string;
  why: string;
  severity: Severity;
}

export interface ComplianceClause {
  id: string;
  title: string;
  description: string;
}

export interface ComplianceMapping {
  clauseId: string;
  clauseTitle: string;
  description: string;
  controls: string[]; // rule ids
  note: string;
}

export interface DashboardConfig {
  apiUrl: string;
  cognitoDomain: string;
  clientId: string;
  redirectUri: string;
}
