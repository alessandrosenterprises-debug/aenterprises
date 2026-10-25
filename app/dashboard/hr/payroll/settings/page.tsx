import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployees } from "@/modules/employees/services/employee.service";
import { getEmployeePayrollSettings } from "@/modules/payroll/services/employee-payroll-settings.service";

import EmployeePayrollSettingsTable from "@/modules/payroll/components/EmployeePayrollSettingsTable";

export default async function HRPayrollSettingsPage() {
  const supabase = await createClient();
  const [{ data: canManageHr }, { data: canManageAccountsPayroll }] = await Promise.all([
    supabase.rpc("has_permission", { required_permission: "hr.manage" }),
    supabase.rpc("has_permission", { required_permission: "accounts.payroll" }),
  ]);
  if (!canManageHr && !canManageAccountsPayroll) redirect("/dashboard");

  const [employees, settings] = await Promise.all([
    getEmployees(),
    getEmployeePayrollSettings(),
  ]);

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Payroll Settings
        </h2>

        <p className="mt-2 text-slate-500">
          Manage employee payment details, statutory
          information and default payroll deductions.
        </p>
      </div>

      {/* =====================================================
          EMPLOYEE PAYROLL SETTINGS
      ===================================================== */}

      <EmployeePayrollSettingsTable
        employees={employees}
        settings={settings}
      />
    </div>
  );
}
