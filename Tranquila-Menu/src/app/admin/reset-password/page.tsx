"use client";
import { useEffect, useState, type FormEvent } from "react";
import { notify } from "@/lib/notifications";
import AdminAuthFrame from "@/components/admin/AdminAuthFrame";

export default function ResetPasswordPage() {
  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("access_token") || "";
    const type = params.get("type");
    const authError = params.get("error_description");
    if (token && (!type || type === "recovery")) setAccessToken(token);
    else setError(authError || "This reset link is invalid or has expired. Request a new one.");
    setReady(true);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (password.length < 10) { setError("Use at least 10 characters for your new password."); return; }
    if (password !== confirmPassword) { setError("The passwords do not match."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update password.");
      notify.success("Password updated", "You can now sign in with your new password.");
      setSuccess(true); setPassword(""); setConfirmPassword(""); setAccessToken("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update password.");
    } finally { setBusy(false); }
  }

  return <AdminAuthFrame heading={success ? "Password updated" : "New password"} description={success ? "Your account is ready." : "Choose a new password for your staff account."}>
    {!ready && <p className="trq-auth-hint" role="status">Checking your link…</p>}
    {ready && success && <div className="trq-auth-form"><p className="trq-auth-success" role="status">Your password has been changed successfully.</p><a className="trq-auth-submit trq-auth-button-link" href="/admin">Return to sign in <span aria-hidden="true">→</span></a></div>}
    {ready && !success && accessToken && <form className="trq-auth-form" onSubmit={submit}>
      <div className="trq-auth-fields">
        <div className="trq-auth-field"><label htmlFor="reset-new">New password</label><input id="reset-new" type="password" autoComplete="new-password" minLength={10} maxLength={200} required disabled={busy} value={password} onChange={event=>setPassword(event.target.value)} placeholder="At least 10 characters"/></div>
        <div className="trq-auth-field"><label htmlFor="reset-confirm">Confirm password</label><input id="reset-confirm" type="password" autoComplete="new-password" minLength={10} maxLength={200} required disabled={busy} value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} placeholder="Re-enter password"/></div>
      </div>
      {error && <p className="trq-auth-error" role="alert">{error}</p>}
      <button className="trq-auth-submit" disabled={busy} type="submit"><span>{busy ? "Updating…" : "Update password"}</span>{busy ? <span className="trq-auth-spinner" aria-hidden="true"/> : <span aria-hidden="true">→</span>}</button>
    </form>}
    {ready && !accessToken && !success && <div className="trq-auth-form"><p className="trq-auth-error" role="alert">{error}</p><a className="trq-auth-submit trq-auth-button-link" href="/admin/forgot-password">Request another link <span aria-hidden="true">→</span></a></div>}
  </AdminAuthFrame>;
}
