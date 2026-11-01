"use client";
import { useEffect, useState } from "react";

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

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (password.length < 10) { setError("Use at least 10 characters for your new password."); return; }
    if (password !== confirmPassword) { setError("The passwords do not match."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update password.");
      setSuccess(true); setPassword(""); setConfirmPassword(""); setAccessToken("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update password.");
    } finally { setBusy(false); }
  }

  return <main className="admin-login"><form className="admin-login-card" onSubmit={submit}>
    <div className="admin-brand">T R A N Q U I L A <span>ROOM SERVICE CMS</span></div>
    <h1>Choose a new password</h1>
    {!ready && <p>Checking your secure reset link…</p>}
    {ready && success && <><p className="admin-success" role="status">Your password has been updated. You can now sign in with it.</p><a className="admin-primary admin-auth-button" href="/admin">Return to staff sign in</a></>}
    {ready && !success && accessToken && <>
      <p>Choose a new password for your staff account. Use at least 10 characters.</p>
      <label>New password<input type="password" autoComplete="new-password" minLength={10} maxLength={200} required value={password} onChange={event => setPassword(event.target.value)} /></label>
      <label>Confirm new password<input type="password" autoComplete="new-password" minLength={10} maxLength={200} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button className="admin-primary" disabled={busy}>{busy ? "Updating password…" : "Update password"}</button>
    </>}
    {ready && !accessToken && !success && <><p className="admin-error" role="alert">{error}</p><a className="admin-primary admin-auth-button" href="/admin/forgot-password">Request another reset link</a></>}
  </form></main>;
}
