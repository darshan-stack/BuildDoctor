import test from "node:test";
import assert from "node:assert/strict";
import { analyzeLog, sanitizeLog } from "../lib/analyzer";

test("detects npm lockfile mismatch", () => {
  const result = analyzeLog("npm error `npm ci` can only install packages when package.json and package-lock.json are in sync.\nnpm error Missing: eslint@9.12.0 from lock file");
  assert.equal(result.findings[0]?.category, "dependencies");
  assert.match(result.findings[0]?.title ?? "", /lockfile/i);
  assert.ok(result.findings[0].confidence >= 90);
});

test("detects TypeScript compiler errors", () => {
  const result = analyzeLog("src/app.ts(12,4): error TS2322: Type 'string' is not assignable to type 'number'.");
  assert.ok(result.findings.some((finding) => finding.category === "typescript"));
});

test("detects Python test failures", () => {
  const result = analyzeLog("FAILED tests/test_api.py::test_create_user - AssertionError");
  assert.ok(result.findings.some((finding) => finding.category === "tests"));
});

test("reports unknown failure signatures without inventing a root cause", () => {
  const result = analyzeLog("custom_runner: FATAL: unexpected worker crash");
  assert.equal(result.findings[0]?.category, "unknown");
  assert.equal(result.findings[0]?.confidence, 42);
});

test("does not report failure when no failure signature exists", () => {
  const result = analyzeLog("Build completed successfully. All checks passed.");
  assert.equal(result.findings.length, 0);
  assert.equal(result.outcome, "passed");
});

test("redacts tokens and email addresses before persistence", () => {
  const sanitized = sanitizeLog("user@example.com token=super-secret-value ghp_abcdefghijklmnopqrstuvwxyz123456");
  assert.ok(!sanitized.includes("user@example.com"));
  assert.ok(!sanitized.includes("super-secret-value"));
  assert.ok(!sanitized.includes("ghp_abcdefghijklmnopqrstuvwxyz123456"));
  assert.match(sanitized, /\[REDACTED\]/);
});