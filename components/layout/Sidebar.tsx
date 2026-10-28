"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ChevronDown } from "lucide-react";

import { navigation, type NavigationItem } from "@/lib/navigation";
import { canSeeNavigationItem } from "@/lib/navigation/access";

const subscribeToNothing = () => () => {};

function isCurrentPath(pathname: string, href?: string) {
  // A section landing page (for example HR Overview) must not stay selected
  // when the user is on one of its child pages.
  return Boolean(href && pathname === href);
}

function matchesPath(pathname: string, href?: string) {
  return Boolean(href && (pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))));
}

function visibleChildren(item: NavigationItem, permissionKeys: string[], isSuperAdministrator: boolean, applyAccess: boolean) {
  return (item.children ?? []).filter((child) => canSeeNavigationItem(child, permissionKeys, isSuperAdministrator, applyAccess));
}

function activeDepartmentTitle(pathname: string, permissionKeys: string[], isSuperAdministrator: boolean, applyAccess: boolean) {
  return navigation
    .filter((item) => item.children?.length)
    .map((item) => ({
      title: item.title,
      matchLength: Math.max(0, ...visibleChildren(item, permissionKeys, isSuperAdministrator, applyAccess)
        .filter((child) => matchesPath(pathname, child.href))
        .map((child) => child.href?.length ?? 0)),
    }))
    .filter((item) => item.matchLength > 0)
    .sort((a, b) => b.matchLength - a.matchLength)[0]?.title ?? null;
}

function SidebarItem({ item, pathname, permissionKeys, isSuperAdministrator, applyAccess, expandedSection, setExpandedSection }: { item: NavigationItem; pathname: string; permissionKeys: string[]; isSuperAdministrator: boolean; applyAccess: boolean; expandedSection: string | null; setExpandedSection: (title: string | null) => void }) {
  if (item.children?.length) {
    const children = visibleChildren(item, permissionKeys, isSuperAdministrator, applyAccess);
    if (children.length === 0) return null;
    const activeHref = children
      .filter((child) => matchesPath(pathname, child.href))
      .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))[0]?.href;
    const expanded = expandedSection === item.title;
    const sectionId = `sidebar-section-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    return (
      <section className="space-y-1">
        <button
          type="button"
          title={`${expanded ? "Collapse" : "Expand"} ${item.title}`}
          aria-expanded={expanded}
          aria-controls={sectionId}
          onClick={() => setExpandedSection(expanded ? null : item.title)}
          className="group flex min-h-10 w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-left text-[12px] font-semibold uppercase tracking-[0.055em] text-[#03162F]/75 transition-colors duration-200 hover:border-white/25 hover:bg-white/30 hover:text-[#03162F] motion-reduce:transition-none"
        >
          {item.icon ? <item.icon className="h-4 w-4 shrink-0 text-[#03162F]/65" /> : <span className="h-4 w-4 shrink-0" />}
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
        </button>

        <div id={sectionId} hidden={!expanded} className="ml-3 space-y-0.5 border-l border-[#03162F]/15 pl-2">
          {children.map((child) => {
            if (!child.href) return null;
            const active = child.href === activeHref;

            return (
              <Link key={`${child.href}:${child.title}`} href={child.href}
                title={child.title}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-8 w-full items-center gap-2 rounded-lg border-l-2 px-2 py-1.5 text-[12px] font-semibold leading-4 transition-colors duration-150 motion-reduce:transition-none ${active ? "border-[#03162F] bg-white/45 text-[#03162F]" : "border-transparent text-[#03162F]/80 hover:bg-white/30 hover:text-[#03162F]"}`}>
                {child.icon ? <child.icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-[#03162F]" : "text-[#03162F]/60"}`} /> : <span className="h-3.5 w-3.5 shrink-0" />}
                <span className="min-w-0 flex-1 truncate">{child.title}</span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  if (!canSeeNavigationItem(item, permissionKeys, isSuperAdministrator, applyAccess)) return null;
  const active = isCurrentPath(pathname, item.href);

  return (
    <Link href={item.href ?? "#"}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-9 w-full items-center gap-2.5 rounded-lg border-l-[3px] px-2 py-1.5 text-[13px] font-semibold leading-5 transition-colors ${active ? "border-[#03162F] bg-white/55 text-[#03162F]" : "border-transparent text-[#03162F]/85 hover:bg-white/40 hover:text-[#03162F]"}`}>
      {item.icon ? <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-[#03162F]" : "text-[#03162F]/70"}`} /> : <span className="h-4 w-4 shrink-0" />}
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
    </Link>
  );
}

export default function Sidebar({ permissionKeys, isSuperAdministrator, accessControlEnabled }: { permissionKeys: string[]; isSuperAdministrator: boolean; accessControlEnabled: boolean }) {
  const pathname = usePathname();
  const applyAccess = accessControlEnabled;
  // Role assignments and the effective operator session are resolved on the
  // server. Keep the first browser render neutral so a refreshed session can
  // never hydrate against a different set of permission-filtered links.
  const hydrated = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const [sectionOverride, setSectionOverride] = useState<{ pathname: string; title: string | null } | null>(null);
  const activeSection = activeDepartmentTitle(pathname, permissionKeys, isSuperAdministrator, applyAccess);
  const expandedSection = sectionOverride?.pathname === pathname ? sectionOverride.title : activeSection;

  return (
    <aside className="sticky top-0 z-40 flex h-full w-[280px] min-w-[280px] shrink-0 flex-col overflow-hidden border-r border-[#8F6500]/35 bg-[#B8860B] text-[#03162F] shadow-[4px_0_18px_rgba(3,22,47,0.12)]">
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {hydrated ? (
          <div className="flex flex-col gap-2.5">
            {navigation.map((item) => <SidebarItem key={item.title} item={item} pathname={pathname} permissionKeys={permissionKeys} isSuperAdministrator={isSuperAdministrator} applyAccess={applyAccess} expandedSection={expandedSection} setExpandedSection={(title) => setSectionOverride({ pathname, title })} />)}
          </div>
        ) : (
          <div aria-hidden="true" className="flex flex-col gap-2.5">
            {navigation.map((item) => (
              <div key={item.title} className="space-y-2 px-2 py-2">
                <div className="h-2 w-20 rounded bg-[#03162F]/15" />
                <div className="h-7 rounded-md bg-white/20" />
                {item.children && <div className="h-7 rounded-md bg-white/15" />}
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="shrink-0 border-t border-[#8F6500]/35 px-5 py-4">
        <p className="whitespace-normal break-words text-[10px] font-bold uppercase tracking-[0.12em] text-[#03162F]/75">Alessandro Enterprises</p>
        <p className="mt-1 whitespace-normal break-words text-[9px] font-semibold uppercase tracking-[0.08em] text-[#03162F]/55">Management Platform</p>
      </div>
    </aside>
  );
}
