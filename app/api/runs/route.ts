import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeLog, sanitizeLog } from "@/lib/analyzer";
import { buildReliabilityInsights } from "@/lib/incident-engine";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const createSchema = z.object({
  log: z.string().min(1).max(250_000),
  repository: z.string().trim().min(1).max(200).default("local/manual"),
  branch: z.string().trim().max(200).default("unknown"),
  commitSha: z.string().trim().max(64).optional(),
  workflowName: z.string().trim().max(200).default("Manual analysis"),
});

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const runs = await prisma.pipelineRun.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, repository: true, branch: true, commitSha: true, workflowName: true, status: true, durationMs: true, issueCount: true, createdAt: true },
    });
    return NextResponse.json({ runs });
  } catch (error) {
    console.error("List runs failed", error);
    return NextResponse.json({ error: "Could not load saved runs." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const input = createSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message ?? "Invalid run input." }, { status: 400 });

  const analysis = analyzeLog(input.data.log);
  try {
    // Compare against earlier findings for this user's same repository only.
    const previousIssues = await prisma.diagnosticIssue.findMany({
      where: { run: { ownerId: user.id, repository: input.data.repository } },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: { fingerprint: true },
    });
    const insights = buildReliabilityInsights(analysis.findings, previousIssues.map((issue) => issue.fingerprint));

    const run = await prisma.pipelineRun.create({
      data: {
        ownerId: user.id,
        repository: input.data.repository,
        branch: input.data.branch || "unknown",
        commitSha: input.data.commitSha || null,
        workflowName: input.data.workflowName,
        status: analysis.outcome,
        durationMs: analysis.durationMs,
        logText: sanitizeLog(input.data.log),
        issueCount: analysis.findings.length,
        issues: { create: analysis.findings.map((finding) => ({
          title: finding.title,
          severity: finding.severity,
          category: finding.category,
          file: finding.file,
          line: finding.line,
          evidence: finding.evidence,
          explanation: finding.explanation,
          fix: finding.fix,
          command: finding.command,
          confidence: finding.confidence,
          fingerprint: finding.fingerprint,
        })) },
      },
      include: { issues: true },
    });
    return NextResponse.json({ run, analysis, insights }, { status: 201 });
  } catch (error) {
    console.error("Save run failed", error);
    return NextResponse.json({ error: "Could not save this run. Verify the database schema is applied." }, { status: 500 });
  }
}
