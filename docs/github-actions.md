# GitHub Actions integration

BuildDoctor accepts GitHub `workflow_run` webhooks for repositories registered in the Projects tab. It verifies GitHub's HMAC SHA-256 signature, fetches workflow job logs using a server-side token, runs the built-in diagnostic rules, and stores the run and findings under the account that registered the repository.

## Configure it

1. Deploy BuildDoctor to a publicly reachable HTTPS URL and configure PostgreSQL, `AUTH_SECRET`, and `GITHUB_TOKEN`.
2. Sign in to BuildDoctor and open **Projects → Add a repository**. Enter the repository as `owner/repository`.
3. Copy the webhook URL and secret shown after registration. The secret is displayed once.
4. In the GitHub repository, open **Settings → Webhooks → Add webhook**.
5. Set the Payload URL to the URL shown in BuildDoctor, content type to `application/json`, and Secret to the generated secret.
6. Select **Let me select individual events**, enable **Workflow runs**, and save.
7. Run a workflow. When it completes, GitHub sends an event and BuildDoctor fetches logs for failed jobs (or a small set of jobs when none failed).

## GitHub token permissions

Set `GITHUB_TOKEN` only in the server environment, never in a browser variable such as `NEXT_PUBLIC_GITHUB_TOKEN`. Use a fine-grained personal access token scoped to the intended repository with Actions read access. For private repositories, ensure the token can access workflow run and job log endpoints. Use a GitHub App installation token for a multi-tenant production deployment.

## Delivery and debugging

- Health endpoint: `GET /api/health`
- Webhook endpoint: `POST /api/webhooks/github`
- GitHub deliveries: repository **Settings → Webhooks → Recent Deliveries**.
- A `401` indicates the repository is not registered or the signature did not match.
- A `502` means log fetching or persistence failed; check server logs and token permissions.
- GitHub retries failed deliveries in some circumstances; BuildDoctor upserts a matching project/commit/workflow record to reduce duplicate runs.

## Security notes

Webhook secrets are stored in the application database so they can be used to verify HMAC signatures. Restrict database access and backups. Rotate a secret by removing and re-registering the project, then update the GitHub webhook. Logs are capped at 250 KB and common token, password, secret, and email-like patterns are redacted before storage, but redaction is heuristic and cannot guarantee removal of every sensitive value. Do not send logs that contain credentials or regulated data.
