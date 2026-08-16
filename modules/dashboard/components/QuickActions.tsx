"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  Package,
  Settings,
  Users,
} from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: typeof Building2;
}

const quickActions: QuickAction[] = [
  {
    title: "Manage Businesses",
    description: "Add, edit and manage your businesses.",
    href: "/dashboard/configuration/businesses",
    icon: Building2,
  },
  {
    title: "Manage Customers",
    description: "View and manage customer records.",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Manage Employees",
    description: "Manage employees and staff accounts.",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    title: "Manage Products",
    description: "Manage products and services.",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Bookings",
    description: "View and manage customer bookings.",
    href: "/dashboard/bookings",
    icon: CalendarDays,
  },
  {
    title: "Reports",
    description: "View business reports and performance.",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    title: "Configuration",
    description: "Configure your enterprise platform.",
    href: "/dashboard/configuration/businesses",
    icon: Settings,
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#03162F]">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quickly access common management tasks.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              href={action.href}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0A2852] hover:bg-slate-50 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white transition-colors group-hover:bg-[#0A2852]">
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#03162F]">
                  {action.title}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {action.description}
                </p>
              </div>

              <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#03162F]" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}