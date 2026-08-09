import { getBusinesses } from "@/modules/businesses/services/business.service";
import { getEmployees } from "@/modules/employees/services/employee.service";
import EmployeesTable from "@/modules/employees/components/EmployeesTable";

export default async function EmployeesPage() {
  const employees = await getEmployees();
  const businesses = await getBusinesses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Employees
        </h1>

        <p className="mt-2 text-slate-500">
          Manage all employees across Alessandro Enterprises.
        </p>
      </div>

      <EmployeesTable
      employees={employees}
      businesses={businesses}
/>
    </div>
  );
}