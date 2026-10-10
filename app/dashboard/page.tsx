"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import {
  Activity, AlertCircle, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight,
  Bell, BookOpen, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Code2,
  Copy, FileText, GitBranch, Github, LayoutDashboard, LoaderCircle, LogOut,
  Plus, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Terminal, Trash2,
  Upload, X, Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type User = { id: string; name: string; email: string };
type Finding = { title: string; severity: string; category: string; file?: string; line?: number; evidence: string; explanation: string; fix: string; command?: string; confidence: number; fingerprint: string };
type Analysis = { summary: string; outcome: string; linesAnalyzed: number; findings: Finding[]; redactionsApplied: number; durationMs: number };
type Run = { id: string; repository: string; branch: string; commitSha?: string | null; workflowName: string; status: string; durationMs?: number | null; issueCount: number; createdAt: string };
type Project = { id: string; name: string; fullName: string; defaultBranch: string; createdAt: string; _count?: { runs: number } };
type Tab = "overview" | "analyze" | "runs" | "projects";

const SAMPLE_LOG = `$ npm ci
npm error code EUSAGE
npm error \`npm ci\` can only install packages when your package.json and package-lock.json are in sync.
npm error Missing: eslint@9.12.0 from lock file
npm error Clean install a project
Error: Process completed with exit code 1.
##[error]Process completed with exit code 1.`;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [log, setLog] = useState("");
  const [repository, setRepository] = useState("local/manual");
  const [branch, setBranch] = useState("main");
  const [workflowName, setWorkflowName] = useState("Manual analysis");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectRepo, setProjectRepo] = useState("");
  const [projectBranch, setProjectBranch] = useState("main");
  const [createdProject, setCreatedProject] = useState<{ project: Project; webhookSecret: string; webhookUrl: string } | null>(null);
  const [activeFinding, setActiveFinding] = useState(0);
  const [filter, setFilter] = useState("");

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) { router.replace("/login"); throw new Error("Please sign in again."); }
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }, [router]);

  const loadData = useCallback(async () => {
    const [me, runData, projectData] = await Promise.all([
      request("/api/auth/me"), request("/api/runs"), request("/api/projects")
    ]);
    setUser(me.user); setRuns(runData.runs || []); setProjects(projectData.projects || []);
  }, [request]);

  useEffect(() => {
    loadData().catch(e => setNotice(e.message || "Could not load workspace. Check database setup.")).finally(() => setLoading(false));
  }, [loadData]);

  async function analyze(event?: FormEvent) {
    event?.preventDefault();
    if (!log.trim()) { setNotice("Paste a build log or load the sample first."); return; }
    setBusy(true); setNotice(""); setAnalysis(null);
    try {
      const data = await request("/api/runs", { method: "POST", body: JSON.stringify({ log, repository, branch, workflowName }) });
      setAnalysis(data.analysis); setActiveFinding(0); setTab("analyze");
      await loadData();
      setNotice("Analysis complete and run saved to your workspace.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Analysis failed."); }
    finally { setBusy(false); }
  }

  async function uploadLog(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 250_000) { setNotice("Log files must be smaller than 250 KB."); return; }
    setLog(await file.text()); setNotice("Loaded " + file.name + ". Review the log and run analysis.");
    setTab("analyze");
  }

  async function createProject(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice(""); setCreatedProject(null);
    try {
      const data = await request("/api/projects", { method: "POST", body: JSON.stringify({ name: projectName, fullName: projectRepo, defaultBranch: projectBranch }) });
      setCreatedProject(data); setProjectName(""); setProjectRepo(""); setProjectBranch("main");
      await loadData(); setNotice("Project connected. Copy the webhook secret now; it is only shown once.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not create project."); }
    finally { setBusy(false); }
  }

  async function deleteRun(id: string) {
    if (!window.confirm("Delete this run and its diagnostic findings?")) return;
    try { await request("/api/runs/" + id, { method: "DELETE" }); setRuns(prev => prev.filter(run => run.id !== id)); setNotice("Run deleted."); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Delete failed."); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login");
  }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice("Copied to clipboard."); }
    catch { setNotice("Clipboard access was blocked by your browser."); }
  }

  const filteredRuns = runs.filter(run => [run.repository, run.workflowName, run.branch, run.status].join(" ").toLowerCase().includes(filter.toLowerCase()));
  const selectedFinding = analysis?.findings[activeFinding];
  const failedRuns = runs.filter(r => r.status === "failed").length;
  const issueTotal = runs.reduce((sum, run) => sum + run.issueCount, 0);

  if (loading) return <main className="workspace-loading"><LoaderCircle className="spin" size={25}/><span>Loading your workspace…</span></main>;

  return <main className="workspace-shell">
    <aside className="workspace-sidebar">
      <a className="brand workspace-brand" href="/"><span className="brand-mark"><Activity size={19}/></span><span>build<span className="brand-light">doctor</span><span className="brand-period">.</span></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <button className={`workspace-nav ${tab === "overview" ? "workspace-nav-active" : ""}`} onClick={()=>setTab("overview")}><LayoutDashboard size={17}/> Overview</button>
      <button className={`workspace-nav ${tab === "analyze" ? "workspace-nav-active" : ""}`} onClick={()=>setTab("analyze")}><Sparkles size={17}/> Analyze logs</button>
      <button className={`workspace-nav ${tab === "runs" ? "workspace-nav-active" : ""}`} onClick={()=>setTab("runs")}><GitBranch size={17}/> Pipeline runs <span className="workspace-nav-count">{runs.length}</span></button>
      <button className={`workspace-nav ${tab === "projects" ? "workspace-nav-active" : ""}`} onClick={()=>setTab("projects")}><Github size={17}/> Projects <span className="workspace-nav-count">{projects.length}</span></button>
      <div className="workspace-label workspace-label-spaced">RESOURCES</div>
      <a className="workspace-nav" href="https://github.com/darshan-stack/BuildDoctor" target="_blank" rel="noreferrer"><BookOpen size={17}/> Documentation <ArrowUpRight size={13}/></a>
      <a className="workspace-nav" href="/#faq"><CircleHelp size={17}/> Help & FAQ</a>
      <div className="workspace-side-bottom"><div className="workspace-plan"><span className="plan-icon"><Zap size={15}/></span><div><strong>Developer workspace</strong><small>Local analysis + GitHub Actions</small></div></div><div className="workspace-user"><span className="user-avatar">{user?.name?.slice(0,1).toUpperCase() || "D"}</span><div><strong>{user?.name || "Developer"}</strong><small>{user?.email}</small></div><button title="Sign out" aria-label="Sign out" onClick={logout}><LogOut size={15}/></button></div></div>
    </aside>

    <section className="workspace-main">
      <header className="workspace-topbar"><div className="workspace-breadcrumb">Workspace <span>/</span> <strong>{tab === "overview" ? "Overview" : tab === "analyze" ? "Log analyzer" : tab === "runs" ? "Pipeline runs" : "Projects"}</strong></div><div className="workspace-top-actions"><span className="workspace-live"><span/> System ready</span><button className="workspace-icon-button" onClick={()=>loadData().then(()=>setNotice("Workspace refreshed.")).catch(e=>setNotice(e.message))} title="Refresh data"><RefreshCw size={16}/></button><button className="workspace-new-run" onClick={()=>{setTab("analyze");setNotice("");}}> <Plus size={15}/> New analysis</button></div></header>
      {notice && <div className="workspace-notice" role="status"><span>{notice}</span><button onClick={()=>setNotice("")} aria-label="Dismiss"><X size={14}/></button></div>}

      {tab === "overview" && <div className="workspace-content">
        <div className="workspace-page-heading"><div><div className="workspace-eyebrow">YOUR CI/CD FIRST RESPONDER</div><h1>Good {new Date().getHours()<12?"morning":new Date().getHours()<18?"afternoon":"evening"}, {user?.name?.split(" ")[0] || "developer"}.</h1><p>Here's what's happening across your build diagnostics.</p></div><button className="workspace-primary" onClick={()=>{setTab("analyze");setLog("");}}><Plus size={16}/> Analyze a build</button></div>
        <div className="workspace-stats">
          <div className="workspace-stat"><div className="stat-top"><span>Total analyzed runs</span><span className="stat-symbol stat-symbol-green"><Activity size={17}/></span></div><strong>{runs.length}</strong><small>Saved to your workspace</small></div>
          <div className="workspace-stat"><div className="stat-top"><span>Failed runs</span><span className="stat-symbol stat-symbol-red"><AlertTriangle size={17}/></span></div><strong>{failedRuns}</strong><small>Runs with detected failure signatures</small></div>
          <div className="workspace-stat"><div className="stat-top"><span>Findings detected</span><span className="stat-symbol stat-symbol-purple"><Search size={17}/></span></div><strong>{issueTotal}</strong><small>Across saved pipeline runs</small></div>
          <div className="workspace-stat"><div className="stat-top"><span>Connected projects</span><span className="stat-symbol stat-symbol-blue"><Github size={17}/></span></div><strong>{projects.length}</strong><small>Repositories in this workspace</small></div>
        </div>
        <div className="workspace-overview-grid">
          <section className="workspace-panel"><div className="workspace-panel-heading"><div><h2>Recent pipeline runs</h2><p>Your latest saved diagnostics</p></div><button className="workspace-text-button" onClick={()=>setTab("runs")}>View all <ArrowRight size={14}/></button></div>
            {runs.length ? <div className="workspace-run-list">{runs.slice(0,6).map(run=><div className="workspace-run-row" key={run.id}><span className={`run-status-icon run-status-${run.status}`}>{run.status==="passed"?<Check size={14}/>:run.status==="failed"?<X size={14}/>:<AlertCircle size={14}/>}</span><div className="workspace-run-info"><Link className="workspace-run-link" href={"/dashboard/runs/" + run.id}>{run.workflowName}</Link><small>{run.repository} · {run.branch}</small></div><span className={`workspace-status workspace-status-${run.status}`}>{run.status}</span><span className="workspace-run-date">{new Date(run.createdAt).toLocaleDateString()}</span><button className="workspace-row-action" onClick={()=>deleteRun(run.id)} title="Delete run"><Trash2 size={14}/></button></div>)}</div> : <div className="workspace-empty"><span><Activity size={22}/></span><strong>No runs yet</strong><p>Analyze your first build log to see findings and history here.</p><button className="workspace-primary" onClick={()=>{setTab("analyze");setLog(SAMPLE_LOG);}}>Try a sample log <ArrowRight size={14}/></button></div>}
          </section>
          <section className="workspace-panel quick-panel"><div className="workspace-panel-heading"><div><h2>Quick start</h2><p>Get your first diagnosis</p></div><span className="quick-spark"><Sparkles size={17}/></span></div>
            <button className="quick-action" onClick={()=>{setTab("analyze");setLog(SAMPLE_LOG);setRepository("local/manual");setWorkflowName("npm ci sample");}}><span className="quick-action-icon"><Terminal size={17}/></span><span><strong>Run a sample analysis</strong><small>Try the built-in dependency failure log</small></span><ArrowRight size={15}/></button>
            <button className="quick-action" onClick={()=>setTab("projects")}><span className="quick-action-icon"><Github size={17}/></span><span><strong>Connect a GitHub repository</strong><small>Receive completed workflow events</small></span><ArrowRight size={15}/></button>
            <div className="workspace-tip"><ShieldCheck size={16}/><p><strong>Privacy note</strong><br/>Secrets and email-like values are redacted in the analyzer output. Avoid uploading production credentials.</p></div>
          </section>
        </div>
        <div className="workspace-disclaimer"><AlertCircle size={15}/> Diagnostics are rule-based hypotheses, not guaranteed root causes. Verify suggested fixes before applying them.</div>
      </div>}

      {tab === "analyze" && <div className="workspace-content">
        <div className="workspace-page-heading"><div><div className="workspace-eyebrow">LOG ANALYZER</div><h1>Find the signal in the noise.</h1><p>Paste a CI log or upload a text file to identify likely causes and practical next steps.</p></div><span className="workspace-demo-tag"><ShieldCheck size={14}/> Secret-aware processing</span></div>
        <form className="analyzer-form" onSubmit={analyze}>
          <div className="analyzer-metadata"><label>Repository<input value={repository} onChange={e=>setRepository(e.target.value)} placeholder="owner/repository or local/manual" maxLength={200}/></label><label>Branch<input value={branch} onChange={e=>setBranch(e.target.value)} placeholder="main" maxLength={200}/></label><label>Workflow name<input value={workflowName} onChange={e=>setWorkflowName(e.target.value)} placeholder="build-and-test" maxLength={200}/></label></div>
          <div className="log-editor-heading"><div><Terminal size={16}/><strong>Build output</strong><span>Maximum 250 KB</span></div><div className="log-editor-actions"><button type="button" className="workspace-text-button" onClick={()=>setLog(SAMPLE_LOG)}>Load sample</button><label className="workspace-upload-button"><Upload size={14}/> Upload .txt<input type="file" accept=".txt,.log,text/plain" onChange={uploadLog} hidden/></label><button type="button" className="workspace-text-button" onClick={()=>setLog("")}>Clear</button></div></div>
          <textarea className="log-textarea" value={log} onChange={e=>setLog(e.target.value)} placeholder={"Paste output from GitHub Actions, npm, TypeScript, pytest, Docker, or another CI tool…"} spellCheck={false} maxLength={250000}/>
          <div className="log-editor-footer"><span>{log.length.toLocaleString()} / 250,000 characters · {log ? log.split(/\r?\n/).length.toLocaleString() : "0"} lines</span><button className="workspace-primary" type="submit" disabled={busy || !log.trim()}>{busy?<LoaderCircle size={16} className="spin"/>:<Sparkles size={16}/>} {busy?"Analyzing…":"Analyze & save run"} <ArrowRight size={15}/></button></div>
        </form>
        {analysis && <section className="analysis-results">
          <div className="analysis-result-header"><div><div className="workspace-eyebrow">ANALYSIS COMPLETE · {analysis.durationMs} MS</div><h2>{analysis.findings.length ? analysis.findings.length + " likely issue" + (analysis.findings.length===1?"":"s") + " found" : "No known failure signature found"}</h2><p>{analysis.summary}</p></div><span className={`workspace-status workspace-status-${analysis.outcome}`}>{analysis.outcome}</span></div>
          <div className="analysis-result-meta"><span><FileText size={14}/> {analysis.linesAnalyzed.toLocaleString()} lines inspected</span><span><ShieldCheck size={14}/> {analysis.redactionsApplied} potential sensitive values redacted</span><span><Clock3 size={14}/> {analysis.durationMs} ms</span></div>
          {analysis.findings.length>0 && <div className="analysis-finding-layout"><div className="analysis-finding-list">{analysis.findings.map((finding,i)=><button key={finding.fingerprint+i} className={`analysis-finding-button ${activeFinding===i?"analysis-finding-active":""}`} onClick={()=>setActiveFinding(i)}><span className={`finding-severity-dot severity-dot-${finding.severity}`}/><span><strong>{finding.title}</strong><small>{finding.category}{finding.file ? " · "+finding.file : ""}</small></span><ArrowUpRight size={14}/></button>)}</div>
          {selectedFinding && <article className="analysis-finding-detail"><div className="finding-detail-top"><span className={`finding-severity-label severity-label-${selectedFinding.severity}`}>{selectedFinding.severity}</span><span className="finding-confidence">{selectedFinding.confidence}% rule confidence</span></div><h3>{selectedFinding.title}</h3><p>{selectedFinding.explanation}</p><div className="finding-evidence"><div><Terminal size={14}/> Matching log evidence</div><pre>{selectedFinding.evidence}</pre></div><div className="finding-fix"><div><Zap size={15}/><strong>Recommended next step</strong></div><p>{selectedFinding.fix}</p>{selectedFinding.command && <div className="finding-command"><code>{selectedFinding.command}</code><button onClick={()=>copy(selectedFinding.command!)} aria-label="Copy command"><Copy size={14}/></button></div>}</div></article>}</div>}
          {analysis.findings.length===0 && <div className="workspace-empty"><CheckCircle2 size={24}/><p>Try another log format or inspect the job's earliest error. No known signature is not the same as a guaranteed successful build.</p></div>}
        </section>}
      </div>}

      {tab === "runs" && <div className="workspace-content">
        <div className="workspace-page-heading"><div><div className="workspace-eyebrow">DIAGNOSTIC HISTORY</div><h1>Pipeline runs.</h1><p>Every saved manual analysis and processed GitHub workflow run.</p></div><button className="workspace-primary" onClick={()=>setTab("analyze")}><Plus size={15}/> New analysis</button></div>
        <div className="workspace-panel run-history-panel"><div className="history-toolbar"><div className="history-search"><Search size={16}/><input placeholder="Search repository, branch, workflow…" value={filter} onChange={e=>setFilter(e.target.value)}/></div><button className="workspace-icon-button" onClick={()=>loadData().then(()=>setNotice("Runs refreshed.")).catch(e=>setNotice(e.message))}><RefreshCw size={15}/></button></div>
          {filteredRuns.length ? <div className="history-table-wrap"><table className="history-table"><thead><tr><th>Workflow / repository</th><th>Status</th><th>Findings</th><th>Duration</th><th>Date</th><th></th></tr></thead><tbody>{filteredRuns.map(run=><tr key={run.id}><td><Link className="workspace-run-link" href={"/dashboard/runs/" + run.id}>{run.workflowName}</Link><small>{run.repository} · {run.branch}{run.commitSha?" · "+run.commitSha.slice(0,7):""}</small></td><td><span className={`workspace-status workspace-status-${run.status}`}>{run.status}</span></td><td>{run.issueCount}</td><td>{run.durationMs != null ? (run.durationMs/1000).toFixed(1)+"s" : "—"}</td><td>{new Date(run.createdAt).toLocaleString()}</td><td><button className="workspace-row-action" onClick={()=>deleteRun(run.id)} title="Delete run"><Trash2 size={14}/></button></td></tr>)}</tbody></table></div> : <div className="workspace-empty"><FileText size={25}/><strong>No matching runs</strong><p>Change the search or analyze a build log.</p></div>}
        </div>
      </div>}

      {tab === "projects" && <div className="workspace-content">
        <div className="workspace-page-heading"><div><div className="workspace-eyebrow">GITHUB INTEGRATION</div><h1>Connect your projects.</h1><p>Register repositories to receive GitHub Actions workflow completion events.</p></div><span className="workspace-demo-tag"><Github size={14}/> Webhook integration</span></div>
        {createdProject && <section className="webhook-secret-panel"><div className="secret-panel-head"><span><CheckCircle2 size={18}/></span><div><h2>Project connected</h2><p>Copy this secret now. It will not be shown again.</p></div></div><label>Webhook URL<div className="secret-copy-row"><code>{createdProject.webhookUrl}</code><button onClick={()=>copy(createdProject.webhookUrl)}><Copy size={14}/></button></div></label><label>Webhook secret<div className="secret-copy-row"><code>{createdProject.webhookSecret}</code><button onClick={()=>copy(createdProject.webhookSecret)}><Copy size={14}/></button></div></label><div className="webhook-steps"><strong>Configure GitHub</strong><ol><li>Open repository Settings → Webhooks → Add webhook.</li><li>Paste the webhook URL, choose <code>application/json</code>, and paste the secret.</li><li>Subscribe to the <code>workflow_run</code> event and save.</li><li>Set <code>GITHUB_TOKEN</code> on your server with Actions read access to fetch job logs.</li></ol></div><button className="workspace-text-button" onClick={()=>setCreatedProject(null)}>Dismiss secret panel</button></section>}
        <div className="projects-layout"><section className="workspace-panel projects-list-panel"><div className="workspace-panel-heading"><div><h2>Connected repositories</h2><p>Repositories linked to your workspace</p></div><span className="projects-count">{projects.length} total</span></div>
          {projects.length ? projects.map(project=><div className="project-row" key={project.id}><span className="project-repo-icon"><Github size={19}/></span><div><strong>{project.name}</strong><small>{project.fullName} · default branch: {project.defaultBranch}</small></div><span className="project-run-count">{project._count?.runs ?? 0} runs</span></div>) : <div className="workspace-empty"><Github size={25}/><strong>No repositories connected</strong><p>Add a repository to set up GitHub Actions webhooks.</p></div>}
        </section>
        <section className="workspace-panel project-create-panel"><div className="workspace-panel-heading"><div><h2>Add a repository</h2><p>Register a repo for webhook ingestion</p></div><Plus size={18}/></div><form onSubmit={createProject} className="project-create-form"><label>Project display name<input value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="My application" minLength={2} maxLength={80} required/></label><label>GitHub repository<input value={projectRepo} onChange={e=>setProjectRepo(e.target.value)} placeholder="owner/repository" pattern="[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+" required/></label><label>Default branch<input value={projectBranch} onChange={e=>setProjectBranch(e.target.value)} placeholder="main" maxLength={200} required/></label><button className="workspace-primary" disabled={busy} type="submit">{busy?<LoaderCircle size={15} className="spin"/>:<Github size={15}/>} Register repository <ArrowRight size={14}/></button><p className="project-form-note"><ShieldCheck size={14}/> This registers a webhook secret. GitHub token setup is a separate server configuration step.</p></form></section></div>
        <div className="workspace-disclaimer"><AlertCircle size={15}/> Webhook delivery requires a publicly reachable HTTPS deployment and a server-side <code>GITHUB_TOKEN</code>. Never put this token in client-side code.</div>
      </div>}
      <footer className="workspace-footer"><span>BuildDoctor <span>·</span> Diagnose with direction.</span><span><span className="footer-green-dot"/> {process.env.NODE_ENV === "production" ? "Production environment" : "Development workspace"}</span></footer>
    </section>
  </main>;
}