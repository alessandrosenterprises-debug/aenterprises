import Link from "next/link";

import {
  getPayrollPeriods,
} from "@/modules/payroll/services/payroll-period.service";

import PayrollPeriodsTable from "@/modules/payroll/components/PayrollPeriodsTable";

export default async function HRPayrollPage() {
  const payrollPeriods = await getPayrollPeriods();

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Payroll
          </h2>

          <p className="mt-2 text-slate-500">
            Manage payroll periods, payroll runs and
            employee payments across Alessandro Enterprises.
          </p>
        </div>

        {/* =================================================
            PAYROLL SETTINGS
        ================================================= */}

        <Link
          href="/dashboard/hr/payroll/settings"
          className="inline-flex items-center justify-center rounded-xl bg-[#03162F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2852]"
        >
          Payroll Settings
        </Link>
      </div>

      {/* =====================================================
          PAYROLL PERIODS
      ===================================================== */}

      <PayrollPeriodsTable
        periods={payrollPeriods}
      />
    </div>
  );
}