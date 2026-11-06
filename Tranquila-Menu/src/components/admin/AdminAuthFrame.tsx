import type { ReactNode } from "react";

/** Presentation only: existing authentication and recovery routes remain unchanged. */
export default function AdminAuthFrame({
  children, heading, description, status,
}: {
  children: ReactNode; heading: string; description?: string; status?: ReactNode;
}) {
  return (
    <main className="trq-auth" aria-label="Tranquila Hotels & Suites staff sign in">
      <div className="trq-auth-ambient" aria-hidden="true"><span/><span/><span/></div>
      <nav className="trq-auth-nav" aria-label="Navigation">
        <a href="/" className="trq-auth-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>
          <span>Menu</span>
        </a>
      </nav>
      <div className="trq-auth-center">
        <section className="trq-auth-card" aria-labelledby="trq-auth-title">
          <div className="trq-auth-emblem"><img src="/images/mark.png" alt="Tranquila Hotels & Suites" width="60" height="60"/></div>
          <div className="trq-auth-heading">
            <h1 id="trq-auth-title">{heading}</h1>
            {description && <p className="trq-auth-desc">{description}</p>}
          </div>
          {children}
          {status && <div className="trq-auth-status">{status}</div>}
        </section>
      </div>
    </main>
  );
}
