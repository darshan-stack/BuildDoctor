"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, ArrowLeft, ArrowUpRight, CheckCircle2, Clock3, Copy, FileText, Github, LoaderCircle, Terminal, Trash2, Zap } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Issue = { id: string; title: string; severity: string; category: string; file?: string | null; line?: number | null; evidence: string; explanation: string; fix: string; command?: string | null; confidence: number };
type Run = { id: string; repository: string; workflowName: string; branch: string; commitSha?: string | null; status: string; durationMs?: number | null; issueCount: number; createdAt: string; logText: string; issues: Issue[] };

export default function RunDetailPage() {
  const params = useParams<{id:string}>();
  const router = useRouter();
  const [run,setRun] = useState<Run|null>(null);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(true);
  const [showLog,setShowLog] = useState(false);
  useEffect(()=>{
    fetch("/api/runs/"+params.id).then(async response=>{
      const data=await response.json();
      if(response.status===401){router.replace("/login");return;}
      if(!response.ok)throw new Error(data.error||"Could not load run.");
      setRun(data.run);
    }).catch(e=>setError(e instanceof Error?e.message:"Could not load run.")).finally(()=>setLoading(false));
  },[params.id,router]);
  async function copy(text:string){try{await navigator.clipboard.writeText(text);}catch{setError("Clipboard access was blocked by the browser.");}}
  async function remove(){if(!run||!window.confirm("Delete this run and all its findings?"))return;const res=await fetch("/api/runs/"+run.id,{method:"DELETE"});if(res.ok)router.replace("/dashboard");else setError("Could not delete this run.");}
  if(loading)return <main className="workspace-loading"><LoaderCircle className="spin" size={24}/>Loading diagnostic report…</main>;
  if(!run)return <main className="workspace-loading"><AlertCircle size={24}/><p>{error||"Run not found."}</p><Link className="workspace-primary" href="/dashboard">Back to workspace</Link></main>;
  return <main className="run-detail-page">
    <header className="run-detail-top"><Link className="brand" href="/"><span className="brand-mark"><Activity size={19}/></span><span>build<span className="brand-light">doctor</span><span className="brand-period">.</span></span></Link><Link className="run-detail-back" href="/dashboard"><ArrowLeft size={15}/> Back to workspace</Link></header>
    <div className="run-detail-content">
      <div className="run-detail-breadcrumb"><Link href="/dashboard">Workspace</Link><span>/</span><Link href="/dashboard">Pipeline runs</Link><span>/</span><strong>Report</strong></div>
      {error&&<div className="workspace-notice">{error}</div>}
      <section className="run-detail-heading"><div><div className="workspace-eyebrow">DIAGNOSTIC REPORT</div><h1>{run.workflowName}</h1><p><Github size={14}/>{run.repository}<span>·</span><Activity size={14}/>{run.branch}<span>·</span><Clock3 size={14}/>{new Date(run.createdAt).toLocaleString()}</p></div><span className={"workspace-status workspace-status-"+run.status}>{run.status}</span></section>
      <div className="run-detail-metrics"><div><span>Detected findings</span><strong>{run.issueCount}</strong></div><div><span>Run duration</span><strong>{run.durationMs!=null?(run.durationMs/1000).toFixed(1)+"s":"—"}</strong></div><div><span>Commit</span><strong className="run-detail-commit">{run.commitSha?run.commitSha.slice(0,10):"Manual run"}</strong></div></div>
      <section className="workspace-panel run-detail-findings"><div className="workspace-panel-heading"><div><h2>Findings & recommendations</h2><p>Rule-based hypotheses extracted from the saved log.</p></div><span className="projects-count">{run.issues.length} findings</span></div>
        {run.issues.length?run.issues.map(issue=><article className="run-detail-issue" key={issue.id}><div className="run-detail-issue-title"><span className={"finding-severity-label severity-label-"+issue.severity}>{issue.severity}</span><h3>{issue.title}</h3><span className="finding-confidence">{issue.confidence}% confidence</span></div><div className="run-detail-category">{issue.category}{issue.file?" · "+issue.file+(issue.line?":"+issue.line:""):""}</div><p>{issue.explanation}</p><div className="run-detail-evidence"><div><Terminal size={14}/> Log evidence</div><pre>{issue.evidence}</pre></div><div className="finding-fix"><div><Zap size={15}/><strong>Recommended next step</strong></div><p>{issue.fix}</p>{issue.command&&<div className="finding-command"><code>{issue.command}</code><button onClick={()=>copy(issue.command!)} aria-label="Copy command"><Copy size={14}/></button></div>}</div></article>):<div className="workspace-empty"><CheckCircle2 size={25}/><strong>No known failure signature found</strong><p>Review the original log and verify the run outcome; a missing signature is not proof that every step succeeded.</p></div>}
      </section>
      <section className="workspace-panel run-detail-raw"><button className="raw-log-toggle" onClick={()=>setShowLog(!showLog)}><span><FileText size={16}/><strong>Redacted log snapshot</strong></span><span>{showLog?"Hide log":"Show log"} <ArrowUpRight size={14}/></span></button>{showLog&&<><pre>{run.logText}</pre><div className="raw-log-actions"><span>Stored with common secrets and email-like values redacted.</span><button className="workspace-text-button" onClick={()=>copy(run.logText)}><Copy size={14}/> Copy log</button></div></>}</section>
      <div className="run-detail-bottom"><Link href="/dashboard" className="workspace-secondary"><ArrowLeft size={14}/> Back to runs</Link><button className="run-delete-button" onClick={remove}><Trash2 size={14}/> Delete run</button></div>
    </div>
  </main>;
}