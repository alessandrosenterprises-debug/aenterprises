"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation, type NavigationItem } from "@/lib/navigation";

function isCurrentPath(pathname: string, href?: string) {
  return Boolean(href && (pathname === href || pathname.startsWith(`${href}/`)));
}

function SidebarItem({ item, pathname }: { item: NavigationItem; pathname: string }) {
  if (item.children?.length) {
    const activeChild = item.children.some((child) => isCurrentPath(pathname, child.href));

    return (
      <section className="space-y-1.5">
        <h2 className={`px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide ${activeChild ? "text-[#03162F]" : "text-[#03162F]/65"}`}>
          {item.title}
        </h2>

        <div className="space-y-0.5">
          {item.children.map((child) => {
            if (!child.href) return null;
            const active = isCurrentPath(pathname, child.href);

            return (
              <Link key={child.title} href={child.href}
                title={child.title}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-8 w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] leading-5 transition-colors ${active ? "bg-[#03162F] font-semibold text-white shadow-sm" : "text-[#03162F]/85 hover:bg-white/50 hover:text-[#03162F]"}`}>
                {child.icon ? <child.icon className={`h-4 w-4 shrink-0 ${active ? "text-[#D4AF37]" : "text-[#03162F]/65"}`} /> : <span className="h-4 w-4 shrink-0" />}
                <span className="min-w-0 flex-1 truncate">{child.title}</span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  const active = isCurrentPath(pathname, item.href);

  return (
    <Link href={item.href ?? "#"}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] leading-5 transition-colors ${active ? "bg-[#03162F] font-semibold text-white shadow-sm" : "text-[#03162F]/85 hover:bg-white/50 hover:text-[#03162F]"}`}>
      {item.icon ? <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-[#D4AF37]" : "text-[#03162F]/70"}`} /> : <span className="h-4 w-4 shrink-0" />}
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-40 flex h-full w-[280px] min-w-[280px] shrink-0 flex-col overflow-hidden border-r border-[#8F6500]/35 bg-[#B8860B] text-[#03162F] shadow-[4px_0_18px_rgba(3,22,47,0.12)]">
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <div className="flex flex-col gap-2.5">
          {navigation.map((item) => <SidebarItem key={item.title} item={item} pathname={pathname} />)}
        </div>
      </nav>

      <div className="shrink-0 border-t border-[#8F6500]/35 px-5 py-4">
        <p className="whitespace-normal break-words text-[10px] font-bold uppercase tracking-[0.12em] text-[#03162F]/75">Alessandro Enterprises</p>
        <p className="mt-1 whitespace-normal break-words text-[9px] font-semibold uppercase tracking-[0.08em] text-[#03162F]/55">Management Platform</p>
      </div>
    </aside>
  );
}
