import { getEmployees } from "@/modules/employees/services/employee.service";
import { getEmployeePayrollSettings } from "@/modules/payroll/services/employee-payroll-settings.service";

import EmployeePayrollSettingsTable from "@/modules/payroll/components/EmployeePayrollSettingsTable";

export default async function EmployeePayrollSettingsPage() {
  const [employees, settings] = await Promise.all([
    getEmployees(),
    getEmployeePayrollSettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Employee Payroll Settings
        </h1>

        <p className="mt-2 text-slate-500">
          Manage payment details, statutory information,
          and default deductions for employees.
        </p>
      </div>

      <EmployeePayrollSettingsTable
        employees={employees}
        settings={settings}
      />
    </div>
  );
}