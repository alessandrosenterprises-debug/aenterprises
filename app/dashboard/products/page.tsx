"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  {
    label: "Businesses",
    href: "/dashboard/configuration/businesses",
    icon: "🏢",
  },
  {
    label: "Departments",
    href: "/dashboard/configuration/departments",
    icon: "🏛️",
  },
  {
    label: "Branches",
    href: "/dashboard/configuration/branches",
    icon: "📍",
  },
  {
    label: "Operators",
    href: "/dashboard/configuration/operators",
    icon: "📱",
  },
  {
    label: "Mobile Money Services",
    href: "/dashboard/configuration/mobileMoneyServices",
    icon: "💸",
  },
  {
    label: "Loan Products",
    href: "/dashboard/configuration/loanProducts",
    icon: "🏦",
  },
  {
    label: "Categories",
    href: "/dashboard/configuration/categories",
    icon: "📦",
  },
  {
    label: "Roles",
    href: "/dashboard/configuration/roles",
    icon: "👥",
  },
  {
    label: "Permissions",
    href: "/dashboard/configuration/permissions",
    icon: "🔐",
  },
  {
    label: "Company Settings",
    href: "/dashboard/configuration/companySettings",
    icon: "⚙️",
  },
];

export default function ConfigurationSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-6 h-fit w-72 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-xl font-bold text-[#03162F]">
        Configuration
      </h2>

      <nav className="space-y-2">
        {menu.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-[#03162F] text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="text-xl">
                {item.icon}
              </span>

              <span className="font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}