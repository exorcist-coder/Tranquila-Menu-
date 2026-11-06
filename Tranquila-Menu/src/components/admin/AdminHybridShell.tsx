"use client";
import { useEffect, useState, type ReactNode } from "react";
import { AdminIcon, type AdminIconName } from "./AdminIcon";
import type { BranchId } from "@/lib/branches";

export type AdminSection = "overview" | "live" | "drafts" | "archive" | "history" | "categories" | "settings";
const sections: { id: AdminSection; label: string; icon: AdminIconName; group: "operate" | "manage" | "system" }[] = [
  { id: "overview", label: "Overview", icon: "overview", group: "operate" },
  { id: "live", label: "Live menu", icon: "menu", group: "operate" },
  { id: "drafts", label: "Draft library", icon: "draft", group: "operate" },
  { id: "archive", label: "Archive", icon: "archive", group: "manage" },
  { id: "history", label: "History & recovery", icon: "history", group: "manage" },
  { id: "categories", label: "Categories", icon: "categories", group: "manage" },
  { id: "settings", label: "Service settings", icon: "settings", group: "system" }
];
const title: Record<AdminSection, string> = {
  overview: "Overview",
  live: "Live menu",
  drafts: "Draft library",
  archive: "Archive",
  history: "History & recovery",
  categories: "Categories",
  settings: "Service settings"
};
const descriptions: Record<AdminSection, string> = {
  overview: "Your menu at a glance.",
  live: "Review and manage your published menu.",
  drafts: "Items saved for review before publishing.",
  archive: "Items removed from the live menu.",
  history: "Review previous changes and restore versions.",
  categories: "Manage the categories shown to guests.",
  settings: "Manage dining availability and ordering preferences."
};
export default function AdminHybridShell({
  tab, branchName, branchId, drafts, busy, onTab, onRefresh, onSignout, children
}: {
  tab: AdminSection; branchName: string; branchId: BranchId; drafts: number; busy: boolean;
  onTab: (tab: AdminSection) => void;
  onRefresh: () => void; onSignout: () => void;
  children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  useEffect(() => { if (!drawer) return; const handle = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); }; window.addEventListener("keydown", handle); return () => window.removeEventListener("keydown", handle); }, [drawer]);
  function go(id: AdminSection) { if (drawer) window.history.replaceState({ ...(window.history.state ?? {}), hotelDrawer: false }, "", window.location.href); onTab(id); setDrawer(false); }
  function openDrawer() {
    window.history.pushState({ ...(window.history.state ?? {}), hotelDrawer: true }, "", window.location.href);
    setDrawer(true);
  }
  function closeDrawer() {
    if ((window.history.state as {hotelDrawer?:boolean} | null)?.hotelDrawer) window.history.back();
    else setDrawer(false);
  }
  useEffect(() => {
    const onPop = () => setDrawer(!!(window.history.state as {hotelDrawer?:boolean} | null)?.hotelDrawer);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const branchLabel = branchId === "tranquila-nest" ? "Nest · Kado" : "Hotel · Mabushi";
  return <main className="pro-shell pro-hybrid">
    {drawer && <button type="button" aria-label="Close navigation" className="pro-drawer-backdrop" onClick={closeDrawer}/>}
    <aside className={"pro-side " + (drawer ? "pro-side-open" : "")}>
      <div className="pro-hybrid-brand">
        <div className="pro-hybrid-brand-mark"><img src="/images/mark.png" alt="" /></div>
        <div><strong>TRANQUILA</strong><small>HOTELS & SUITES</small></div>
        <button type="button" className="pro-drawer-close" aria-label="Close menu" onClick={closeDrawer}><AdminIcon name="close"/></button>
      </div>
      <div className="pro-hotel-identity"><span className="pro-hotel-icon"><AdminIcon name="store" size={19}/></span><div><span>ACTIVE PROPERTY</span><strong>{branchLabel}</strong></div><span className="pro-hotel-online"/></div>
      <div className="pro-side-inner">
        {(["operate","manage","system"] as const).map(group => <div className="pro-nav-group" key={group}>
          <span className="pro-nav-caption">{group === "operate" ? "WORKSPACE" : group === "manage" ? "MANAGEMENT" : "PREFERENCES"}</span>
          <nav aria-label={group === "operate" ? "Workspace" : group === "manage" ? "Management" : "Preferences"}>
            {sections.filter(s => s.group === group).map(s => <button type="button" key={s.id} aria-current={tab === s.id ? "page" : undefined} className={tab === s.id ? "selected" : ""} onClick={() => go(s.id)}>
              <AdminIcon name={s.icon} size={19}/><span>{s.label}</span>{s.id === "drafts" && drafts > 0 && <em>{drafts}</em>}
            </button>)}
          </nav>
        </div>)}
      </div>
      <div className="pro-side-footer"><a href={"/?branch=" + branchId}><AdminIcon name="arrow" size={17}/> View guest menu</a><button type="button" onClick={onSignout}><AdminIcon name="logout" size={17}/> Sign out</button></div>

    </aside>
    <div className="pro-workspace">
      <div className="pro-topbar">
        <div className="pro-topbar-left">
          <button type="button" className="pro-mobile-menu-button" aria-label="Open navigation" aria-expanded={drawer} onClick={openDrawer}><AdminIcon name="menu" size={23}/></button>
          <span className="pro-topbar-route">Workspace <AdminIcon name="chevron" size={14}/> <strong>{sections.find(s => s.id === tab)?.label}</strong></span>
        </div>
        <div className="pro-topbar-right">
          <span className="pro-topbar-property">{branchLabel}</span>
          <a className="pro-topbar-guest" href={"/?branch=" + branchId} title="View the guest menu"><AdminIcon name="store" size={18}/><span>Guest view</span></a>
        </div>
      </div>
      <div className="pro-main">
        <header className="pro-header">
          <div><h1>{title[tab]}</h1><p className="pro-muted">{descriptions[tab]}</p></div>
          <div className="pro-header-actions"><button type="button" className="pro-btn secondary pro-refresh-button" disabled={busy} onClick={onRefresh}><AdminIcon name="refresh" size={16}/> Refresh</button></div>
        </header>
        {children}
        <footer className="pro-footer"><span>© Tranquila Hotels & Suites</span><span>Thoughtful hospitality. Considered details.</span></footer>
      </div>
    </div>
  </main>;
}
