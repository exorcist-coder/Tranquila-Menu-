"use client";
import { useLayoutEffect, useRef } from "react";
import { brand } from "@/lib/config";
import { gsap, motionReady, reducedMotion } from "@/lib/motion";
import type { BranchId } from "@/lib/branches";
import { IconArrowRight } from "./icons";

/** First screen: the logo settles in, then the call to action. One sequence in, one out. */
export default function Welcome({ branchId, hotelName, statusLine, onStart, onDone }: { branchId: BranchId; hotelName: string; statusLine: string; onStart: () => void; onDone: () => void }) {
  const root = useRef<HTMLElement>(null);
  const exiting = useRef(false);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    motionReady();
    if (reducedMotion()) { gsap.set(el.querySelectorAll("[data-in]"), { opacity: 1, clearProps: "transform" }); return; }
    const ctx = gsap.context(() => {
      gsap.set(el.querySelectorAll("[data-in]"), { opacity: 0, y: 18 });
      gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.1 })
        .to(el.querySelector(".welcome-logo"), { opacity: 1, y: 0, duration: 1.3 }, 0)
        .to(el.querySelectorAll("[data-in]:not(.welcome-logo)"), { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, 0.5);
    }, el);
    return () => ctx.revert();
  }, []);

  function enter() {
    const el = root.current;
    if (!el || exiting.current) return;
    exiting.current = true;
    onStart();
    if (reducedMotion()) return onDone();
    const app = document.getElementById("app-root");
    const tl = gsap.timeline({ onComplete: onDone });
    tl.to(el.querySelector(".welcome-inner"), { y: 60, opacity: 0, duration: 0.6, ease: "power3.in" }, 0)
      .to(el, { yPercent: -100, duration: 0.95, ease: "power4.inOut" }, 0.1);
    if (app) tl.fromTo(app, { y: 80 }, { y: 0, duration: 0.95, ease: "power4.inOut", clearProps: "transform" }, 0.1);
  }

  return (
    <section ref={root} className="welcome" aria-label="Welcome">
      <div className="welcome-inner">
        {branchId === "tranquila-nest" ? (
          <div className="welcome-logo welcome-nest-brand" data-in>
            <img src="/images/mark.png" alt="" width={220} height={110} />
            <strong>NEST Abuja</strong>
          </div>
        ) : (
          <img className="welcome-logo" data-in src="/images/logo.png" alt={`${brand.name} Hotels and Suites`} width={900} height={450} />
        )}
        <p className="welcome-line" data-in>{hotelName}: food, wine and drinks, brought to your room or ready for collection.</p>
      </div>
      <div className="welcome-foot">
        <p className="welcome-status" data-in>{statusLine}</p>
        <button type="button" className="welcome-cta" data-in onClick={enter}>
          <span>View the menu</span>
          <span className="welcome-arrow"><IconArrowRight width={20} height={20} /></span>
        </button>
        <a className="welcome-change" href="/">Change hotel</a>
      </div>
    </section>
  );
}
