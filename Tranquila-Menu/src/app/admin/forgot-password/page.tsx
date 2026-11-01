"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/admin/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not request a reset link.");
      setMessage(data.message || "Check your inbox for a password reset link.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request a reset link.");
    } finally { setBusy(false); }
  }

  return <main className="admin-login"><form className="admin-login-card" onSubmit={submit}>
    <div className="admin-brand">T R A N Q U I L A <span>ROOM SERVICE CMS</span></div>
    <h1>Reset your password</h1>
    <p>Enter the email address linked to your staff account. We’ll send a secure reset link if the account exists.</p>
    <label>Staff email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {message && <p className="admin-success" role="status">{message}</p>}
    <button className="admin-primary" disabled={busy}>{busy ? "Sending link…" : "Send reset link"}</button>
    <a className="admin-auth-link" href="/admin">Back to staff sign in</a>
  </form></main>;
}
