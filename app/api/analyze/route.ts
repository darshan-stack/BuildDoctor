import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeLog } from "@/lib/analyzer";
import { buildReliabilityInsights } from "@/lib/incident-engine";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
const schema = z.object({
  log: z.string().min(1, "Paste a build log to analyze.").max(250_000, "Logs are limited to 250 KB per request."),
  previousFingerprints: z.array(z.string().max(200)).max(500).optional(),
});

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in to analyze build logs." }, { status: 401 });
  try {
    const input = schema.safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message ?? "Invalid log input." }, { status: 400 });
    const analysis = analyzeLog(input.data.log);
    const insights = buildReliabilityInsights(analysis.findings, input.data.previousFingerprints ?? []);
    return NextResponse.json({ analysis, insights });
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
}
