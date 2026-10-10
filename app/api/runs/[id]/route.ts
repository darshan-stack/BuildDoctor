import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const run = await prisma.pipelineRun.findFirst({
    where: { id: id, ownerId: user.id },
    include: { issues: { orderBy: [{ confidence: "desc" }, { createdAt: "asc" }] } },
  });
  if (!run) return NextResponse.json({ error: "Run not found." }, { status: 404 });
  return NextResponse.json({ run });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const result = await prisma.pipelineRun.deleteMany({ where: { id: id, ownerId: user.id } });
  if (!result.count) return NextResponse.json({ error: "Run not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}