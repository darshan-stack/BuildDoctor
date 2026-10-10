export type Severity = "critical" | "high" | "medium" | "low";
export type Category = "dependencies" | "typescript" | "lint" | "tests" | "environment" | "docker" | "network" | "permissions" | "resources" | "build" | "unknown";

export type Finding = {
  title: string;
  severity: Severity;
  category: Category;
  file?: string;
  line?: number;
  evidence: string;
  explanation: string;
  fix: string;
  command?: string;
  confidence: number;
  fingerprint: string;
};

export type Analysis = {
  summary: string;
  outcome: "failed" | "warning" | "passed";
  linesAnalyzed: number;
  findings: Finding[];
  redactionsApplied: number;
  durationMs: number;
};

const RULES: Array<{
  id: string; pattern: RegExp; title: string; severity: Severity; category: Category;
  explanation: string; fix: string; command?: string; confidence: number;
}> = [
  { id:"npm-lock", pattern:/npm ci.*(?:can only install|package\.json.*package-lock|sync)|Missing: .+ from lock file|package\.json and package-lock\.json are not in sync/i, title:"Dependency lockfile is out of sync", severity:"high", category:"dependencies", explanation:"The package manifest and lockfile disagree. Clean CI installs intentionally fail rather than silently changing dependency resolution.", fix:"Regenerate the lockfile with the same package manager and version used by CI, review the diff, and commit it.", command:"npm install && git add package-lock.json", confidence:97 },
  { id:"npm-not-found", pattern:/npm ERR! 404|ERR_PNPM_FETCH_404|No matching version found for|ETARGET/i, title:"Dependency version could not be resolved", severity:"high", category:"dependencies", explanation:"The requested package or version is unavailable from the configured registry. It may be misspelled, unpublished, or blocked by registry configuration.", fix:"Check the package name and published versions, then verify the registry URL and lockfile.", command:"npm view <package> versions --json", confidence:91 },
  { id:"peer-deps", pattern:/ERESOLVE unable to resolve dependency tree|Could not resolve dependency|peer dep(?:endency)? conflict/i, title:"Dependency tree conflict", severity:"high", category:"dependencies", explanation:"Two packages declare incompatible dependency or peer-dependency requirements.", fix:"Inspect the conflicting package versions and choose a compatible set. Avoid force-installing until the compatibility impact is understood.", command:"npm explain <package>", confidence:94 },
  { id:"typescript", pattern:/error TS\d{4}:|Type '.*' is not assignable to type|Property '.*' does not exist on type/i, title:"TypeScript type check failed", severity:"high", category:"typescript", explanation:"The compiler found a type mismatch or an invalid property access. The first reported TypeScript error is often the most actionable one.", fix:"Open the referenced file and line, correct the declared type or narrow the value before use, then rerun the type checker.", command:"npx tsc --noEmit", confidence:95 },
  { id:"eslint", pattern:/ESLint found too many warnings|\berror\s+\w+\s+\w+\s+\w+|\bno-unused-vars\b|\breact-hooks\/exhaustive-deps\b/i, title:"Lint rule failed", severity:"medium", category:"lint", explanation:"A lint rule reported a code-quality issue and may be configured to fail CI.", fix:"Resolve the reported rule at its source. If the rule is incorrect for this case, document a narrowly scoped exception.", command:"npm run lint -- --fix", confidence:78 },
  { id:"jest", pattern:/Test Suites: .* failed|FAIL\s+.+\.(?:test|spec)\.|AssertionError|Expected .* received|expect\(.*\)\.to/i, title:"Automated test failed", severity:"high", category:"tests", explanation:"A test assertion or test suite failed. Use the first failing test and its assertion output to identify the regression before investigating later failures.", fix:"Reproduce the failing test locally, compare expected and actual values, and check recent changes to the affected behavior.", command:"npm test -- --runInBand", confidence:88 },
  { id:"pytest", pattern:/FAILED\s+.+::|E\s+AssertionError|E\s+ImportError|short test summary info/i, title:"Python test failed", severity:"high", category:"tests", explanation:"Pytest reported a failing test, assertion, or import. The traceback usually points to the first application frame relevant to the failure.", fix:"Run the failing test alone, inspect the traceback and fixture setup, and verify the expected behavior.", command:"pytest -x -vv", confidence:91 },
  { id:"env-missing", pattern:/(?:Missing required environment variable|Environment variable .+ not set|process\.env\.[A-Z0-9_]+.*undefined|secret .+ not found)/i, title:"Required environment configuration is missing", severity:"high", category:"environment", explanation:"A required environment variable or secret is unavailable in this execution context.", fix:"Define the variable in the correct CI environment or secret store. Never paste secret values into logs or commit them to source control.", confidence:90 },
  { id:"docker", pattern:/Cannot connect to the Docker daemon|docker: command not found|failed to solve:|ERROR \[.*\] .*RUN|no space left on device/i, title:"Docker build or daemon failure", severity:"high", category:"docker", explanation:"The container build could not access the Docker daemon, resolve a build step, or write to the available filesystem.", fix:"Check runner Docker availability, inspect the earliest failed Dockerfile layer, and confirm disk space and build context.", command:"docker info && docker build --progress=plain .", confidence:87 },
  { id:"network", pattern:/ECONNRESET|ETIMEDOUT|ENOTFOUND|Temporary failure in name resolution|Could not resolve host|Connection timed out/i, title:"Network or registry connection failed", severity:"medium", category:"network", explanation:"A network request failed during DNS resolution, connection setup, or transfer. This may be transient or caused by registry/network configuration.", fix:"Verify the registry hostname and runner network access. Retry only if the operation is safe and the failure appears transient.", confidence:86 },
  { id:"permission", pattern:/EACCES: permission denied|Permission denied \(publickey\)|Error: EACCES|operation not permitted/i, title:"Permission or credentials problem", severity:"high", category:"permissions", explanation:"The process lacks permission to access a file, resource, or remote repository.", fix:"Check file ownership and the job's least-privilege permissions. For GitHub Actions, review the workflow permissions and configured credentials without printing secrets.", confidence:88 },
  { id:"oom", pattern:/JavaScript heap out of memory|fatal error:.*heap|OutOfMemoryError|Killed process .* out of memory|exit code 137/i, title:"Build process ran out of memory", severity:"high", category:"resources", explanation:"The process likely exceeded the available memory limit or was terminated by the operating system.", fix:"Inspect memory-heavy build/test steps, reduce concurrency or workload size, and only increase runner memory after confirming the resource bottleneck.", command:"NODE_OPTIONS=--max-old-space-size=4096 npm run build", confidence:84 },
  { id:"python-import", pattern:/ModuleNotFoundError: No module named|ImportError: cannot import name/i, title:"Python module import failed", severity:"high", category:"dependencies", explanation:"A Python import could not be resolved in the environment executing the build or test.", fix:"Confirm the correct virtual environment is active, declare the dependency, and verify the module name and package version.", command:"python -m pip install -r requirements.txt", confidence:92 },
  { id:"python-deps", pattern:/ResolutionImpossible|Could not find a version that satisfies the requirement|No matching distribution found/i, title:"Python dependency resolution failed", severity:"high", category:"dependencies", explanation:"pip could not find a compatible distribution for the requested requirement and current Python/platform constraints.", fix:"Check package spelling, supported Python versions, platform wheels, and pinned dependency constraints.", command:"python -m pip install -r requirements.txt", confidence:89 },
  { id:"vite-build", pattern:/Module not found: Can't resolve|Failed to compile|Could not resolve .* from/i, title:"Build could not resolve a module", severity:"high", category:"build", explanation:"The bundler could not locate an imported module or compile the application. Common causes include a typo, missing dependency, or case-sensitive path mismatch.", fix:"Verify the import path and capitalization, ensure the dependency is declared, and reproduce with the production build command.", command:"npm run build", confidence:87 },
];

const SECRET_PATTERNS: RegExp[] = [
  /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi,
  /((?:password|passwd|token|secret|api[_-]?key)\s*[=:]\s*)[^\s,;]+/gi,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
];

function redact(input: string): { text: string; count: number } {
  let text = input;
  let count = 0;
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, (match, prefix: string | undefined) => {
      count++;
      return prefix ? prefix + "[REDACTED]" : "[REDACTED]";
    });
  }
  return { text, count };
}

function fingerprint(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function getFileAndLine(line: string): { file?: string; line?: number } {
  const match = line.match(/((?:[A-Za-z]:)?[\w./\\-]+\.(?:tsx?|jsx?|py|go|java|rs|yml|yaml|json|sh))(?::(\d+))?/);
  return match ? { file: match[1], line: match[2] ? Number(match[2]) : undefined } : {};
}

export function sanitizeLog(raw: string): string {
  return redact(raw.slice(0, 250_000)).text;
}

export function analyzeLog(raw: string): Analysis {
  const started = Date.now();
  const redacted = redact(raw.slice(0, 250_000));
  const lines = redacted.text.split(/\r?\n/);
  const findings: Finding[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    for (const rule of RULES) {
      if (!rule.pattern.test(lines[i])) continue;
      const key = rule.id;
      if (seen.has(key)) break;
      seen.add(key);
      const contextStart = Math.max(0, i - 1);
      const evidence = lines.slice(contextStart, Math.min(lines.length, i + 2)).join("\n").trim().slice(0, 900);
      const location = getFileAndLine(lines[i]);
      findings.push({
        title: rule.title,
        severity: rule.severity,
        category: rule.category,
        ...location,
        evidence,
        explanation: rule.explanation,
        fix: rule.fix,
        command: rule.command,
        confidence: rule.confidence,
        fingerprint: fingerprint(rule.id + ":" + lines[i].replace(/\d+/g, "#").slice(0, 180)),
      });
      break;
    }
  }

  if (findings.length === 0 && /\b(error|failed|failure|fatal|exception|traceback)\b/i.test(redacted.text)) {
    const lineIndex = lines.findIndex((line) => /\b(error|failed|failure|fatal|exception|traceback)\b/i.test(line));
    const evidence = lines.slice(Math.max(0, lineIndex - 1), Math.min(lines.length, lineIndex + 3)).join("\n").slice(0, 900);
    findings.push({
      title: "Unclassified build failure",
      severity: "medium",
      category: "unknown",
      ...getFileAndLine(lines[lineIndex] || ""),
      evidence,
      explanation: "The log contains failure indicators, but no built-in signature confidently matches this pattern. Review the earliest error and the steps immediately before it.",
      fix: "Start with the first actionable error rather than the final exit code. Add the relevant tool and version details to improve diagnosis.",
      confidence: 42,
      fingerprint: fingerprint("unknown:" + evidence.slice(0, 180)),
    });
  }

  findings.sort((a, b) => {
    const rank: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return rank[b.severity] - rank[a.severity];
  });

  const summary = findings.length
    ? `Detected ${findings.length} likely issue${findings.length === 1 ? "" : "s"} from ${lines.length.toLocaleString()} log lines. Findings are rule-based hypotheses; verify them against the full run context.`
    : "No known failure signature was detected. The log may be successful, incomplete, or use a tool format that needs another analysis rule.";
  const outcome = findings.length ? "failed" : /\b(success|completed successfully|build passed)\b/i.test(redacted.text) ? "passed" : "warning";
  return { summary, outcome, linesAnalyzed: lines.length, findings, redactionsApplied: redacted.count, durationMs: Date.now() - started };
}