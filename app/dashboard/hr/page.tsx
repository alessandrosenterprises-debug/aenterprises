import { getEmployees } from "@/modules/employees/services/employee.service";
import { getDepartments } from "@/modules/departments/services/department.service";
import { getEmployeePayrollSettings } from "@/modules/payroll/services/employee-payroll-settings.service";
import { getPayrollPeriods } from "@/modules/payroll/services/payroll-period.service";

export default async function HRPage() {
  const [
    employees,
    departments,
    payrollSettings,
    payrollPeriods,
  ] = await Promise.all([
    getEmployees(),
    getDepartments(),
    getEmployeePayrollSettings(),
    getPayrollPeriods(),
  ]);

  const activeEmployees = employees.filter(
    (employee) =>
      employee.is_active === true ||
      employee.status === "Active"
  );

  const pendingPayrollSettings =
    employees.length - payrollSettings.length;

  const currentPayrollPeriod =
    payrollPeriods.find(
      (period) =>
        period.status === "Open" ||
        period.status === "Processing"
    ) ?? payrollPeriods[0];

  return (
    <div className="space-y-6">
      {/* =====================================================
          OVERVIEW CARDS
      ===================================================== */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Employees */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Employees
          </p>

          <p className="mt-2 text-3xl font-bold text-[#03162F]">
            {employees.length}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Employees registered in HR
          </p>
        </div>

        {/* Active Employees */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Active Employees
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {activeEmployees.length}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Currently active employees
          </p>
        </div>

        {/* Departments */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Departments
          </p>

          <p className="mt-2 text-3xl font-bold text-[#03162F]">
            {departments.length}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Company departments
          </p>
        </div>

        {/* Payroll Settings */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Payroll Configured
          </p>

          <p className="mt-2 text-3xl font-bold text-[#D4AF37]">
            {payrollSettings.length}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Employees with payroll settings
          </p>
        </div>
      </div>

      {/* =====================================================
          PAYROLL STATUS
      ===================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#03162F]">
                Payroll
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current payroll configuration status
              </p>
            </div>

            <span className="rounded-full bg-[#03162F] px-3 py-1 text-xs font-semibold text-white">
              {currentPayrollPeriod?.status ?? "No Period"}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-500">
                Current Period
              </span>

              <span className="font-semibold text-slate-900">
                {currentPayrollPeriod?.name ??
                  "No payroll period"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-500">
                Employees Configured
              </span>

              <span className="font-semibold text-slate-900">
                {payrollSettings.length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Pending Configuration
              </span>

              <span
                className={`font-semibold ${
                  pendingPayrollSettings > 0
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {Math.max(
                  pendingPayrollSettings,
                  0
                )}
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            QUICK HR SUMMARY
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#03162F]">
            HR Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current state of your workforce
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Inactive Employees
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-700">
                {Math.max(
                  employees.length -
                    activeEmployees.length,
                  0
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Payroll Periods
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-700">
                {payrollPeriods.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Payroll Coverage
              </p>

              <p className="mt-1 text-2xl font-bold text-[#03162F]">
                {employees.length > 0
                  ? Math.round(
                      (payrollSettings.length /
                        employees.length) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Departments
              </p>

              <p className="mt-1 text-2xl font-bold text-[#03162F]">
                {departments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          RECENT EMPLOYEES
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-bold text-[#03162F]">
            Recent Employees
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recently added employees in the HR system.
          </p>
        </div>

        {employees.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No employees have been added yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Employee
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Position
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Business
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {employees
                  .slice(0, 5)
                  .map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {employee.full_name}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {employee.position}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {employee.businesses?.name ??
                          "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            employee.status ===
                            "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}