import {
  getPayrollPeriods,
} from "@/modules/payroll/services/payroll-period.service";

import PayrollPeriodsTable from "@/modules/payroll/components/PayrollPeriodsTable";

export default async function PayrollPage() {
  const periods =
    await getPayrollPeriods();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Payroll
        </h1>

        <p className="mt-2 text-slate-500">
          Manage payroll periods, payroll runs,
          employee payments, and payslips.
        </p>
      </div>

      <PayrollPeriodsTable
        periods={periods}
      />
    </div>
  );
}