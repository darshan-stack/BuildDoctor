"use client";

import { FormEvent, useState } from "react";
import { Activity, ArrowRight, Eye, EyeOff, Github, LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/" + mode, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed.");
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <div className="auth-top"><Link href="/" className="brand"><span className="brand-mark"><Activity size={20}/></span><span>build<span className="brand-light">doctor</span><span className="brand-period">.</span></span></Link><Link href="/" className="auth-back">Back to website ↗</Link></div>
    <section className="auth-card">
      <div className="auth-icon"><Activity size={23}/></div>
      <div className="auth-eyebrow">YOUR CI/CD FIRST RESPONDER</div>
      <h1>{mode === "login" ? "Welcome back." : "Build something better."}</h1>
      <p className="auth-subtitle">{mode === "login" ? "Sign in to review your pipeline health and saved diagnoses." : "Create your workspace and stop debugging in the dark."}</p>
      <div className="auth-switch"><button className={mode === "login" ? "selected" : ""} onClick={() => {setMode("login");setError("");}}>Sign in</button><button className={mode === "register" ? "selected" : ""} onClick={() => {setMode("register");setError("");}}>Create account</button></div>
      <form className="auth-form" onSubmit={submit}>
        {mode === "register" && <label>Full name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" minLength={2} maxLength={70} required/></label>}
        <label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" maxLength={254} required/></label>
        <label>Password <span className="password-label-note">{mode === "register" ? "10+ characters" : ""}</span><div className="password-field"><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode === "register" ? "Create a strong password" : "Enter your password"} minLength={mode === "register" ? 10 : 1} maxLength={128} required/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : null}{busy ? "Please wait…" : mode === "login" ? "Sign in to BuildDoctor" : "Create your account"}{!busy && <ArrowRight size={16}/>}</button>
      </form>
      <div className="auth-security"><ShieldCheck size={15}/><span>Password hashes are stored; session cookies are HTTP-only.</span></div>
      <p className="auth-terms">By continuing, use this workspace only with logs you are authorized to access. Never upload credentials or production secrets.</p>
    </section>
    <div className="auth-footer">Built for the people who ship. <a href="https://github.com/darshan-stack/BuildDoctor" target="_blank" rel="noreferrer"><Github size={14}/> Open source project</a></div>
  </main>;
}