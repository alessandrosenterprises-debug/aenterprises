import { getBusinesses } from "@/modules/businesses/services/business.service";
import { getDepartments } from "@/modules/departments/services/department.service";
import { getEmployees } from "@/modules/employees/services/employee.service";

import EmployeesTable from "@/modules/employees/components/EmployeesTable";

export default async function HREmployeesPage() {
  const [
    employees,
    businesses,
    departments,
  ] = await Promise.all([
    getEmployees(),
    getBusinesses(),
    getDepartments(),
  ]);

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Employees
        </h2>

        <p className="mt-2 text-slate-500">
          Manage employees, staff and team members
          across Alessandro Enterprises.
        </p>
      </div>

      {/* =====================================================
          EMPLOYEES
      ===================================================== */}

      <EmployeesTable
        employees={employees}
        businesses={businesses}
        departments={departments}
      />
    </div>
  );
}