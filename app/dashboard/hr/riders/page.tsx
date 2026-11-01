import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinesses } from "@/modules/businesses/services/business.service";
import { getDepartments } from "@/modules/departments/services/department.service";
import { getEmployeeAssignmentOptions, getEmployees } from "@/modules/employees/services/employee.service";
import { canManageDeliveryRiders } from "@/modules/orders/services/order.service";
import RidersManager from "@/modules/orders/components/RidersManager";

export const dynamic = "force-dynamic";

export default async function HRDeliveryRidersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await canManageDeliveryRiders(supabase, user.id))) redirect("/dashboard");

  const [employees, businesses, departments, assignmentOptions] = await Promise.all([
    getEmployees(),
    getBusinesses(),
    getDepartments(),
    getEmployeeAssignmentOptions(),
  ]);

  return <div className="space-y-6">
    <RidersManager employees={employees} businesses={businesses} departments={departments} branches={assignmentOptions.branches} storeManagers={assignmentOptions.managers} accountOptions={assignmentOptions.accountOptions} />
  </div>;
}
