"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Building2,
  WalletCards,
  CalendarCheck,
  HandCoins,
  FolderOpen,
  BarChart3,
} from "lucide-react";
import type { ReactNode } from "react";

interface HRLayoutProps {
  children: ReactNode;
}

const hrNavigation = [
  {
    title: "Overview",
    href: "/dashboard/hr",
    icon: Users,
  },
  {
    title: "Employees",
    href: "/dashboard/hr/employees",
    icon: Users,
  },
  {
    title: "Departments",
    href: "/dashboard/hr/departments",
    icon: Building2,
  },
  {
    title: "Payroll",
    href: "/dashboard/hr/payroll",
    icon: WalletCards,
  },
  {
    title: "Leave & Attendance",
    href: "/dashboard/hr/leave-attendance",
    icon: CalendarCheck,
  },
  {
    title: "Loans & Advances",
    href: "/dashboard/hr/loans-advances",
    icon: HandCoins,
  },
  {
    title: "Employee Documents",
    href: "/dashboard/hr/documents",
    icon: FolderOpen,
  },
  {
    title: "HR Reports",
    href: "/dashboard/hr/reports",
    icon: BarChart3,
  },
];

export default function HRLayout({
  children,
}: HRLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* =====================================================
          HR HEADER
      ===================================================== */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Human Resources
        </h1>

        <p className="mt-2 text-slate-500">
          Manage employees, departments, payroll and
          all human resource operations.
        </p>
      </div>

      {/* =====================================================
          HR NAVIGATION
      ===================================================== */}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <nav className="flex min-w-max items-center gap-1 p-2">
          {hrNavigation.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (
                item.href !== "/dashboard/hr" &&
                pathname.startsWith(`${item.href}/`)
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-[#03162F] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#03162F]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />

                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* =====================================================
          HR CONTENT
      ===================================================== */}

      <main>
        {children}
      </main>
    </div>
  );
}