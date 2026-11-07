"use client";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, ITEMS, findItem, isDrink, setCatalog, type CategoryId, type Item } from "@/lib/catalog";
import { brand } from "@/lib/config";
import { orderingStatus, type Hours } from "@/lib/hours";
import { gsap, motionReady, reducedMotion, ScrollTrigger } from "@/lib/motion";
import { naira, unitPrice } from "@/lib/pricing";
import { searchMenu } from "@/lib/menuSearch";
import type { Selection } from "@/lib/pricing";
import Card from "./Card";
import SearchResult from "./SearchResult";
import { searchPhotoIndex } from "@/lib/searchPhoto";
import CartSheet from "./CartSheet";
import ItemSheet from "./ItemSheet";
import Welcome from "./Welcome";
import { toast } from "./toastStore";
import { cart, useCart } from "./useCart";
import { IconArrowRight, IconBag, IconClose, IconSearch } from "./icons";
import type { Branch } from "@/lib/branches";

type Phase = "welcome" | "entering" | "menu";
const SEEN = "tranquila.in";

export default function MenuApp({ branch, hours: initialHours, serverNow }: { branch: Branch; hours: Hours; serverNow: string }) {
  const [hours, setHours] = useState<Hours>(initialHours);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [catalogBranch, setCatalogBranch] = useState<string | null>(null);
  useEffect(() => { fetch(`/api/menu?branch=${branch.id}`, { cache: "no-store" }).then(r => r.json()).then(data => { if (Array.isArray(data?.menu?.items) && Array.isArray(data?.menu?.categories)) { setCatalog(data.menu.items, data.menu.categories); cart.pruneInvalid(branch.id); setCatalogVersion(v => v + 1); } if (data?.settings) setHours({ open: data.settings.open, close: data.settings.close, paused: data.settings.paused }); setCatalogBranch(branch.id); }).catch(() => setCatalogBranch(branch.id)); }, [branch.id]);
  const [now, setNow] = useState(() => new Date(serverNow));
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  const status = orderingStatus(hours, now);
  const statusLine = status.open ? (hours.open === hours.close ? "Kitchen taking orders 24 hours" : `Kitchen open until ${hours.close}`) : hours.paused ? "Ordering is paused right now" : `Kitchen opens at ${hours.open}`;

  const lines = useCart(branch.id);
  const [phase, setPhase] = useState<Phase>("welcome");
  useLayoutEffect(() => { if (document.documentElement.classList.contains("skip-welcome")) setPhase("menu"); }, []);
  useEffect(() => {
    if (phase === "welcome") { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }
  }, [phase]);
  const enterMenu = () => { try { sessionStorage.setItem(SEEN, "1"); } catch { /* private mode */ } setPhase("menu"); };

  const [active, setActive] = useState<CategoryId>(CATEGORIES[0]?.id ?? "breakfast");
  const [query, setQuery] = useState("");
  const [item, setItem] = useState<Item | null>(null);
  const [openSelection, setOpenSelection] = useState<Selection>({});
  const [openPhoto, setOpenPhoto] = useState(0);

  const [cartOpen, setCartOpen] = useState(false);
  const historyKey = "hotelGuestOverlay";
  type GuestState = { branch: string; view: "item" | "cart" | "search"; itemId?: string; selection?: Selection; photo?: number; query?: string };
  const currentGuestState = (): GuestState | null => {
    const state = window.history.state as { hotelGuestOverlay?: GuestState } | null;
    return state?.hotelGuestOverlay?.branch === branch.id ? state.hotelGuestOverlay : null;
  };
  const showGuestState = (state: GuestState | null) => {
    setItem(state?.view === "item" ? findItem(state.itemId ?? "") ?? null : null);
    setOpenSelection(state?.selection ?? {});
    setOpenPhoto(state?.photo ?? 0);
    setCartOpen(state?.view === "cart");
    if (state?.view === "search") setQuery(state.query ?? "");
    else if (!state) setQuery("");
  };
  useEffect(() => {
    const onPop = () => showGuestState(currentGuestState());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [branch.id]);
  function pushGuest(state: GuestState) {
    window.history.pushState({ ...(window.history.state ?? {}), [historyKey]: state }, "", window.location.href);
    showGuestState(state);
  }
  function closeGuest() {
    if (currentGuestState()) window.history.back();
    else { setItem(null); setCartOpen(false); }
  }
  const openItem = (next: Item, selection: Selection = {}, photo = 0) =>
    pushGuest({ branch: branch.id, view: "item", itemId: next.id, selection, photo });
  const openCart = () => pushGuest({ branch: branch.id, view: "cart" });
  function searchChanged(text: string) {
    const current = currentGuestState();
    if (!text.trim() && current?.view === "search") { window.history.back(); return; }
    if (text.trim() && !current) pushGuest({ branch: branch.id, view: "search", query: text });
    else if (current?.view === "search") {
      window.history.replaceState({ ...(window.history.state ?? {}), [historyKey]: { ...current, query: text } }, "", window.location.href);
      setQuery(text);
    } else setQuery(text);
  }

  const main = useRef<HTMLElement>(null);
  const sections = useRef<Record<string, HTMLElement | null>>({});
  const rail = useRef<HTMLDivElement>(null);

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => { const it = findItem(l.itemId); return s + (it ? unitPrice(it, l.sel) * l.qty : 0); }, 0);
  const q = query.trim().toLowerCase();
  const results = useMemo(() => searchMenu(ITEMS, CATEGORIES, q), [q, catalogVersion]);
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

  if (catalogBranch !== branch.id) return <main className="menu-loading" aria-live="polite">Loading {branch.name} menu…</main>;

  const go = (id: CategoryId) => {
    setActive(id);
    const el = sections.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion() ? "instant" : "smooth", block: "start" });
  };

  const grid = (list: Item[]) => <ul className={`grid${list.length && isDrink(list[0]!.category) ? " grid-drinks" : ""}`}>{list.map((i) => <Card key={i.id} item={i} onOpen={(next) => openItem(next)} />)}</ul>;

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div id="app-root">
          <header className="masthead">
            <div className="brand">
              <img className="brand-mark" src="/images/mark.png" alt="" width={64} height={30} />
              <div><h1>{branch.name}</h1></div>
            </div>
            <div className="masthead-actions"><span className={`status ${status.open ? "on" : "off"}`}><i aria-hidden />{status.open ? "Open" : hours.paused ? "Paused" : "Closed"}</span></div>
          </header>

          <div className="toolbar">
            <div className="toolbar-in">
              <div className="toolbar-row">
                <label className="search"><span className="sr-only">Search the menu</span>
                  {query ? <button type="button" className="guest-search-back" aria-label="Back to full menu" onClick={() => searchChanged("")}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button> : <IconSearch width={18} height={18} />}
                  <input type="search" value={query} onChange={(e) => searchChanged(e.target.value)} placeholder="Search dishes, wines, drinks" enterKeyHint="search" />
                  {query && <button type="button" className="clear" onClick={() => searchChanged("")} aria-label="Clear search"><IconClose width={16} height={16} /></button>}
                </label>
                <button type="button" className="cart-btn" onClick={openCart} aria-label={count ? `View order, ${count} ${count === 1 ? "item" : "items"}, ${naira(total)}` : "View order"}>
                  <IconBag width={22} height={22} />
                  <AnimatePresence initial={false}>{count > 0 && <motion.b key="badge" className="cart-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}>{count}</motion.b>}</AnimatePresence>
                </button>
              </div>
              {!q && (
                <nav className="rail" ref={rail} aria-label="Menu sections">
                  {CATEGORIES.map((c) => (
                    <button key={c.id} type="button" data-chip={c.id} data-on={c.id === active ? "" : undefined} aria-current={c.id === active} onClick={() => go(c.id)}>
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
                  <p className="hb-script">TRANQUILA HOTELS & SUITES</p>
                  <h2>Food & drinks.<br /><em>At your convenience.</em></h2>
                  <p className="hb-sub">Order to your room or collect from the restaurant.</p>
                  <button type="button" className="hb-cta" onClick={() => go(CATEGORIES[0]!.id)}><span>Explore the menu</span><i><IconArrowRight width={18} height={18} /></i></button>
                </div>
                <img className="hb-img" src="/images/egusi.webp" alt="" width={360} height={360} />
              </section>
            )}
            {q ? (
              <section key="results" className="sec search-results-section">
                <h2 className="sec-title" data-title><span>{results.length ? "Results" : "Nothing found"}</span></h2>
                {results.length ? <ul className="search-results-list">{results.map((hit) => <SearchResult key={`${hit.item.id}:${hit.option?.groupId ?? "item"}:${hit.option?.optionId ?? "parent"}`} hit={hit} onOpen={() => openItem(hit.item, hit.selection, searchPhotoIndex(hit.item, hit.option, hit.label))} />)}</ul> : (
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
            <footer className="colophon">
              {branch.id === "tranquila-nest" ? <div className="colophon-nest"><img className="colophon-mark" src="/images/mark.png" alt="" width={64} height={30} /><strong>NEST KADO</strong></div> : <img className="colophon-mark" src="/images/logo.png" alt={brand.name} width={220} height={110} />}
              <p>All prices include 7.5% VAT.</p>
              <div className="contact-support"><strong>Need help with an order?</strong><a href={`https://wa.me/${branch.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp {branch.name}: +{branch.whatsapp}</a></div>
            </footer>
            <a className="guest-admin-link" href="/admin">Admin</a>
          </main>
        </div>

        {phase === "menu" && count > 0 && !item && !cartOpen && <button type="button" className="apple-floating-order" onClick={openCart} aria-label={`View order, ${count} items, ${naira(total)}`}><span className="apple-order-icon"><IconBag width={19} height={19}/></span><span className="apple-order-details"><strong>View your order</strong><small>{count} {count === 1 ? "item" : "items"}</small></span><strong className="apple-order-total">{naira(total)}</strong><IconArrowRight width={18} height={18}/></button>}
        <ItemSheet item={item} initialSelection={openSelection} initialPhotoIndex={openPhoto} branchId={branch.id} onClose={closeGuest} canOrder={status.open} onAdded={(n) => toast.show(`${n} added to your order`, undefined, 2000)} />
        <CartSheet open={cartOpen} branchId={branch.id} onClose={closeGuest} canOrder={status.open} closedReason={status.reason} />
        {phase !== "menu" && <Welcome branchId={branch.id} hotelName={branch.name} statusLine={statusLine} onStart={() => setPhase("entering")} onDone={enterMenu} />}
      </LayoutGroup>
    </MotionConfig>
  );
}
