"use client";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, ITEMS, findItem, isDrink, setCatalog, type CategoryId, type Item } from "@/lib/catalog";
import { brand } from "@/lib/config";
import { orderingStatus, type Hours } from "@/lib/hours";
import { gsap, motionReady, reducedMotion, ScrollTrigger } from "@/lib/motion";
import { naira, unitPrice } from "@/lib/pricing";
import Card from "./Card";
import CartSheet from "./CartSheet";
import ItemSheet from "./ItemSheet";
import Toast from "./Toast";
import Welcome from "./Welcome";
import { toast } from "./toastStore";
import { cart, useCart } from "./useCart";
import { CatIcon, IconArrowRight, IconBag, IconClose, IconSearch } from "./icons";

type Phase = "welcome" | "entering" | "menu";
const SEEN = "amb.in";

export default function MenuApp({ hours: initialHours, serverNow }: { hours: Hours; whatsapp: string; serverNow: string }) {
  const [hours, setHours] = useState<Hours>(initialHours);
  const [catalogVersion, setCatalogVersion] = useState(0);
  useEffect(() => { fetch("/api/menu", { cache: "no-store" }).then(r => r.json()).then(data => { if (data?.menu?.items?.length) { setCatalog(data.menu.items, data.menu.categories); cart.pruneInvalid(); setCatalogVersion(v => v + 1); } if (data?.settings) setHours({ open: data.settings.open, close: data.settings.close, paused: data.settings.paused }); }).catch(() => {}); }, []);
  const [now, setNow] = useState(() => new Date(serverNow));
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  const status = orderingStatus(hours, now);
  const statusLine = status.open ? `Kitchen open until ${hours.close}` : hours.paused ? "Ordering is paused right now" : `Kitchen opens at ${hours.open}`;

  const lines = useCart();
  const [phase, setPhase] = useState<Phase>("welcome");
  useLayoutEffect(() => { if (document.documentElement.classList.contains("skip-welcome")) setPhase("menu"); }, []);
  useEffect(() => {
    if (phase === "welcome") { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }
  }, [phase]);
  const enterMenu = () => { try { sessionStorage.setItem(SEEN, "1"); } catch { /* private mode */ } setPhase("menu"); };

  const [active, setActive] = useState<CategoryId>(CATEGORIES[0]?.id ?? "breakfast");
  const [query, setQuery] = useState("");
  const [item, setItem] = useState<Item | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  const sections = useRef<Record<string, HTMLElement | null>>({});
  const rail = useRef<HTMLDivElement>(null);

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => { const it = findItem(l.itemId); return s + (it ? unitPrice(it, l.sel) * l.qty : 0); }, 0);
  const q = query.trim().toLowerCase();
  const results = useMemo(() => (q ? ITEMS.filter((i) => `${i.name} ${i.description}`.toLowerCase().includes(q)) : []), [q, catalogVersion]);
  const revealing = phase !== "welcome";

  /** Scroll-linked reveals: image curtains and title masks, once each. */
  useEffect(() => {
    const scope = main.current;
    if (!revealing || !scope) return;
    motionReady();
    const cards = gsap.utils.toArray<HTMLElement>("[data-reveal]", scope);
    const titles = gsap.utils.toArray<HTMLElement>("[data-title]", scope);
    if (reducedMotion()) { gsap.set([...cards, ...titles.flatMap((t) => Array.from(t.children))], { clipPath: "none", y: 0, opacity: 1 }); return; }
    const ctx = gsap.context(() => {
      ScrollTrigger.batch(cards, {
        start: "top 95%", once: true, interval: 0.08, batchMax: 6,
        onEnter: (els) => {
          gsap.to(els, { clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 1.1, ease: "expo.out", stagger: 0.09, overwrite: true });
          gsap.fromTo(els.map((e) => e.querySelector(".media > img, .media-mark")), { scale: 1.2 }, { scale: 1, duration: 1.5, ease: "power3.out", stagger: 0.09, overwrite: true });
        },
      });
      titles.forEach((t) => ScrollTrigger.create({ trigger: t, start: "top 92%", once: true, onEnter: () => { gsap.to(t.children, { y: 0, duration: 1, ease: "expo.out" }); } }));
    }, scope);
    return () => ctx.kill();
  }, [revealing, q]);

  /** Active section follows scroll. */
  useEffect(() => {
    if (q) return;
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.getAttribute("data-cat") as CategoryId);
    }, { rootMargin: "-150px 0px -65% 0px" });
    Object.values(sections.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [q]);

  useEffect(() => {
    const container = rail.current;
    const chip = container?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!container || !chip) return;
    const containerRect = container.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    container.scrollTo({
      left: container.scrollLeft + chipRect.left - containerRect.left - (container.clientWidth - chip.clientWidth) / 2,
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }, [active]);

  const go = (id: CategoryId) => {
    setActive(id);
    const el = sections.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion() ? "instant" : "smooth", block: "start" });
  };

  const grid = (list: Item[]) => <ul className={`grid${list.length && isDrink(list[0]!.category) ? " grid-drinks" : ""}`}>{list.map((i) => <Card key={i.id} item={i} onOpen={setItem} />)}</ul>;

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div id="app-root">
          <header className="masthead">
            <div className="brand">
              <img className="brand-mark" src="/brand/mark.png" alt="" width={64} height={30} />
              <div><h1>{brand.name}</h1><p>Hotels and Suites</p></div>
            </div>
            <span className={`status ${status.open ? "on" : "off"}`}><i aria-hidden />{status.open ? "Open" : hours.paused ? "Paused" : "Closed"}</span>
          </header>

          <div className="toolbar">
            <div className="toolbar-in">
              <div className="toolbar-row">
                <label className="search"><span className="sr-only">Search the menu</span>
                  <IconSearch width={18} height={18} />
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes, wines, drinks" enterKeyHint="search" />
                  {query && <button type="button" className="clear" onClick={() => setQuery("")} aria-label="Clear search"><IconClose width={16} height={16} /></button>}
                </label>
                <button type="button" className="cart-btn" onClick={() => setCartOpen(true)} aria-label={count ? `View order, ${count} ${count === 1 ? "item" : "items"}, ${naira(total)}` : "View order"}>
                  <IconBag width={22} height={22} />
                  <AnimatePresence initial={false}>{count > 0 && <motion.b key="badge" className="cart-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}>{count}</motion.b>}</AnimatePresence>
                </button>
              </div>
              {!q && (
                <nav className="rail" ref={rail} aria-label="Menu sections">
                  {CATEGORIES.map((c) => (
                    <button key={c.id} type="button" data-chip={c.id} data-on={c.id === active ? "" : undefined} aria-current={c.id === active} onClick={() => go(c.id)}>
                      <span className="rail-ico"><CatIcon id={c.id} width={24} height={24} /></span>
                      <span className="rail-lbl">{c.label}</span>
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </div>

          <main ref={main}>
            {!status.open && <p className="banner" role="status">{status.reason}</p>}
            {!q && (
              <section className="hero-banner" aria-label="Welcome">
                <div className="hb-copy">
                  <p className="hb-script">Calm, served well</p>
                  <h2>Good food.<br />Fine wine.<br /><em>Quiet moments.</em></h2>
                  <p className="hb-sub">Order to your room or collect from the restaurant.</p>
                  <button type="button" className="hb-cta" onClick={() => go(CATEGORIES[0]!.id)}><span>Explore the menu</span><i><IconArrowRight width={18} height={18} /></i></button>
                </div>
                <img className="hb-img" src="/menu/egusi.webp" alt="" width={360} height={360} />
              </section>
            )}
            {q ? (
              <section key="results" className="sec">
                <h2 className="sec-title" data-title><span>{results.length ? "Results" : "Nothing found"}</span></h2>
                {results.length ? grid(results) : (
                  <div className="none"><p>No dish matches “{query.trim()}”. Try a name or an ingredient.</p><button type="button" className="ghost" onClick={() => setQuery("")}>Clear search</button></div>
                )}
              </section>
            ) : (
              CATEGORIES.map((c) => (
                <section key={c.id} data-cat={c.id} ref={(el) => { sections.current[c.id] = el; }} className="sec">
                  <h2 className="sec-title" data-title><span>{c.label}</span></h2>
                  {grid(ITEMS.filter((i) => i.category === c.id))}
                </section>
              ))
            )}
            <footer className="colophon"><img className="colophon-mark" src="/brand/logo.png" alt={brand.name} width={220} height={110} /><p>All prices include 7.5% VAT.</p></footer>
            <a className="guest-admin-link" href="/admin">Admin</a>
          </main>
        </div>

        <ItemSheet item={item} onClose={() => setItem(null)} canOrder={status.open} onAdded={(n) => toast.show(`${n} added to your order`, undefined, 2200)} />
        <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} canOrder={status.open} closedReason={status.reason} />
        <Toast lifted={false} />
        {phase !== "menu" && <Welcome statusLine={statusLine} onStart={() => setPhase("entering")} onDone={enterMenu} />}
      </LayoutGroup>
    </MotionConfig>
  );
}
