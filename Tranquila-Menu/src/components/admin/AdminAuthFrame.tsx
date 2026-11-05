import type { ReactNode } from "react";

/** Shared, accessible identity shell for sign-in and account recovery. */
export default function AdminAuthFrame({
  children, heading, description, status,
}: {
  children: ReactNode; heading: string; description: string; status?: ReactNode;
}) {
  return (
    <main className="trq-auth">
      <div className="trq-auth-ambient" aria-hidden="true"><span/><span/><span/></div>
      <nav className="trq-auth-nav" aria-label="Admin navigation">
        <a href="/" className="trq-auth-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>
          <span>Back to menu</span>
        </a>
        <span className="trq-auth-nav-brand">TRANQUILA <span>HOTELS &amp; SUITES</span></span>
      </nav>
      <div className="trq-auth-center">
        <section className="trq-auth-card" aria-labelledby="trq-auth-title">
          <div className="trq-auth-emblem" aria-hidden="true"><img src="/images/mark.png" alt="" width="57" height="57"/></div>
          <div className="trq-auth-heading">
            <p className="trq-auth-kicker">TRANQUILA HOTELS & SUITES</p>
            <h1 id="trq-auth-title">{heading}</h1>
            <p className="trq-auth-desc">{description}</p>
          </div>
          {children}
          {status && <div className="trq-auth-status">{status}</div>}
        </section>
      </div>
      <footer className="trq-auth-footer"><span>Tranquila Hotels & Suites</span><span>Private staff access</span></footer>
    </main>
  );
}
