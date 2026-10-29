import type { Finding, Severity } from "@/lib/analyzer";

export type FindingCluster = {
  category: Finding["category"];
  count: number;
  highestSeverity: Severity;
  fingerprints: string[];
  titles: string[];
};

export type ReliabilityInsights = {
  score: number;
  grade: "healthy" | "degraded" | "at-risk" | "critical";
  headline: string;
  primaryCategory: Finding["category"] | null;
  primaryFinding: Finding | null;
  clusters: FindingCluster[];
  newFingerprints: string[];
  recurringFingerprints: string[];
  recommendedNextSteps: string[];
  executionPolicy: {
    mode: "recommend-only";
    automaticExecutionAllowed: false;
    reason: string;
  };
};

const severityWeight: Record<Severity, number> = { critical: 38, high: 22, medium: 10, low: 4 };
const severityRank: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 };
function unique<T>(values: T[]): T[] { return [...new Set(values)]; }

/** Deterministic reliability insights—not an ML probability or an automated fix executor. */
export function buildReliabilityInsights(findings: Finding[], previousFingerprints: string[] = []): ReliabilityInsights {
  const previous = new Set(previousFingerprints);
  const current = new Set(findings.map((finding) => finding.fingerprint));
  const newFingerprints = [...current].filter((fingerprint) => !previous.has(fingerprint));
  const recurringFingerprints = [...current].filter((fingerprint) => previous.has(fingerprint));
  const grouped = new Map<Finding["category"], Finding[]>();

  for (const finding of findings) {
    const group = grouped.get(finding.category) ?? [];
    group.push(finding);
    grouped.set(finding.category, group);
  }

  const clusters: FindingCluster[] = [...grouped.entries()].map(([category, items]) => ({
    category,
    count: items.length,
    highestSeverity: items.reduce((highest, item) => severityRank[item.severity] > severityRank[highest] ? item.severity : highest, "low" as Severity),
    fingerprints: unique(items.map((item) => item.fingerprint)),
    titles: unique(items.map((item) => item.title)).slice(0, 5),
  })).sort((a, b) => severityRank[b.highestSeverity] - severityRank[a.highestSeverity] || b.count - a.count);

  const penalty = findings.reduce((sum, finding) => sum + severityWeight[finding.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const grade: ReliabilityInsights["grade"] =
    findings.some((finding) => finding.severity === "critical") || score < 35 ? "critical" :
    score < 60 ? "at-risk" : score < 85 ? "degraded" : "healthy";

  const primaryFinding = [...findings].sort((a, b) =>
    severityRank[b.severity] - severityRank[a.severity] || b.confidence - a.confidence,
  )[0] ?? null;
  const primaryCategory = clusters[0]?.category ?? null;

  const recommendedNextSteps = primaryFinding ? [
    `Investigate “${primaryFinding.title}” first (${primaryFinding.severity}; rule confidence ${primaryFinding.confidence}/100).`,
    `Validate the evidence in the ${primaryFinding.category} category before changing code or infrastructure.`,
    recurringFingerprints.length
      ? `Prioritize ${recurringFingerprints.length} recurring finding fingerprint(s); verify whether an earlier fix was applied.`
      : "Record the baseline and rerun the pipeline after the first reviewed change.",
    "Run the narrowest relevant test or CI job, then run the full pipeline before merging.",
  ] : ["No rule-based findings were detected. Keep the passing pipeline as a baseline and monitor future runs."];

  return {
    score, grade,
    headline: findings.length ? `${findings.length} finding(s) detected; ${primaryFinding?.title ?? "review the report"} first.` : "No known failure signatures detected in the supplied log.",
    primaryCategory, primaryFinding, clusters, newFingerprints, recurringFingerprints, recommendedNextSteps,
    executionPolicy: {
      mode: "recommend-only",
      automaticExecutionAllowed: false,
      reason: "Commands and patches can have side effects. A human must review evidence and approve remediation; this engine never executes suggested commands.",
    },
  };
}
