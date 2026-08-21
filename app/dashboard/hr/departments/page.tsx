import { getDepartments } from "@/modules/departments/services/department.service";

import DepartmentsTable from "@/modules/departments/components/DepartmentsTable";

export default async function HRDepartmentsPage() {
  const departments = await getDepartments();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Departments
        </h2>

        <p className="mt-2 text-slate-500">
          Manage departments across Alessandro Enterprises.
        </p>
      </div>

      <DepartmentsTable
        departments={departments}
      />
    </div>
  );
}