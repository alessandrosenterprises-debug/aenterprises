"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation } from "@/lib/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-[280px] overflow-y-auto bg-[#03162F] text-white shadow-xl">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#03162F] p-6">
        <h1 className="text-2xl font-bold text-[#D4AF37]">
          ALESSANDRO
        </h1>

        <p className="text-sm text-slate-300">
          Enterprise Platform
        </p>
      </div>

      <nav className="flex flex-col gap-2 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.title}
              href={item.href ?? "#"}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 ${
                isActive
                  ? "border-l-4 border-[#D4AF37] bg-[#0A2852] text-white shadow-lg"
                  : "text-slate-300 hover:bg-[#0A2852]/70 hover:text-white"
              }`}
            >
              {item.icon && <item.icon className="h-5 w-5" />}

              <span className="font-medium">
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}