# BuildDoctor

A polished Next.js landing page and interactive sample dashboard for BuildDoctor — a developer tool concept for diagnosing CI/CD failures and turning build logs into actionable next steps.

## Stack

- Next.js 14 App Router
- React 18 + TypeScript
- Lucide React icons
- Responsive custom CSS

## Getting started

Requirements: Node.js 18.17+ and npm.

```bash
git clone https://github.com/darshan-stack/BuildDoctor.git
cd BuildDoctor
npm install
npm run dev
```

Open http://localhost:3000.

## What's included

- Responsive product landing page
- Pipeline status illustration
- Interactive issue selector with three sample diagnoses
- Sample dashboard with clearly marked illustrative data
- FAQ, project links, and demo notification form
- Accessible focus states and reduced-motion support

## Important implementation note

This initial version is a front-end prototype. The diagnosis examples, run metrics, and issue counts are static sample data; the UI does not connect to GitHub Actions or analyze uploaded logs yet. The notification form is also demo-only and does not store or send email. A production release needs a secured backend for log ingestion, analysis, authentication, persistence, and any provider integrations.

## Production build

```bash
npm run build
npm start
```

## Project

https://github.com/darshan-stack/BuildDoctor