import type { AuditSummary, Finding, SealedReport } from "../types";

// Realistic sample data that mirrors the seeded lab: a deliberately broken
// AWS account the auditor is tested against. Nothing here leaves the browser.
// The numbers are consistent: 31 resources checked, 6 open findings, 80.6%.
const now = Date.now();
const ago = (days: number) =>
  new Date(now - days * 86_400_000).toISOString().slice(0, 19) + "+00:00";

// Deterministic 64-hex-char hashes so the chain looks real and is stable.
export function hex(seed: number): string {
  let h = "";
  let x = (seed * 2654435761) >>> 0;
  for (let i = 0; i < 64; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    h += ((x >>> 24) & 15).toString(16);
  }
  return h;
}

export const SAMPLE_SUMMARY: AuditSummary = {
  reports: 12,
  account_id: "123456789012",
  region: "af-south-1",
  generated_at: ago(0.05),
  posture: {
    resources_checked: 31,
    open_findings: 6,
    score_pct: 80.6,
    previous_score_pct: 77.4,
  },
  open_by_severity: { CRITICAL: 0, HIGH: 4, MEDIUM: 2, LOW: 0 },
  rule_errors: {},
  mean_hours_to_resolve: 0.1,
  head_hash: hex(12),
};

export const SAMPLE_FINDINGS: Finding[] = [
  {
    rule_id: "R02",
    severity: "HIGH",
    status: "OPEN",
    resource_arn: "arn:aws:ec2:af-south-1:123456789012:security-group/sg-0a41c2e9",
    title: "Security group sg-0a41c2e9 exposes 22/SSH to the internet",
    remediation:
      "Restrict the source to known IP ranges, or use Systems Manager Session Manager instead of SSH.",
    first_seen: ago(12),
    last_seen: ago(0.05),
    evidence:
      '{"exposed": ["22/SSH"], "IpPermissions": [{"FromPort": 22, "IpProtocol": "tcp", "IpRanges": [{"CidrIp": "0.0.0.0/0"}], "ToPort": 22}]}',
  },
  {
    rule_id: "R02",
    severity: "HIGH",
    status: "OPEN",
    resource_arn: "arn:aws:ec2:af-south-1:123456789012:security-group/sg-07be19d4",
    title: "Security group sg-07be19d4 exposes 3389/RDP to the internet",
    remediation: "Restrict the source to known IP ranges.",
    first_seen: ago(12),
    last_seen: ago(0.05),
    evidence:
      '{"exposed": ["3389/RDP"], "IpPermissions": [{"FromPort": 3389, "IpProtocol": "tcp", "Ipv6Ranges": [{"CidrIpv6": "::/0"}], "ToPort": 3389}]}',
  },
  {
    rule_id: "R05",
    severity: "HIGH",
    status: "OPEN",
    resource_arn: "arn:aws:iam::123456789012:user/ccea-seed-console-no-mfa",
    title: "IAM user ccea-seed-console-no-mfa can sign in without MFA",
    remediation: "Assign an MFA device to this user, or remove their console password.",
    first_seen: ago(12),
    last_seen: ago(0.05),
    evidence:
      '{"HasConsolePassword": true, "MFADevices": [], "UserName": "ccea-seed-console-no-mfa"}',
  },
  {
    rule_id: "R07",
    severity: "HIGH",
    status: "OPEN",
    resource_arn: "arn:aws:cloudtrail:af-south-1:123456789012:account-setting/trail-logging",
    title: "No CloudTrail trail is logging in af-south-1",
    remediation: "Create a trail that logs management events (the first copy is free).",
    first_seen: ago(12),
    last_seen: ago(0.05),
    evidence: '{"logging": [], "trails_found": []}',
  },
  {
    rule_id: "R03",
    severity: "MEDIUM",
    status: "OPEN",
    resource_arn: "arn:aws:ec2:af-south-1:123456789012:volume/vol-0c93f1a2",
    title: "EBS volume vol-0c93f1a2 is not encrypted",
    remediation:
      "Snapshot the volume, copy the snapshot with encryption on, and create a new volume from it.",
    first_seen: ago(12),
    last_seen: ago(0.05),
    evidence:
      '{"Encrypted": false, "Size": 1, "State": "available", "VolumeId": "vol-0c93f1a2"}',
  },
  {
    rule_id: "R04",
    severity: "MEDIUM",
    status: "OPEN",
    resource_arn:
      "arn:aws:ec2:af-south-1:123456789012:account-setting/ebs-encryption-by-default",
    title: "EBS encryption by default is off in af-south-1",
    remediation: "Turn on EBS encryption by default for the region.",
    first_seen: ago(12),
    last_seen: ago(0.05),
    evidence: '{"EbsEncryptionByDefault": false}',
  },
  {
    rule_id: "R01",
    severity: "HIGH",
    status: "SUPPRESSED",
    resource_arn: "arn:aws:s3:::ccea-seed-123456789012-bad-waived",
    title: "Bucket ccea-seed-...-bad-waived does not fully block public access",
    remediation: "Accepted risk until 31 January 2027. Fix it or renew the waiver before then.",
    first_seen: ago(12),
    last_seen: ago(0.05),
    evidence:
      '{"PublicAccessBlockConfiguration": {}, "settings_off": ["BlockPublicAcls", "IgnorePublicAcls", "BlockPublicPolicy", "RestrictPublicBuckets"]}',
  },
  {
    rule_id: "R01",
    severity: "HIGH",
    status: "RESOLVED",
    resource_arn: "arn:aws:s3:::ccea-seed-123456789012-bad-autofix",
    title: "Bucket ccea-seed-...-bad-autofix does not fully block public access",
    remediation: "Fixed automatically by the fixer function, 41 seconds after detection.",
    first_seen: ago(1.2),
    last_seen: ago(1.2),
    resolved_at: ago(1.1),
    evidence:
      '{"PublicAccessBlockConfiguration": {}, "settings_off": ["BlockPublicAcls", "IgnorePublicAcls", "BlockPublicPolicy", "RestrictPublicBuckets"]}',
  },
];

// A rising posture trend across the 12 sealed daily reports.
const TREND = [61.3, 61.3, 64.5, 67.7, 67.7, 71.0, 74.2, 74.2, 77.4, 77.4, 77.4, 80.6];

export const SAMPLE_REPORTS: SealedReport[] = TREND.map((score, i) => ({
  sequence: i + 1,
  generated_at: ago(11 - i + 0.05),
  score_pct: score,
  open_findings: Math.round(31 * (1 - score / 100)),
  hash: hex(i + 1),
  previous_hash: i ? hex(i) : "0".repeat(64),
  html_url: null,
})).reverse(); // newest first, to match the API ordering
