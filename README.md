# Evidence Auditor Console

A premium cloud-control evidence auditor console. Every day it checks an AWS
account against seven security controls, keeps a tamper-evident evidence trail
an auditor can verify, and safely fixes one class of problem on its own.

This is the front-end of the **Cloud Control Evidence Auditor** — a reference
implementation of the evidence work South African financial institutions do
under [Joint Standard 2 of 2024](https://www.resbank.co.za/) on cybersecurity
and cyber resilience (in force since 1 June 2025). A big part of complying is
_proving_ that you comply, and that is what this tool demonstrates.

> Built by Khwezi Maphumulo · AWS re:Start graduate · Cloud Practitioner

---

## What makes it more than a list of problems

| Feature | Why it matters |
| --- | --- |
| **Finding lifecycle** | Every finding is OPEN, RESOLVED or SUPPRESSED, with first-seen and resolved times. Re-running a scan never creates duplicates, so you can report mean time to resolve. |
| **Tamper-evident evidence chain** | Each daily report is hashed with SHA-256 and stores the previous report's hash, like links in a chain. The console verifies the chain in the browser with the Web Crypto API, so you can prove no report was changed afterwards. |
| **Safe auto-remediation** | The auditor can only read. A separate, narrow fixer can do exactly one thing: turn on Block Public Access for a bucket tagged `auto-remediate=true`. (The console shows the result; the back-end does the fix.) |
| **Accepted-risk waivers** | Tag a resource `accepted-risk-until=2027-01-31` and its finding is SUPPRESSED until that date, then reopens automatically. |
| **Posture score & trends** | The percentage of checks passing and how it changed since the last scan, charted across the report history. |
| **Compliance mapping** | Maps the seven controls to the themes of Joint Standard 2 of 2024 and exports a printable evidence report. |

### The seven controls (all checked read-only, all free to run)

| Rule | What it catches | Severity |
| --- | --- | --- |
| R01 | S3 bucket without full Block Public Access | HIGH |
| R02 | Security group open to the internet on SSH (22) or RDP (3389) | HIGH |
| R03 | Unencrypted EBS volume | MEDIUM |
| R04 | EBS encryption by default switched off | MEDIUM |
| R05 | IAM user with a console password but no MFA | HIGH |
| R06 | Root user has access keys or no MFA | CRITICAL |
| R07 | No CloudTrail trail logging in the region | HIGH |

---

## The console

The console is built with **React + TypeScript + Vite**, with Framer Motion for
animation, Zustand for state, and React Router for navigation. It runs in two
modes:

- **Sample mode (default):** the console runs entirely on realistic sample data
  that mirrors the seeded lab. Nothing leaves the browser. This is what you see
  when you open the built site.
- **Live mode:** when `DASH_CONFIG` is set in `public/config.js`, the console
  talks to a deployed auditor API and signs people in with Amazon Cognito using
  the authorization-code flow with PKCE — no client secret, no stored keys.

### Views

- **Posture overview** — the signature constellation: a posture score ring with
  the seven controls arranged around it. Lit spokes have open findings; click a
  control to see them. Beside it, the evidence chain and the trend.
- **Every finding** — a sortable, filterable table with a detail drawer that
  shows the raw AWS API evidence and the exact remediation command.
- **Evidence chain** — the full visual hash-chain and the table of sealed
  reports with their SHA-256 hashes.
- **The seven controls** — one card per control with its status and rationale.
- **Compliance mapping** — the seven controls mapped to the Joint Standard 2 of
  2024 cybersecurity domains, with a downloadable evidence report.

### Keyboard

- `/` focus search · `Ctrl/⌘ K` command palette · `Esc` close · `↑ ↓ Enter` in palette

---

## Getting started

```bash
# install
npm install

# run the dev server (http://localhost:5173)
npm run dev

# type-check + production build (outputs to dist/)
npm run build

# preview the production build locally
npm run preview
```

The production build in `dist/` is a static site — drop it on S3 (or any static
host) and it works. Assets use relative paths so it runs at a domain root or a
sub-path.

### Connecting your own account (live mode)

Edit `public/config.js` and fill in `DASH_CONFIG`:

```js
window.DASH_CONFIG = {
  apiUrl: "https://abc123.execute-api.af-south-1.amazonaws.com",
  cognitoDomain: "https://your-app.auth.af-south-1.amazoncognito.com",
  clientId: "your-cognito-app-client-id",
  redirectUri: "https://your-bucket.s3.af-south-1.amazonaws.com/"
};
```

Leave it undefined to stay in sample mode.

---

## Project structure

```
evidence-auditor-console/
├── index.html
├── public/config.js            # sample/live mode switch
├── src/
│   ├── main.tsx                # entry
│   ├── App.tsx                 # shell, routing, shortcuts
│   ├── types.ts                # the data model
│   ├── data/
│   │   ├── rules.ts            # the seven controls + compliance mapping
│   │   └── sampleData.ts       # the seeded lab data
│   ├── lib/
│   │   ├── api.ts              # live-mode API client
│   │   ├── auth.ts             # Cognito + PKCE
│   │   ├── verify.ts           # SHA-256 chain verification (Web Crypto)
│   │   ├── export.ts           # CSV + compliance report export
│   │   ├── brief.ts            # the auditor's brief
│   │   └── helpers.ts          # dates, formatting, downloads
│   ├── store/
│   │   ├── useStore.ts         # data + actions (Zustand)
│   │   └── useUi.ts            # transient UI state (palette, drawer)
│   ├── components/
│   │   ├── common/             # Card, CommandPalette, Toast
│   │   ├── layout/             # Sidebar, CommandBar, PageHeader
│   │   ├── overview/           # constellation, trend, evidence chain
│   │   ├── findings/           # table, drawer
│   │   └── views/              # one per route
│   └── styles/globals.css      # the design system (dark + light)
└── README.md
```

---



Reference implementation · AWS Lambda, DynamoDB, S3, Cognito · MIT
