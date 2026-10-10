"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Bug,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Code2,
  Command,
  GitBranch,
  Github,
  GitPullRequest,
  Layers3,
  Lightbulb,
  Menu,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingDown,
  Wrench,
  X,
  Zap,
} from "lucide-react";

type Diagnostic = {
  title: string;
  level: "Critical" | "Warning" | "Info";
  file: string;
  line: string;
  detail: string;
  fix: string;
};

const diagnostics: Diagnostic[] = [
  {
    title: "Dependency lockfile out of sync",
    level: "Critical",
    file: "package-lock.json",
    line: "npm ci · exit code 1",
    detail:
      "The package manifest changed, but the lockfile was not regenerated. npm ci refuses to install when the two disagree.",
    fix: "Run npm install, commit package-lock.json, and rerun the workflow.",
  },
  {
    title: "TypeScript build failed",
    level: "Warning",
    file: "src/components/DeployButton.tsx",
    line: "TS2322 · line 48",
    detail:
      "A prop is receiving a value that does not match the component's declared type. The mismatch blocks the production build.",
    fix: "Align the prop type with the value, or validate and narrow the value before passing it to the component.",
  },
  {
    title: "Environment variable missing",
    level: "Info",
    file: ".env.production",
    line: "Configuration check",
    detail:
      "The deployment step references a variable that is not defined in the selected environment.",
    fix: "Add the variable to your deployment environment and keep secret values in your CI secret store.",
  },
];

const features = [
  {
    icon: Search,
    title: "Root-cause analysis",
    description: "Cut through noisy logs to find the failure that actually broke the build.",
    number: "01",
  },
  {
    icon: Wrench,
    title: "Actionable fixes",
    description: "Get practical next steps with the relevant file, line, and command in context.",
    number: "02",
  },
  {
    icon: Activity,
    title: "Pipeline health",
    description: "Spot recurring failures, flaky steps, and slow stages before they pile up.",
    number: "03",
  },
  {
    icon: ShieldCheck,
    title: "Your logs, your control",
    description: "Review diagnostic output locally and keep credentials out of shared reports.",
    number: "04",
  },
];

const workflow = [
  { icon: GitBranch, title: "Connect a run", copy: "Bring in a failed GitHub Actions log or paste output directly." },
  { icon: Bug, title: "Find the cause", copy: "Group related errors and highlight the earliest actionable failure." },
  { icon: CheckCircle2, title: "Ship the fix", copy: "Follow a focused checklist, rerun checks, and get back to shipping." },
];

export default function Home() {
  const [activeIssue, setActiveIssue] = useState(0);
  const [logInput, setLogInput] = useState("");
  const [demoRan, setDemoRan] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState("");
  const selected = diagnostics[activeIssue];

  const logLines = useMemo(
    () => [
      { n: "01", text: "$ npm ci", kind: "command" },
      { n: "02", text: "npm error code EUSAGE", kind: "error" },
      { n: "03", text: "npm error `npm ci` can only install packages when your package.json", kind: "muted" },
      { n: "04", text: "npm error and package-lock.json are in sync.", kind: "muted" },
      { n: "05", text: "npm error Missing: eslint@9.12.0 from lock file", kind: "error" },
      { n: "06", text: "Error: Process completed with exit code 1.", kind: "error" },
    ],
    []
  );

  function runDemo() {
    setDemoRan(true);
    setActiveIssue(0);
    document.getElementById("diagnostics")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function handleSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      showToast("Enter a valid email address first.");
      return;
    }
    showToast("Thanks — the launch list is a demo right now.");
    setEmail("");
  }

  const nav = (
    <>
      <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
      <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it works</a>
      <a href="#diagnostics" onClick={() => setMobileOpen(false)}>Live demo</a>
      <a href="#faq" onClick={() => setMobileOpen(false)}>FAQ</a>
    </>
  );

  return (
    <main>
      <div className="announcement">
        <span className="announcement-pill"><Sparkles size={12} /> INTRODUCING BUILDDOCTOR</span>
        <span>Your build failed. Your day doesn’t have to. </span>
        <a href="#diagnostics">Explore the demo <ArrowRight size={13} /></a>
      </div>

      <header className="site-header">
        <a className="brand" href="#" aria-label="BuildDoctor home">
          <span className="brand-mark"><Activity size={21} strokeWidth={2.4} /></span>
          <span>build<span className="brand-light">doctor</span><span className="brand-period">.</span></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">{nav}</nav>
        <div className="header-actions">
          <a className="github-link" href="https://github.com/darshan-stack/BuildDoctor" target="_blank" rel="noreferrer">
            <Github size={17} /> <span>Star on GitHub</span>
          </a>
          <a className="button button-dark button-small" href="/login">Open workspace <ArrowUpRight size={15} /></a>
        </div>
        <button className="mobile-menu-button" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </header>
      {mobileOpen && <nav className="mobile-nav">{nav}<a href="#diagnostics" className="button button-dark" onClick={() => setMobileOpen(false)}>Try the demo <ArrowRight size={15} /></a></nav>}

      <section className="hero section-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR CI/CD FIRST RESPONDER</div>
          <h1>Stop guessing.<br />Start <span className="headline-highlight">shipping.</span></h1>
          <p className="hero-subtitle">BuildDoctor turns confusing CI/CD failures into clear diagnoses and actionable fixes — so your team spends less time debugging and more time building.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#diagnostics">Diagnose a build <ArrowRight size={17} /></a>
            <a className="button button-ghost" href="#how-it-works"><span className="play-icon"><Play size={12} fill="currentColor" /></span> See how it works</a>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true">
              <span>DV</span><span>CI</span><span>AI</span><span className="avatar-plus">+</span>
            </div>
            <div><strong>Built for people who build</strong><span>Developer-first · Open-source friendly</span></div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Preview of a BuildDoctor pipeline diagnosis">
          <div className="visual-glow" />
          <div className="terminal-card">
            <div className="terminal-topbar">
              <div className="window-dots"><i /><i /><i /></div>
              <span className="terminal-title"><Terminal size={14} /> build / production-deploy</span>
              <span className="run-id">#184</span>
            </div>
            <div className="pipeline-summary">
              <div className="pipeline-icon"><GitPullRequest size={18} /></div>
              <div className="pipeline-name"><strong>ci / build-and-test</strong><span>main · 2 min ago</span></div>
              <span className="status-failed"><span /> FAILED</span>
            </div>
            <div className="pipeline-stages">
              <div className="stage stage-ok"><Check size={13} /><span>Checkout</span><small>4s</small></div>
              <div className="stage stage-ok"><Check size={13} /><span>Lint</span><small>12s</small></div>
              <div className="stage stage-fail"><X size={13} /><span>Install</span><small>3s</small></div>
              <div className="stage stage-idle"><span className="stage-idle-dot" /><span>Build</span><small>—</small></div>
            </div>
            <div className="terminal-content">
              <div className="terminal-label"><span className="tiny-pulse" /> RAW LOG OUTPUT <span className="log-timestamp">14:32:08.412</span></div>
              {logLines.map((line) => (
                <div key={line.n} className={`log-line log-${line.kind}`}><span className="line-number">{line.n}</span><span>{line.text}</span></div>
              ))}
            </div>
            <div className="diagnosis-card">
              <div className="diagnosis-icon"><Sparkles size={16} /></div>
              <div className="diagnosis-content">
                <div className="diagnosis-kicker">BUILDDOCTOR DIAGNOSIS <span className="confidence">HIGH CONFIDENCE</span></div>
                <strong>Lockfile is out of sync</strong>
                <p>Regenerate your lockfile and commit the changes before rerunning CI.</p>
              </div>
              <div className="diagnosis-check"><Check size={15} /></div>
            </div>
            <div className="terminal-footer"><span><span className="footer-green-dot" /> Diagnosis ready</span><span>Analyzed in 1.8s</span></div>
          </div>
          <div className="floating-note note-top"><span className="note-icon note-green"><CheckCircle2 size={15} /></span><span><strong>Root cause found</strong><small>1 issue · 2 suggestions</small></span></div>
          <div className="floating-note note-bottom"><span className="note-icon note-orange"><Zap size={15} /></span><span><strong>Less log spelunking</strong><small>More time to ship</small></span></div>
        </div>
      </section>

      <section className="metrics-band">
        <div className="metrics-inner">
          <div className="metric-intro">MADE FOR THE MOMENT<br /><strong>THE BUILD TURNS RED.</strong></div>
          <div className="metric"><span className="metric-icon metric-red"><Bug size={18} /></span><div><strong>Find the cause</strong><small>Not just the failed step</small></div></div>
          <div className="metric"><span className="metric-icon metric-purple"><Lightbulb size={18} /></span><div><strong>Know what to do</strong><small>Practical fixes, not noise</small></div></div>
          <div className="metric"><span className="metric-icon metric-green"><TrendingDown size={18} /></span><div><strong>Get back to work</strong><small>Debug with direction</small></div></div>
        </div>
      </section>

      <section className="features-section section-wrap" id="features">
        <div className="section-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> BUILT FOR THE DEBUG LOOP</div>
          <h2>Less “why did CI fail?”<br /><span>More “already fixed.”</span></h2>
          <p>Build failures are inevitable. Losing an afternoon to one shouldn’t be.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, description, number }) => (
            <article className="feature-card" key={number}>
              <div className="feature-card-top"><span className="feature-icon"><Icon size={20} /></span><span className="feature-number">{number}</span></div>
              <h3>{title}</h3><p>{description}</p><a href="#diagnostics" aria-label={`Explore ${title}`} className="feature-link">Explore <ArrowUpRight size={15} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-section" id="diagnostics">
        <div className="section-wrap demo-wrap">
          <div className="demo-heading">
            <div className="eyebrow"><span className="eyebrow-dot" /> SEE THE SIGNAL IN THE NOISE</div>
            <h2>From red build<br />to <span>next steps.</span></h2>
            <p>Explore a sample failure, switch between diagnoses, and see the kind of clear guidance BuildDoctor is designed to surface.</p>
            <div className="demo-assurances"><span><CheckCircle2 size={16} /> Context, not just keywords</span><span><CheckCircle2 size={16} /> Fixes you can act on</span><span><CheckCircle2 size={16} /> No fake success metrics</span></div>
          </div>
          <div className="diagnostics-app">
            <div className="app-sidebar">
              <div className="app-brand"><span className="brand-mark brand-mark-small"><Activity size={16} /></span><strong>builddoctor</strong></div>
              <div className="sidebar-label">WORKSPACE</div>
              <div className="sidebar-item sidebar-active"><Layers3 size={16} /> Overview</div>
              <div className="sidebar-item"><GitBranch size={16} /> Pipeline runs <span className="sidebar-count">3</span></div>
              <div className="sidebar-item"><Activity size={16} /> Health</div>
              <div className="sidebar-label sidebar-label-spaced">TOOLS</div>
              <div className="sidebar-item"><BookOpen size={16} /> Knowledge base</div>
              <div className="sidebar-item"><Bell size={16} /> Alerts</div>
              <div className="sidebar-project"><span className="project-avatar">BD</span><span><strong>builddoctor-demo</strong><small>Free workspace</small></span><ChevronDown size={13} /></div>
            </div>
            <div className="app-main">
              <div className="app-topline"><div><span className="breadcrumb">Overview</span><span className="breadcrumb-slash">/</span><strong>Run #184</strong></div><span className="app-demo-badge">SAMPLE DATA</span></div>
              <div className="app-run-header">
                <div><div className="app-run-title"><span className="run-status-x"><X size={13} /></span><h3>build-and-test</h3><span className="failed-chip">Failed</span></div><p>Commit <code>3a9f2c1</code> on <code>main</code> · triggered by push</p></div>
                <button className="small-outline-button" onClick={runDemo}><Play size={13} /> {demoRan ? "Replay demo" : "Run analysis"}</button>
              </div>
              <div className="app-stats">
                <div><span>Duration</span><strong><Clock3 size={16} /> 1m 42s</strong><small><ArrowDownRight size={13} /> 18s vs. last run</small></div>
                <div><span>Jobs passed</span><strong>2 <em>/ 3</em></strong><small>1 job failed</small></div>
                <div><span>Issues detected</span><strong>03</strong><small>1 critical · 1 warning · 1 info</small></div>
              </div>
              <div className="app-content-grid">
                <div className="issues-panel">
                  <div className="panel-heading"><strong>Detected issues</strong><span>3 found</span></div>
                  {diagnostics.map((issue, i) => (
                    <button key={issue.title} className={`issue-row ${activeIssue === i ? "issue-row-active" : ""}`} onClick={() => setActiveIssue(i)}>
                      <span className={`issue-indicator issue-${issue.level.toLowerCase()}`} />
                      <span className="issue-text"><strong>{issue.title}</strong><small>{issue.file}</small></span>
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                </div>
                <div className="issue-detail">
                  <div className="issue-detail-top"><span className={`severity-label severity-${selected.level.toLowerCase()}`}>{selected.level}</span><span className="issue-ref">{selected.line}</span></div>
                  <h4>{selected.title}</h4>
                  <p>{selected.detail}</p>
                  <div className="suggested-fix"><div><Lightbulb size={15} /><strong>Suggested next step</strong></div><p>{selected.fix}</p></div>
                  <button className="copy-fix-button" onClick={() => showToast("Fix guidance selected. Copy it into your issue or workflow notes.")}><Code2 size={14} /> Use this guidance <ArrowRight size={13} /></button>
                </div>
              </div>
              <div className="app-footer"><span><span className="footer-green-dot" /> Analysis complete</span><span>Illustrative demo · Not a live CI connection</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="workflow-section section-wrap" id="how-it-works">
        <div className="section-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> THE WORKFLOW</div>
          <h2>Three steps. <span>Less chaos.</span></h2>
          <p>A simpler path from a failed run to a useful next action.</p>
        </div>
        <div className="workflow-grid">
          {workflow.map(({ icon: Icon, title, copy }, i) => (
            <article className="workflow-step" key={title}>
              <div className="workflow-top"><div className="workflow-icon"><Icon size={22} /></div><span>0{i + 1}</span></div>
              {i < workflow.length - 1 && <div className="workflow-connector"><ArrowRight size={16} /></div>}
              <h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
        <div className="terminal-command"><div><Command size={15} /><span>Want to explore the code?</span></div><code>git clone https://github.com/darshan-stack/BuildDoctor.git</code><a href="https://github.com/darshan-stack/BuildDoctor" target="_blank" rel="noreferrer" aria-label="Open BuildDoctor on GitHub"><ArrowUpRight size={17} /></a></div>
      </section>

      <section className="cta-section">
        <div className="cta-glow cta-glow-one" /><div className="cta-glow cta-glow-two" />
        <div className="cta-inner section-wrap">
          <div className="cta-icon"><Activity size={24} /></div>
          <div className="eyebrow cta-eyebrow"><span className="eyebrow-dot" /> YOUR NEXT GREEN BUILD STARTS HERE</div>
          <h2>Make failed builds<br />feel <span>less like detective work.</span></h2>
          <p>BuildDoctor is being built for developers who would rather solve the problem than search through pages of logs.</p>
          <div className="cta-actions"><a className="button button-white" href="https://github.com/darshan-stack/BuildDoctor" target="_blank" rel="noreferrer"><Github size={17} /> Explore on GitHub <ArrowUpRight size={16} /></a><a className="button button-outline-light" href="#diagnostics">Try the sample demo <ArrowRight size={15} /></a></div>
          <form className="notify-form" onSubmit={handleSubscribe}>
            <label htmlFor="notify-email">Want to follow the project?</label>
            <div className="notify-input-row"><input id="notify-email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} /><button type="submit">Keep me posted <ArrowRight size={14} /></button></div>
            <small>Demo form only — no email is sent or stored.</small>
          </form>
        </div>
      </section>

      <section className="faq-section section-wrap" id="faq">
        <div className="faq-intro"><div className="eyebrow"><span className="eyebrow-dot" /> GOOD QUESTIONS</div><h2>Before you<br /><span>hit rerun.</span></h2><p>A few things worth knowing about BuildDoctor.</p></div>
        <div className="faq-list">
          <details><summary>What is BuildDoctor? <ChevronDown size={17} /></summary><p>BuildDoctor is a developer-tool project designed to help diagnose CI/CD failures, explain likely root causes, and organize practical next steps.</p></details>
          <details><summary>Does it connect to my CI provider right now? <ChevronDown size={17} /></summary><p>This website currently contains a sample interactive diagnosis, not a live CI integration. GitHub Actions ingestion and backend analysis need to be implemented and configured separately.</p></details>
          <details><summary>Does it use AI? <ChevronDown size={17} /></summary><p>The interface is ready to present diagnostic results. A production AI analysis service is not implied by this static sample; it can be integrated behind a secure backend when implemented.</p></details>
          <details><summary>Are the dashboard metrics real? <ChevronDown size={17} /></summary><p>No. The run, duration, and issue counts are illustrative sample data for demonstrating the interface, and are labelled accordingly.</p></details>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-main section-wrap">
          <div className="footer-brand"><a className="brand" href="#"><span className="brand-mark"><Activity size={19} /></span><span>build<span className="brand-light">doctor</span><span className="brand-period">.</span></span></a><p>Less time decoding failures.<br />More time building what matters.</p></div>
          <div className="footer-links"><div><strong>Explore</strong><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#diagnostics">Live demo</a></div><div><strong>Project</strong><a href="https://github.com/darshan-stack/BuildDoctor" target="_blank" rel="noreferrer">GitHub repository <ArrowUpRight size={12} /></a><a href="#faq">FAQ</a></div></div>
        </div>
        <div className="footer-bottom section-wrap"><span>© {new Date().getFullYear()} BuildDoctor. Made for the people who ship.</span><span><span className="footer-green-dot" /> Sample environment</span></div>
      </footer>
      {toast && <div className="toast-message" role="status"><CircleHelp size={17} /> {toast}<button onClick={() => setToast("")} aria-label="Dismiss message"><X size={15} /></button></div>}
    </main>
  );
}