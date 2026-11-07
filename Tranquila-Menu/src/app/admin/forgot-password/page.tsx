"use client";
import { useState, type FormEvent } from "react";
import { notify } from "@/lib/notifications";
import AdminAuthFrame from "@/components/admin/AdminAuthFrame";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/admin/recover", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not request a reset link.");
      const text = data.message || "Check your inbox for a password reset link.";
      setMessage(text); notify.success("Check your inbox", text);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request a reset link.");
    } finally { setBusy(false); }
  }

  return <AdminAuthFrame heading="Reset password" description="Enter the email associated with your staff account.">
    <form className="trq-auth-form" onSubmit={submit}>
      <div className="trq-auth-fields"><div className="trq-auth-field">
        <label htmlFor="recovery-email">Email address</label>
        <input id="recovery-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
          placeholder="name@example.com" required disabled={busy} value={email} onChange={event=>setEmail(event.target.value)}/>
      </div></div>
      {error && <p className="trq-auth-error" role="alert">{error}</p>}
      {message && <p className="trq-auth-success" role="status">{message}</p>}
      <button className="trq-auth-submit" disabled={busy} type="submit">
        <span>{busy ? "Sending…" : "Send reset link"}</span>
        {busy ? <span className="trq-auth-spinner" aria-hidden="true"/> : <span aria-hidden="true">→</span>}
      </button>
      <a className="trq-auth-forgot" href="/admin">Back to sign in</a>
    </form>
    <p className="trq-auth-privacy">If the account exists, a reset email will be sent.</p>
  </AdminAuthFrame>;
}
