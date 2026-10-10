import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeLog } from "@/lib/analyzer";

export const runtime = "nodejs";
export const maxDuration = 60;

function validSignature(payload: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from("sha256=" + createHmac("sha256", secret).update(payload).digest("hex"));
  const actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function githubFetch(path: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not configured.");
  return fetch("https://api.github.com" + path, {
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    cache: "no-store",
    redirect: "follow",
  });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 1_000_000) return NextResponse.json({ error: "Webhook payload too large." }, { status: 413 });
  let payload: any;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const repoFullName = payload?.repository?.full_name;
  const runPayload = payload?.workflow_run;
  if (typeof repoFullName !== "string" || !runPayload) return NextResponse.json({ ignored: true, reason: "Not a workflow_run payload." });
  const project = await prisma.project.findFirst({ where: { fullName: repoFullName } });
  if (!project || !validSignature(raw, request.headers.get("x-hub-signature-256"), project.webhookSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature or unregistered repository." }, { status: 401 });
  }
  if (request.headers.get("x-github-event") !== "workflow_run" || payload.action !== "completed") {
    return NextResponse.json({ accepted: true, ignored: true });
  }

  const runId = Number(runPayload.id);
  if (!Number.isSafeInteger(runId) || runId <= 0) return NextResponse.json({ error: "Invalid workflow run ID." }, { status: 400 });

  try {
    const jobsResponse = await githubFetch("/repos/" + repoFullName + "/actions/runs/" + runId + "/jobs?per_page=100");
    if (!jobsResponse.ok) throw new Error("GitHub jobs API returned " + jobsResponse.status);
    const jobsData = await jobsResponse.json();
    const failedJobs = (jobsData.jobs ?? []).filter((job: any) => job.conclusion === "failure");
    const selectedJobs = failedJobs.length ? failedJobs : (jobsData.jobs ?? []).slice(0, 5);
    const logParts: string[] = [];
    for (const job of selectedJobs.slice(0, 10)) {
      try {
        const logResponse = await githubFetch("/repos/" + repoFullName + "/actions/jobs/" + job.id + "/logs");
        if (logResponse.ok) logParts.push("=== JOB: " + job.name + " (" + (job.conclusion ?? "unknown") + ") ===\n" + (await logResponse.text()).slice(0, 80_000));
        else logParts.push("=== JOB: " + job.name + " ===\nUnable to retrieve job logs (HTTP " + logResponse.status + ").");
      } catch { logParts.push("=== JOB: " + job.name + " ===\nUnable to retrieve job logs."); }
    }
    const rawLog = logParts.join("\n\n").slice(0, 250_000) || "Workflow completed with conclusion: " + (runPayload.conclusion ?? "unknown") + "; no job logs were available.";
    const analysis = analyzeLog(rawLog);
    const status = runPayload.conclusion === "success" ? "passed" : runPayload.conclusion === "cancelled" ? "cancelled" : analysis.findings.length ? "failed" : "warning";

    const existing = await prisma.pipelineRun.findFirst({ where: { projectId: project.id, commitSha: runPayload.head_sha ?? null, workflowName: runPayload.name ?? "GitHub Actions" } });
    const data = {
      ownerId: project.ownerId,
      projectId: project.id,
      repository: repoFullName,
      workflowName: String(runPayload.name ?? "GitHub Actions").slice(0, 200),
      branch: String(runPayload.head_branch ?? "unknown").slice(0, 200),
      commitSha: typeof runPayload.head_sha === "string" ? runPayload.head_sha.slice(0, 64) : null,
      status,
      durationMs: runPayload.run_started_at && runPayload.updated_at ? Math.max(0, new Date(runPayload.updated_at).getTime() - new Date(runPayload.run_started_at).getTime()) : null,
      logText: rawLog,
      issueCount: analysis.findings.length,
    };
    const issueData = analysis.findings.map((finding) => ({
      title: finding.title, severity: finding.severity, category: finding.category,
      file: finding.file, line: finding.line, evidence: finding.evidence,
      explanation: finding.explanation, fix: finding.fix, command: finding.command,
      confidence: finding.confidence, fingerprint: finding.fingerprint,
    }));
    const saved = existing
      ? await prisma.pipelineRun.update({ where: { id: existing.id }, data: { ...data, issues: { deleteMany: {}, create: issueData } }, select: { id: true, status: true, issueCount: true } })
      : await prisma.pipelineRun.create({ data: { ...data, issues: { create: issueData } }, select: { id: true, status: true, issueCount: true } });
    return NextResponse.json({ received: true, run: saved });
  } catch (error) {
    console.error("GitHub webhook processing failed", error);
    return NextResponse.json({ error: "Webhook accepted but processing failed. Check server logs and GitHub token permissions." }, { status: 502 });
  }
}