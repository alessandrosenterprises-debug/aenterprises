"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  ClipboardList,
  FileText,
  HandCoins,
  Landmark,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const sections = [
  { label: "Overview", href: "/dashboard/hr", icon: BarChart3 },
  { label: "Employees", href: "/dashboard/hr/employees", icon: UsersRound },
  { label: "Rider Management", href: "/dashboard/hr/riders", icon: BriefcaseBusiness },
  { label: "Departments", href: "/dashboard/hr/departments", icon: Landmark },
  { label: "Payroll", href: "/dashboard/hr/payroll", icon: HandCoins },
  { label: "Payslips", href: "/dashboard/hr/payroll/payslips", icon: FileText },
  { label: "Leave & Attendance", href: "/dashboard/hr/leave-attendance", icon: CalendarCheck2 },
  { label: "Loans & Advances", href: "/dashboard/hr/loans-advances", icon: HandCoins },
  { label: "Employee Documents", href: "/dashboard/hr/documents", icon: ClipboardList },
  { label: "HR Reports", href: "/dashboard/hr/reports", icon: ShieldCheck },
];

export default function HRSectionNav() {
  const pathname = usePathname();
  const activeHref = [...sections]
    .filter(({ href }) =>
      pathname === href ||
      (href !== "/dashboard/hr" && pathname.startsWith(`${href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav
      aria-label="Human Resources pages"
      className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
    >
      <div className="flex w-max min-w-full items-center gap-1.5 border-b border-white/15 pb-1">
        {sections.map(({ label, href, icon: Icon }) => {
          const active = href === activeHref;

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] ${
                active
                  ? "bg-white/12 text-[#f2c94c] shadow-sm"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
