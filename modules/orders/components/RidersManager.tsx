"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Pencil, Phone, UserRound } from "lucide-react";
import EmployeeModal from "@/modules/employees/components/EmployeeModal";
import type { Employee } from "@/modules/employees/services/employee.service";
import type { EmployeeBranchOption, EmployeeManagerOption } from "@/modules/employees/services/employee.service";
import type { RiderAccountOption } from "../services/order.service";

type Business = { id: string; name: string };
type Department = { id: string; name: string };

export default function RidersManager({
  employees,
  businesses,
  departments,
  branches,
  storeManagers,
  accountOptions,
}: {
  employees: Employee[];
  businesses: Business[];
  departments: Department[];
  branches: EmployeeBranchOption[];
  storeManagers: EmployeeManagerOption[];
  accountOptions: RiderAccountOption[];
}) {
  const router = useRouter();
  const [selectedRider, setSelectedRider] = useState<Employee | null>(null);
  const riders = useMemo(() => employees
    .filter((employee) => /rider|driver|delivery/i.test(employee.position ?? ""))
    .sort((a, b) => a.full_name.localeCompare(b.full_name)), [employees]);
  const activeRiders = riders.filter((rider) => rider.is_active && rider.status?.toLowerCase() !== "inactive");

  return (
    <div className="space-y-6">
      <section className="sticky top-[-24px] z-[90] -mx-6 -mt-6 flex flex-col justify-between gap-4 rounded-none bg-[#03162F] p-6 text-white sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-white/10 p-3 text-[#D4AF37]"><Bike className="h-6 w-6" /></span>
          <div><h2 className="text-xl font-bold">Delivery riders</h2><p className="mt-1 max-w-2xl text-sm text-white/65">Manage the active staff who can be assigned to customer deliveries.</p></div>
        </div>
        {departments.length > 0 && <EmployeeModal key="new-rider" businesses={businesses} departments={departments} branches={branches} storeManagers={storeManagers} accountOptions={accountOptions} buttonLabel="Add rider" initialPosition="Delivery Rider" />}
      </section>

      {departments.length === 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Create an HR department before adding a rider. Rider records use AEOS employee records so delivery assignments stay connected to staff management.</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">All riders</p><p className="mt-2 text-3xl font-black text-[#03162F]">{riders.length}</p></article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><p className="text-sm text-emerald-800">Available to assign</p><p className="mt-2 text-3xl font-black text-emerald-900">{activeRiders.length}</p></article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"><p className="text-sm text-amber-800">Inactive</p><p className="mt-2 text-3xl font-black text-amber-900">{riders.length - activeRiders.length}</p></article>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-bold text-[#03162F]">Rider directory</h3><p className="mt-1 text-sm text-slate-500">Only active riders are available in the delivery assignment list.</p></div>
        {riders.length === 0 ? (
          <div className="px-6 py-14 text-center"><UserRound className="mx-auto h-10 w-10 text-slate-300" /><h4 className="mt-3 font-semibold text-[#03162F]">No riders added yet</h4><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Add a delivery rider here. They will immediately appear in the Assign Rider menu on the Orders page.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {riders.map((rider) => {
              const active = rider.is_active && rider.status?.toLowerCase() !== "inactive";
              return <article key={rider.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#03162F]"><UserRound className="h-5 w-5" /></span>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold text-[#03162F]">{rider.full_name}</h4><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Active" : "Inactive"}</span></div><p className="mt-1 text-sm text-slate-500">{rider.position} · {rider.businesses?.name ?? "All businesses"}</p><a href={`tel:${rider.phone}`} className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#03162F]"><Phone className="h-3.5 w-3.5" />{rider.phone}</a></div>
                </div>
                <button type="button" onClick={() => setSelectedRider(rider)} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-[#03162F] hover:bg-slate-50 sm:self-auto"><Pencil className="h-4 w-4" />Edit rider</button>
              </article>;
            })}
          </div>
        )}
      </section>

      {selectedRider && <EmployeeModal key={selectedRider.id} businesses={businesses} departments={departments} branches={branches} storeManagers={storeManagers} accountOptions={selectedRider.user_id && !accountOptions.some((account) => account.auth_user_id === selectedRider.user_id) ? [...accountOptions, { auth_user_id: selectedRider.user_id, display_name: "Current linked account", email: "" }] : accountOptions} mode="edit" open employee={selectedRider} onClose={() => { setSelectedRider(null); router.refresh(); }} />}
    </div>
  );
}
