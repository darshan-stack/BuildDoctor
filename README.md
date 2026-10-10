# BuildDoctor

**Diagnose with direction.** BuildDoctor is a Next.js CI/CD diagnostics application that turns build logs into ranked, evidence-backed hypotheses and actionable next steps.

## Current capabilities

- Responsive marketing site and authenticated developer workspace
- Email/password registration and sign-in with bcrypt password hashes and signed, HTTP-only session cookies
- Rule-based log analysis for npm/pnpm dependency conflicts, TypeScript, lint, JavaScript/Python tests, missing environment variables, Docker, networking, permissions, memory failures, Python imports and unresolved modules
- Log upload/paste, evidence snippets, confidence labels, remediation guidance and copyable commands
- PostgreSQL persistence for users, projects, pipeline runs and diagnostic issues
- Searchable run history and individual diagnostic reports
- Repository registration and GitHub Actions `workflow_run` webhook signature verification
- Server-side GitHub Actions job-log retrieval using a private server token
- Heuristic redaction before logs are saved, request size caps, security headers and a health endpoint
- Analyzer tests, GitHub Actions CI, Docker and Docker Compose support

## Stack

- Next.js 15.5 (patched release line) App Router, React 19, TypeScript
- Custom responsive CSS and Lucide icons
- PostgreSQL + Prisma ORM
- Signed JWT session cookie + bcryptjs password hashing
- Zod request validation
- Node.js GitHub webhook handler

## Run locally

Requirements: Node.js 20+, npm, and PostgreSQL 14+.

```bash
git clone -b feat/nextjs-website https://github.com/darshan-stack/BuildDoctor.git
cd BuildDoctor
npm install
cp .env.example .env
```

Edit `.env` and set a real PostgreSQL URL and a random authentication secret:

```bash
# Generate a secret (paste the output into AUTH_SECRET in .env)
openssl rand -base64 32
```

Create the database named in `DATABASE_URL`, then run:

```bash
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and open the workspace. The database must be reachable before registering or signing in.

## Docker Compose

1. Copy `.env.example` to `.env`.
2. Set `AUTH_SECRET` to a strong random value in `.env`. Set `POSTGRES_PASSWORD` to a strong local database password. Optionally set `GITHUB_TOKEN`.
3. Start the app and PostgreSQL:

```bash
docker compose up --build
```

The container applies checked-in Prisma migrations on startup. The Compose file is a self-hosting starting point; configure TLS at a reverse proxy and use a managed/secured database for production.

## GitHub Actions webhook

See [docs/github-actions.md](docs/github-actions.md). In summary: register a repository from **Workspace → Projects**, copy the webhook URL and generated secret, configure a GitHub repository webhook for the `workflow_run` event, and set a server-side `GITHUB_TOKEN` with Actions read access. Use a GitHub App installation token rather than a shared personal token for a multi-tenant production deployment.

Health check: `GET /api/health`.

## Development commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm start
npm run db:migrate
npm run db:studio
```

The GitHub Actions workflow runs type checking, analyzer tests, and a production build.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current session |
| POST | `/api/analyze` | Analyze a log without saving a run |
| GET / POST | `/api/runs` | List or analyze-and-save runs |
| GET / DELETE | `/api/runs/:id` | View or delete a run |
| GET / POST | `/api/projects` | List or register repositories |
| DELETE | `/api/projects/:id` | Remove a repository registration |
| POST | `/api/webhooks/github` | Receive signed GitHub workflow events |
| GET | `/api/health` | Database readiness check |

All account, analysis, run, and project endpoints require a signed-in session except registration, login, health checks, and the signed webhook.

## Important limitations

- The analyzer is a deterministic signature/rule engine, not a trained machine-learning model. Its confidence is a rule score, not a statistically calibrated probability. Findings are hypotheses and must be reviewed.
- Redaction is heuristic. Review logs before upload and do not intentionally submit credentials, private keys, regulated data, or customer secrets.
- GitHub integration needs a publicly reachable HTTPS deployment and server-side GitHub credentials. It is not connected to a repository until a webhook is configured.
- Password reset, email verification, team/organization roles, OAuth, billing, advanced abuse rate limiting, and managed secret encryption are not implemented in this initial release.
- For production, add rate limiting at the edge, email verification/password recovery, a GitHub App installation-token flow, monitoring/backups, secret encryption at rest, and a formal security review before accepting sensitive logs.

## License

No license file is included yet. Add a license before distributing or accepting external contributions under explicit terms.
