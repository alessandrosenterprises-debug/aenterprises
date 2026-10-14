import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bike } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinesses } from "@/modules/businesses/services/business.service";
import { getDepartments } from "@/modules/departments/services/department.service";
import { getEmployees } from "@/modules/employees/services/employee.service";
import { canManageDeliveryRiders, getRiderAccountOptions } from "@/modules/orders/services/order.service";
import RidersManager from "@/modules/orders/components/RidersManager";

export const dynamic = "force-dynamic";

export default async function HRDeliveryRidersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await canManageDeliveryRiders(supabase, user.id))) redirect("/dashboard");

  const [employees, businesses, departments, accountOptions] = await Promise.all([
    getEmployees(),
    getBusinesses(),
    getDepartments(),
    getRiderAccountOptions(),
  ]);

  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9a7910]">Human Resources · Deliveries</p>
        <h2 className="mt-1 text-3xl font-bold text-[#03162F]">Rider Management</h2>
        <p className="mt-2 text-slate-500">Add and maintain the riders available for customer order deliveries.</p>
      </div>
      <Link href="/dashboard/orders" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#03162F] shadow-sm hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Customer Orders</Link>
    </header>
    <div className="-mt-2 flex items-center gap-2 text-xs text-slate-500"><Bike className="h-4 w-4 text-[#9a7910]" />Active riders appear in the Assign Rider selector on customer delivery orders.</div>
    <RidersManager employees={employees} businesses={businesses} departments={departments} accountOptions={accountOptions} />
  </div>;
}
