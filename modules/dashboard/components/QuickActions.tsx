"use client";

import { useRouter } from "next/navigation";

import {
  UserPlus,
  UserCog,
  Building2,
  PackagePlus,
  CalendarPlus,
  FileBarChart,
} from "lucide-react";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Add Customer",
      icon: UserPlus,
      href: "/dashboard/customers",
    },
    {
      title: "Add Employee",
      icon: UserCog,
      href: "/dashboard/employees",
    },
    {
      title: "Businesses",
      icon: Building2,
      href: "/dashboard/businesses",
    },
    {
      title: "Products",
      icon: PackagePlus,
      href: "/dashboard/products",
    },
    {
      title: "Bookings",
      icon: CalendarPlus,
      href: "/dashboard/bookings",
    },
    {
      title: "Reports",
      icon: FileBarChart,
      href: "/dashboard/reports",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold text-[#03162F]">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              onClick={() => router.push(action.href)}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-5 transition hover:border-[#D4AF37] hover:bg-slate-50 hover:shadow-md"
            >
              <Icon className="mb-3 h-7 w-7 text-[#03162F]" />

              <span className="text-sm font-semibold">
                {action.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}