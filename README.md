# BuildDoctor

**Diagnose with direction.** BuildDoctor is a CI/CD diagnostics and engineering-reliability workspace. It turns build logs into evidence-backed hypotheses, prioritizes likely root-cause areas, and tracks recurring findings without executing risky remediation automatically.

## Current capabilities

- Authenticated developer workspace with per-user projects and run history
- Rule-based CI log analysis across dependencies, TypeScript, tests, environment, Docker, networking, permissions, resources, and build failures
- Heuristic secret redaction, request-size limits, evidence snippets, remediation guidance, and copyable commands
- Reliability insights: severity-weighted health score, grade, primary finding, category clusters, and recurring/new finding fingerprints
- Explicit human-approval boundary: analysis recommends; it never executes shell commands or applies patches
- PostgreSQL persistence with Prisma, signed HTTP-only sessions, and bcrypt password hashes
- GitHub Actions `workflow_run` webhook signature verification and server-side log retrieval
- Health endpoint, security headers, Docker Compose, CI workflow, and automated analyzer/insights tests

## Architecture

```text
GitHub Actions / Manual log input
              |
              v
     Auth + input validation
              |
              v
      Redaction / rule analyzer
              |
              v
  Evidence-backed diagnostic findings
              |
              v
 Reliability insights and correlation
 (score, severity, category, recurrence)
              |
              v
  Reviewable report + suggested next steps
              |
              v
   Human approval -> external change
   (not executed by BuildDoctor today)
```

## Stack

- Next.js App Router, React, TypeScript
- PostgreSQL + Prisma ORM
- Signed JWT session cookie + bcryptjs password hashing
- Zod request validation
- GitHub Actions webhook integration
- Node.js test runner via `tsx`

## Run locally

Requirements: Node.js 22, npm, and PostgreSQL 14+ (or Docker Compose).

```bash
git clone https://github.com/darshan-stack/BuildDoctor.git
cd BuildDoctor
npm ci
cp .env.example .env
```

Set `DATABASE_URL` and a unique `AUTH_SECRET` in `.env`. Generate a secret with:

```bash
openssl rand -base64 32
```

Then start the database (if using Compose), apply migrations, and run the app:

```bash
docker compose up -d db
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. The database must be reachable before registering or signing in.

## Docker Compose

1. Copy `.env.example` to `.env`.
2. Set a strong `AUTH_SECRET` and `POSTGRES_PASSWORD`; optionally configure `GITHUB_TOKEN`.
3. Run:

```bash
docker compose up --build
```

Use TLS at a reverse proxy and a secured/managed database for production. Never commit `.env` or paste secrets into logs.

## GitHub Actions webhook

See [docs/github-actions.md](docs/github-actions.md). Register a repository in the workspace, configure a GitHub webhook for the `workflow_run` event, and use the generated project secret. The server needs a GitHub token with appropriate Actions read access to retrieve logs. For a multi-tenant deployment, prefer a GitHub App installation-token flow over a shared personal token.

## Development and verification

```bash
npm run typecheck
npm test
npm run build
npm audit
```

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current session |
| POST | `/api/analyze` | Analyze a log and return reliability insights |
| GET / POST | `/api/runs` | List or analyze-and-save runs |
| GET / DELETE | `/api/runs/:id` | View or delete a run |
| GET / POST | `/api/projects` | List or register repositories |
| DELETE | `/api/projects/:id` | Remove a repository registration |
| POST | `/api/webhooks/github` | Receive signed GitHub workflow events |
| GET | `/api/health` | Database readiness check |

The analyze request accepts `log` and an optional `previousFingerprints` array. The response includes the existing `analysis` object plus `insights` with a score, grade, prioritized finding, category clusters, recurrence comparison, and recommended next steps.

## Important limitations

- The analyzer and reliability score are deterministic heuristics, not a trained ML model or statistically calibrated probability. A score is a triage signal, not an SLO or availability guarantee.
- Fingerprint recurrence is only as useful as the baseline supplied by the caller; historical fingerprints are not automatically queried by this endpoint yet.
- Recommendations are advisory. BuildDoctor does not execute commands, deploy code, open pull requests, or apply patches.
- Redaction is heuristic. Review logs before upload; do not intentionally submit credentials, private keys, regulated data, or customer secrets.
- GitHub integration requires a publicly reachable HTTPS deployment and server-side credentials; it is not connected until a webhook is configured.
- Password reset, email verification, OAuth, team roles, advanced abuse rate limiting, managed secret encryption, and production observability need further implementation and review.
- Run typecheck, tests, build, and dependency audit in your own environment before deploying. Passing CI does not replace a security review.

## License

No license file is included yet. Add a license before distributing or accepting external contributions under explicit terms.
