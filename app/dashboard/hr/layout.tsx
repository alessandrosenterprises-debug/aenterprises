import type { ReactNode } from "react";
import HRSectionNav from "@/components/hr/HRSectionNav";

interface HRLayoutProps {
  children: ReactNode;
}

export default function HRLayout({ children }: HRLayoutProps) {
  return (
    <div data-hr-layout className="space-y-5">
      <header className="sticky top-0 z-40 -mx-6 space-y-4 border-b border-white/10 bg-[#03162f] px-6 pb-3 pt-4 text-white shadow-lg shadow-slate-900/10">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
            Department workspace
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Human Resources
          </h1>
          <p className="text-sm text-slate-300">
            Manage employees, departments, payroll and all human resource operations.
          </p>
        </div>
        <HRSectionNav />
      </header>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
