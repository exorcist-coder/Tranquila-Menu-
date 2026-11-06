"use client";
import { useState, type FormEvent } from "react";
import type { BranchId } from "@/lib/branches";
import AdminAuthFrame from "./AdminAuthFrame";

export default function AdminLoginScreen({
  branchName, email, password, onEmail, onPassword, onSubmit, busy, loading, error
}: {
  branchName: string; branchId: BranchId; email: string; password: string;
  onEmail: (value: string) => void; onPassword: (value: string) => void;
  onSubmit: (event: FormEvent) => void; busy: boolean; loading: boolean; error: string;
}) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [emailPulse, setEmailPulse] = useState(0);
  const [passwordPulse, setPasswordPulse] = useState(0);
  const locked = busy || loading;
  return (
    <AdminAuthFrame heading="Sign in" description={branchName}>
      <form className="trq-auth-form" onSubmit={onSubmit}>
        <div className="trq-auth-fields">
          <div className="trq-auth-field">
            <label htmlFor="trq-email">Email address</label>
            <input id="trq-email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false}
              value={email} onChange={e=>{onEmail(e.target.value);setEmailPulse(n=>n+1);}} placeholder="name@example.com" required disabled={locked}/>
            {email.length > 0 && <span key={emailPulse} className="trq-auth-input-activity" aria-hidden="true"/>}
          </div>
          <div className="trq-auth-field trq-auth-password">
            <label htmlFor="trq-password">Password</label>
            <div className="trq-auth-password-row">
              <input id="trq-password" type={visible ? "text" : "password"} autoComplete="current-password"
                value={password} onChange={e=>{onPassword(e.target.value);setPasswordPulse(n=>n+1);}} placeholder="Enter password" required disabled={locked}
                onKeyUp={e=>setCapsLock(e.getModifierState("CapsLock"))} onKeyDown={e=>setCapsLock(e.getModifierState("CapsLock"))}/>
              <button type="button" className="trq-auth-visibility" onClick={()=>setVisible(v=>!v)}
                aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} disabled={locked}>
                {visible ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3 21 21"/><path d="M10.7 5.1A10.7 10.7 0 0 1 12 5c5 0 8.5 4.1 10 7-0.5 1-1.2 2-2.2 3"/><path d="M6.3 6.3C4 7.6 2.6 10 2 12c1.5 2.9 5 7 10 7 1.5 0 2.9-.4 4.2-1"/><path d="M10 10a3 3 0 0 0 4 4"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {password.length > 0 && <span key={passwordPulse} className="trq-auth-input-activity" aria-hidden="true"/>}
          </div>
        </div>
        {capsLock && <p className="trq-auth-hint" role="status">Caps Lock is on</p>}
        {error && <p className="trq-auth-error" role="alert">{error}</p>}
        <button className="trq-auth-submit" data-ready={email.trim().length > 0 && password.length > 0} type="submit" disabled={locked} aria-busy={locked}>
          <span>{busy ? "Signing in…" : loading ? "Restoring session…" : "Continue"}</span>
          {locked ? <span className="trq-auth-spinner" aria-hidden="true"/> :
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>}
        </button>
        <a href="/admin/forgot-password" className="trq-auth-forgot">Forgot password?</a>
      </form>    </AdminAuthFrame>
  );
}
