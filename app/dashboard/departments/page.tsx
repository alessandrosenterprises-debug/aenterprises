import { getDepartments } from "@/modules/departments/services/department.service";
import DepartmentsTable from "@/modules/departments/components/DepartmentsTable";

export default async function DepartmentsPage() {
  const departments = await getDepartments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Departments
        </h1>

        <p className="mt-2 text-slate-500">
          Manage departments across Alessandro Enterprises.
        </p>
      </div>

      <DepartmentsTable departments={departments} />
    </div>
  );
}