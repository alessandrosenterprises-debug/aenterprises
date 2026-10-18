"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation, type NavigationItem } from "@/lib/navigation";
import { getDashboardPermission } from "@/lib/navigation/route-permissions";

function isCurrentPath(pathname: string, href?: string) {
  // A section landing page (for example HR Overview) must not stay selected
  // when the user is on one of its child pages.
  return Boolean(href && pathname === href);
}

const permissionByHref: Record<string, string> = {
  "/dashboard": "dashboard.view", "/dashboard/enterprise": "businesses.view", "/dashboard/enterprise/content": "businesses.manage",
  "/dashboard/customers": "customers.view", "/dashboard/loans": "customers.manage", "/dashboard/hr": "hr.manage",
  "/dashboard/hr/employees": "employees.view", "/dashboard/hr/riders": "employees.manage", "/dashboard/hr/departments": "hr.manage",
  "/dashboard/hr/leave-attendance": "hr.manage", "/dashboard/hr/documents": "hr.manage", "/dashboard/hr/loans-advances": "hr.manage",
  "/dashboard/hr/payroll": "hr.manage", "/dashboard/hr/reports": "reports.view", "/dashboard/emails": "communications.manage",
  "/dashboard/messages": "communications.manage", "/dashboard/products": "products.manage", "/dashboard/catalog": "products.manage",
  "/dashboard/bookings": "bookings.view", "/dashboard/orders": "orders.view", "/dashboard/orders/my-deliveries": "deliveries.manage",
  "/dashboard/reports": "reports.view", "/dashboard/configuration/roles": "access.manage_roles",
  "/dashboard/configuration/permissions": "access.manage_permissions", "/dashboard/configuration/businesses": "businesses.manage",
  "/dashboard/configuration/branches": "configuration.manage", "/dashboard/configuration/operators": "configuration.manage",
  "/dashboard/configuration/mobile-money-services": "configuration.manage", "/dashboard/configuration/loan-products": "configuration.manage",
  "/dashboard/configuration/loan-terms": "configuration.manage", "/dashboard/configuration/categories": "configuration.manage",
  "/dashboard/configuration/company-settings": "settings.manage", "/dashboard/administration": "access.manage_roles",
  "/dashboard/administration/access": "access.manage_permissions", "/dashboard/administration/activity": "access.view_audit",
  "/dashboard/notifications": "communications.manage", "/dashboard/settings": "settings.manage", "/dashboard/website": "configuration.manage",
};

function itemPermission(item: NavigationItem) {
  return item.permission ?? (item.href ? permissionByHref[item.href] ?? getDashboardPermission(item.href) : undefined);
}

function SidebarItem({ item, pathname, permissionKeys, isSuperAdministrator, applyAccess }: { item: NavigationItem; pathname: string; permissionKeys: string[]; isSuperAdministrator: boolean; applyAccess: boolean }) {
  if (item.children?.length) {
    const visibleChildren = item.children.filter((child) => !applyAccess || isSuperAdministrator || !itemPermission(child) || permissionKeys.includes(itemPermission(child)!));
    if (visibleChildren.length === 0) return null;
    const activeChild = visibleChildren.some((child) => isCurrentPath(pathname, child.href));

    return (
      <section className="space-y-1.5">
        <h2 className={`px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide ${activeChild ? "text-[#03162F]" : "text-[#03162F]/65"}`}>
          {item.title}
        </h2>

        <div className="space-y-0.5">
          {visibleChildren.map((child) => {
            if (!child.href) return null;
            const active = isCurrentPath(pathname, child.href);

            return (
              <Link key={child.title} href={child.href}
                title={child.title}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-8 w-full items-center gap-2.5 rounded-lg border-l-[3px] px-2 py-1.5 text-[13px] leading-5 transition-colors ${active ? "border-[#03162F] bg-white/55 font-semibold text-[#03162F]" : "border-transparent text-[#03162F]/85 hover:bg-white/40 hover:text-[#03162F]"}`}>
                {child.icon ? <child.icon className={`h-4 w-4 shrink-0 ${active ? "text-[#03162F]" : "text-[#03162F]/65"}`} /> : <span className="h-4 w-4 shrink-0" />}
                <span className="min-w-0 flex-1 truncate">{child.title}</span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  if (applyAccess && !isSuperAdministrator && itemPermission(item) && !permissionKeys.includes(itemPermission(item)!)) return null;
  const active = isCurrentPath(pathname, item.href);

  return (
    <Link href={item.href ?? "#"}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-9 w-full items-center gap-2.5 rounded-lg border-l-[3px] px-2 py-1.5 text-[13px] leading-5 transition-colors ${active ? "border-[#03162F] bg-white/55 font-semibold text-[#03162F]" : "border-transparent text-[#03162F]/85 hover:bg-white/40 hover:text-[#03162F]"}`}>
      {item.icon ? <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-[#03162F]" : "text-[#03162F]/70"}`} /> : <span className="h-4 w-4 shrink-0" />}
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
    </Link>
  );
}

export default function Sidebar({ permissionKeys, isSuperAdministrator, accessControlEnabled }: { permissionKeys: string[]; isSuperAdministrator: boolean; accessControlEnabled: boolean }) {
  const pathname = usePathname();
  const applyAccess = accessControlEnabled;

  return (
    <aside className="sticky top-0 z-40 flex h-full w-[280px] min-w-[280px] shrink-0 flex-col overflow-hidden border-r border-[#8F6500]/35 bg-[#B8860B] text-[#03162F] shadow-[4px_0_18px_rgba(3,22,47,0.12)]">
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <div className="flex flex-col gap-2.5">
          {navigation.map((item) => <SidebarItem key={item.title} item={item} pathname={pathname} permissionKeys={permissionKeys} isSuperAdministrator={isSuperAdministrator} applyAccess={applyAccess} />)}
        </div>
      </nav>

      <div className="shrink-0 border-t border-[#8F6500]/35 px-5 py-4">
        <p className="whitespace-normal break-words text-[10px] font-bold uppercase tracking-[0.12em] text-[#03162F]/75">Alessandro Enterprises</p>
        <p className="mt-1 whitespace-normal break-words text-[9px] font-semibold uppercase tracking-[0.08em] text-[#03162F]/55">Management Platform</p>
      </div>
    </aside>
  );
}
