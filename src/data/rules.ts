import type { ComplianceMapping, Rule } from "../types";

// The seven security controls the auditor checks. All read-only, all free to run.
export const RULES: Record<string, Rule> = {
  R01: {
    id: "R01",
    name: "S3 Block Public Access",
    why: "A public bucket is one of the most common causes of cloud data leaks.",
    severity: "HIGH",
  },
  R02: {
    id: "R02",
    name: "Admin ports closed to the internet",
    why: "SSH and RDP are scanned and attacked constantly; open to the world, one weak password is enough.",
    severity: "HIGH",
  },
  R03: {
    id: "R03",
    name: "EBS volumes encrypted",
    why: "Disks hold data at rest. Encryption protects it if a snapshot or volume is ever shared or exposed.",
    severity: "MEDIUM",
  },
  R04: {
    id: "R04",
    name: "Encryption by default",
    why: "Turns encryption on for every new disk automatically, so R03 problems can't start.",
    severity: "MEDIUM",
  },
  R05: {
    id: "R05",
    name: "MFA for console users",
    why: "Without MFA, a stolen or guessed password is all an attacker needs.",
    severity: "HIGH",
  },
  R06: {
    id: "R06",
    name: "Root user locked down",
    why: "The root user can do anything, including closing the account. It needs MFA and no access keys.",
    severity: "CRITICAL",
  },
  R07: {
    id: "R07",
    name: "Audit logging on",
    why: "Without CloudTrail there is no record of who did what, so incidents can't be investigated.",
    severity: "HIGH",
  },
};

export const RULE_IDS = Object.keys(RULES);

// Friendly, short names used in the auditor's brief and constellation labels.
export const SHORT_NAMES: Record<string, string> = {
  R01: "public storage",
  R02: "open admin ports",
  R03: "unencrypted disks",
  R04: "default encryption",
  R05: "console MFA",
  R06: "the root user",
  R07: "audit logging",
};

// Remediation command builders. Each takes a finding and returns the exact
// AWS CLI command an engineer would review and run. These are the same
// one-line fixes the reference auditor suggests.
export const FIX: Record<string, (f: { resource_arn: string; title: string }) => string> = {
  R01: (f) =>
    `aws s3api put-public-access-block --bucket ${f.resource_arn.split(":::")[1]} ` +
    `--public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true`,
  R02: (f) =>
    `aws ec2 revoke-security-group-ingress --group-id ${f.resource_arn.split("/").pop()} ` +
    `--ip-permissions '${
      f.title.includes("3389")
        ? "IpProtocol=tcp,FromPort=3389,ToPort=3389,Ipv6Ranges=[{CidrIpv6=::/0}]"
        : "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=0.0.0.0/0}]"
    }'`,
  R04: () => "aws ec2 enable-ebs-encryption-by-default",
  R05: (f) => `aws iam delete-login-profile --user-name ${f.resource_arn.split("/").pop()}`,
  R07: () =>
    "aws cloudtrail create-trail --name main-trail --s3-bucket-name <your-trail-bucket> && aws cloudtrail start-logging --name main-trail",
};

/* ----------------------------------------------------------------------------
 * Compliance mapping — Joint Standard 2 of 2024 on cybersecurity and cyber
 * resilience (issued by the Prudential Authority and the Financial Sector
 * Conduct Authority). Since 1 June 2025, banks and insurers in South Africa
 * must meet it, and a big part of complying is proving that you comply.
 *
 * This is a reference mapping: it shows how the seven controls demonstrate
 * the standard's themes. A real compliance team would map each control to the
 * exact clause text. It is illustrative, not legal advice.
 * -------------------------------------------------------------------------- */
export const COMPLIANCE_DOMAINS: ComplianceMapping[] = [
  {
    clauseId: "IA-1",
    clauseTitle: "Identity & access management",
    description:
      "Strong authentication and least-privilege access. Stolen credentials should never be enough on their own, and the most powerful identity in the account must be protected.",
    controls: ["R05", "R06"],
    note: "MFA for every console user, and the root user locked down with MFA and no access keys.",
  },
  {
    clauseId: "DS-1",
    clauseTitle: "Data security & encryption",
    description:
      "Protect data at rest so a snapshot, volume, or shared object that leaves the account cannot be read. Make encryption the default so the control can never lapse.",
    controls: ["R03", "R04"],
    note: "Existing EBS volumes encrypted, and encryption-by-default on so new disks are never created unencrypted.",
  },
  {
    clauseId: "NS-1",
    clauseTitle: "Network security",
    description:
      "Remote-access administration ports must not be reachable from the whole internet, where they are scanned and attacked constantly.",
    controls: ["R02"],
    note: "No security group exposing SSH (22) or RDP (3389) to 0.0.0.0/0 or ::/0.",
  },
  {
    clauseId: "AC-1",
    clauseTitle: "Asset & configuration management",
    description:
      "Storage must not be publicly exposed. Public object storage is a classic cause of cloud data leaks and a recurring finding in real breaches.",
    controls: ["R01"],
    note: "Every S3 bucket fully blocks public access at the bucket level.",
  },
  {
    clauseId: "AA-1",
    clauseTitle: "Audit & accountability",
    description:
      "A tamper-evident record of who did what, so incidents can be investigated and control evidence can be produced on request.",
    controls: ["R07"],
    note: "At least one CloudTrail trail logging management events in the region.",
  },
  {
    clauseId: "CM-1",
    clauseTitle: "Continuous monitoring & assurance",
    description:
      "Controls are checked on a schedule, findings are tracked over their lifecycle, and a sealed, hash-chained evidence trail lets an auditor verify the history was not changed.",
    controls: ["R01", "R02", "R03", "R04", "R05", "R06", "R07"],
    note: "All seven controls are checked daily, with a posture score, finding lifecycle and a SHA-256 evidence chain.",
  },
];

export const SEVERITY_RANK: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};
