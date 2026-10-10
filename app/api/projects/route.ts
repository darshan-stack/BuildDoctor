import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const schema = z.object({
  name: z.string().trim().min(2).max(80),
  fullName: z.string().trim().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Use the format owner/repository.").max(200),
  defaultBranch: z.string().trim().min(1).max(200).default("main"),
});

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, fullName: true, defaultBranch: true, createdAt: true, updatedAt: true, _count: { select: { runs: true } } },
  });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message ?? "Invalid project." }, { status: 400 });
  const secret = randomBytes(32).toString("hex");
  try {
    const project = await prisma.project.create({
      data: { ownerId: user.id, name: input.data.name, fullName: input.data.fullName, defaultBranch: input.data.defaultBranch, webhookSecret: secret },
      select: { id: true, name: true, fullName: true, defaultBranch: true, createdAt: true },
    });
    return NextResponse.json({ project, webhookSecret: secret, webhookUrl: new URL("/api/webhooks/github", request.url).toString() }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "This repository is already connected to your account." }, { status: 409 });
    }
    console.error("Create project failed", error);
    return NextResponse.json({ error: "Could not create project." }, { status: 500 });
  }
}