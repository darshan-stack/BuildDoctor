CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "defaultBranch" TEXT NOT NULL DEFAULT 'main',
  "webhookSecret" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PipelineRun" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "projectId" TEXT,
  "repository" TEXT NOT NULL,
  "workflowName" TEXT NOT NULL DEFAULT 'Manual analysis',
  "branch" TEXT NOT NULL DEFAULT 'unknown',
  "commitSha" TEXT,
  "status" TEXT NOT NULL DEFAULT 'failed',
  "durationMs" INTEGER,
  "logText" TEXT NOT NULL,
  "issueCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PipelineRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiagnosticIssue" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "file" TEXT,
  "line" INTEGER,
  "evidence" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "fix" TEXT NOT NULL,
  "command" TEXT,
  "confidence" INTEGER NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiagnosticIssue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Project_fullName_key" ON "Project"("fullName");
CREATE INDEX "Project_ownerId_updatedAt_idx" ON "Project"("ownerId", "updatedAt");
CREATE INDEX "PipelineRun_ownerId_createdAt_idx" ON "PipelineRun"("ownerId", "createdAt");
CREATE INDEX "PipelineRun_projectId_createdAt_idx" ON "PipelineRun"("projectId", "createdAt");
CREATE INDEX "DiagnosticIssue_runId_idx" ON "DiagnosticIssue"("runId");
CREATE INDEX "DiagnosticIssue_fingerprint_idx" ON "DiagnosticIssue"("fingerprint");

ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipelineRun" ADD CONSTRAINT "PipelineRun_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipelineRun" ADD CONSTRAINT "PipelineRun_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DiagnosticIssue" ADD CONSTRAINT "DiagnosticIssue_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
