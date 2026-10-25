"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, RefreshCw, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { getCashierManagementData, saveCashierAssignment } from "../actions";

type CashierData = Awaited<ReturnType<typeof getCashierManagementData>>;
type CashRosterStaff = { id: string; display_name: string | null; first_name: string | null; last_name: string | null; email: string | null };
const inputClass = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#03162F] outline-none focus:border-[#D9B52B] focus:ring-2 focus:ring-[#D9B52B]/20";
function name(person: { display_name?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null } | null) {
  return person?.display_name?.trim() || [person?.first_name, person?.last_name].filter(Boolean).join(" ") || person?.email || "Staff member";
}

export default function CashierManagementPage() {
  const router = useRouter();
  const [data, setData] = useState<CashierData | null>(null);
  const [staffProfileId, setStaffProfileId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await getCashierManagementData();
      setData(result);
      setStaffProfileId((current) => current || result.staff[0]?.id || "");
      setBusinessId((current) => current || result.businesses[0]?.id || "");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Cashier setup could not be loaded."); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  function save(active: boolean, selectedStaff = staffProfileId, selectedBusiness = businessId, selectedNotes = notes) {
    startTransition(async () => {
      try {
        await saveCashierAssignment({ staffProfileId: selectedStaff, businessId: selectedBusiness, active, notes: selectedNotes });
        toast.success(active ? "Cashier access assigned." : "Cashier access deactivated.");
        await load();
        router.refresh();
      } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Cashier access could not be saved."); }
  }); }

  return <main className="w-full space-y-5 pb-8">
    <header className="sticky top-0 z-20 -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-6 pb-3 pt-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/reports/cash-reconciliation" aria-label="Back to cash reconciliation" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></Link><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D9B52B] text-[#03162F]"><UserRoundCog className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#9A7410]">Enterprise finance</p><h1 className="text-xl font-black text-[#03162F]">Cashier management</h1><p className="text-xs text-slate-500">Assign till access to eligible staff and businesses.</p></div></div>
      <button type="button" onClick={() => startTransition(() => { void load(); })} disabled={pending} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"><RefreshCw className="h-4 w-4" />Refresh</button>
    </header>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <section className="grid gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
      <form onSubmit={(event) => { event.preventDefault(); save(true); }} className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h2 className="font-bold text-[#03162F]">Assign cashier</h2><p className="mt-1 text-sm text-slate-500">Staff must have the “Record cash and reconcile till” role permission first.</p></div>
        <label className="block text-xs font-semibold text-slate-600">Staff member<select required value={staffProfileId} onChange={(event) => setStaffProfileId(event.target.value)} className={inputClass}><option value="">Select eligible staff</option>{data?.staff.map((staff: CashRosterStaff) => <option key={staff.id} value={staff.id}>{name(staff)}{staff.email ? ` · ${staff.email}` : ""}</option>)}</select></label>
        <label className="block text-xs font-semibold text-slate-600">Business / till<select required value={businessId} onChange={(event) => setBusinessId(event.target.value)} className={inputClass}><option value="">Select business</option>{data?.businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select></label>
        <label className="block text-xs font-semibold text-slate-600">Assignment notes<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Till name, shift or location (optional)" className={inputClass} /></label>
        <button disabled={pending || !staffProfileId || !businessId} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#03162F] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Assign till access</button>
        {!data?.staff.length && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">No eligible staff found. Grant a staff role the cash reconciliation permission in Roles &amp; Permissions first.</p>}
      </form>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-[#03162F]">Cashier assignments</h2><p className="mt-1 text-xs text-slate-500">Active assignments allow cash entries and daily till counts for that business.</p></div>
        {!data ? <p className="p-8 text-center text-sm text-slate-500">Loading cashier assignments…</p> : !data.assignments.length ? <p className="p-8 text-center text-sm text-slate-500">No cashiers assigned yet.</p> : <div className="divide-y divide-slate-100">{data.assignments.map((assignment) => {
          const staff = Array.isArray(assignment.staff) ? assignment.staff[0] : assignment.staff;
          const business = Array.isArray(assignment.business) ? assignment.business[0] : assignment.business;
          return <article key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-semibold text-[#03162F]">{name(staff)}</p><p className="text-sm text-slate-600">{business?.name || "Business"}{assignment.notes ? ` · ${assignment.notes}` : ""}</p><p className="mt-1 text-xs text-slate-400">Assigned {new Date(assignment.assigned_at).toLocaleDateString("en-ZM")}</p></div><button type="button" disabled={pending} onClick={() => save(!assignment.active, assignment.staff_profile_id, assignment.business_id, assignment.notes || "")} className={`rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${assignment.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{assignment.active ? "Active · Deactivate" : "Inactive · Reactivate"}</button></article>;
        })}</div>}
      </section>
    </section>
  </main>;
}
