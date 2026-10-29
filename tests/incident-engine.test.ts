import assert from "node:assert/strict";
import test from "node:test";
import type { Finding } from "../lib/analyzer";
import { buildReliabilityInsights } from "../lib/incident-engine";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    title: "TypeScript compilation failed", severity: "high", category: "typescript",
    evidence: "error TS2322", explanation: "A type mismatch was reported.",
    fix: "Correct the type mismatch and rerun the compiler.", confidence: 95,
    fingerprint: "typescript:TS2322", ...overrides,
  };
}

test("returns a healthy score and baseline guidance for an empty report", () => {
  const insights = buildReliabilityInsights([]);
  assert.equal(insights.score, 100);
  assert.equal(insights.grade, "healthy");
  assert.equal(insights.primaryFinding, null);
  assert.equal(insights.executionPolicy.automaticExecutionAllowed, false);
});

test("prioritizes severe findings and groups findings by category", () => {
  const insights = buildReliabilityInsights([
    finding(),
    finding({ title: "Container build failed", severity: "critical", category: "docker", fingerprint: "docker:build" }),
    finding({ title: "Another TypeScript error", fingerprint: "typescript:TS7006" }),
  ]);
  assert.equal(insights.grade, "critical");
  assert.equal(insights.primaryFinding?.category, "docker");
  assert.equal(insights.clusters[0]?.category, "docker");
  assert.equal(insights.clusters.find((cluster) => cluster.category === "typescript")?.count, 2);
});

test("detects new and recurring fingerprints without treating confidence as probability", () => {
  const insights = buildReliabilityInsights([
    finding(),
    finding({ title: "Dependency conflict", category: "dependencies", fingerprint: "npm:peer-conflict", severity: "medium" }),
  ], ["typescript:TS2322", "old:fingerprint"]);
  assert.deepEqual(insights.recurringFingerprints, ["typescript:TS2322"]);
  assert.deepEqual(insights.newFingerprints, ["npm:peer-conflict"]);
  assert.equal(insights.executionPolicy.mode, "recommend-only");
});
