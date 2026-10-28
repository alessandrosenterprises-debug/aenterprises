import type { ReactNode } from "react";

interface HRLayoutProps {
  children: ReactNode;
}

export default function HRLayout({ children }: HRLayoutProps) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">
          Human Resources
        </h1>

        <p className="mt-2 text-slate-500">
          Manage employees, departments, payroll and
          all human resource operations.
        </p>
      </header>

      <main>{children}</main>
    </div>
  );
}
