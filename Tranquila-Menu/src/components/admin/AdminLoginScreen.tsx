"use client";
import { useState, type FormEvent } from "react";
import type { BranchId } from "@/lib/branches";
import { AdminIcon } from "./AdminIcon";

export default function AdminLoginScreen({
  branchName, branchId, email, password, onEmail, onPassword, onSubmit, busy, loading, error
}: {
  branchName: string; branchId: BranchId; email: string; password: string;
  onEmail: (value: string) => void; onPassword: (value: string) => void;
  onSubmit: (event: FormEvent) => void; busy: boolean; loading: boolean; error: string;
}) {
  const [visible, setVisible] = useState(false);
  return <main className="pro-login pro-login-hybrid">
    <div className="pro-login-layout">
      <section className="pro-login-story" aria-label="Tranquila Hotels hospitality">
        <div className="pro-login-story-brand"><span className="pro-login-story-mark"><img src="/images/mark.png" alt=""/></span><div><strong>TRANQUILA</strong><span>HOTELS & SUITES</span></div></div>
        <div className="pro-login-story-copy"><span className="pro-hero-overline"><AdminIcon name="sparkle" size={17}/> CURATED HOSPITALITY</span><h1>A little more care, in every detail.</h1><p>A considered space to create, manage and perfect your hotel's dining experience.</p></div>
        <div className="pro-login-story-image"><img src="/images/okra-seafood.webp" alt="Beautifully presented hotel dining"/></div>
        <div className="pro-login-story-foot"><span>TRANQUILA · DINING MANAGEMENT</span><span>Made for thoughtful service</span></div>
      </section>
      <section className="pro-login-form-shell">
        <div className="pro-login-form-top"><a href={"/?branch=" + branchId} className="pro-login-return"><AdminIcon name="back" size={17}/> Return to guest menu</a><span className="pro-login-secure"><AdminIcon name="shield" size={15}/> Secure access</span></div>
        <div className="pro-login-form-wrap">
          <div className="pro-login-form-mark"><img src="/images/mark.png" alt="Tranquila"/></div>
          <span className="pro-eyebrow">HOTEL ADMINISTRATION</span><h2>Welcome back.</h2><p>Sign in to your dedicated {branchName} workspace.</p>
          <form className="pro-login-form" onSubmit={onSubmit}>
            <label>Work email<input required type="email" autoComplete="username" value={email} onChange={e => onEmail(e.target.value)} placeholder="name@tranquilahotels.com"/></label>
            <label>Password<div className="pro-login-password"><input required type={visible ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => onPassword(e.target.value)} placeholder="Enter your password"/><button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(v => !v)}><AdminIcon name="eye" size={18}/></button></div></label>
            <div className="pro-login-help"><a href="/admin/forgot-password">Forgot password?</a></div>
            {error && <div role="alert" className="pro-login-error"><span>!</span>{error}</div>}
            <button className="pro-btn primary pro-login-submit" disabled={busy || loading}>{busy ? "Signing you in…" : loading ? "Restoring your session…" : <>Access dashboard <AdminIcon name="arrow" size={18}/></>}</button>
          </form>
          <div className="pro-login-trust"><AdminIcon name="shield" size={17}/><span>Your hotel's menu and management data are kept separate and protected.</span></div>
        </div>
        <div className="pro-login-form-bottom"><span>© Tranquila Hotels & Suites</span><span>Made for excellence in hospitality.</span></div>
      </section>
    </div>
  </main>;
}
