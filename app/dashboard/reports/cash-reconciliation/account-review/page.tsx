"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, RefreshCw, Scale, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { getPendingCashUps, reviewCashUp } from "../actions";

type CashUp = Awaited<ReturnType<typeof getPendingCashUps>>[number];
const fieldClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#03162F] outline-none focus:border-[#D9B52B] focus:ring-2 focus:ring-[#D9B52B]/20";
function money(value: number | string | null) { return `ZMW ${Number(value ?? 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function staffName(value: { display_name?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null } | null | undefined) { return value?.display_name?.trim() || [value?.first_name, value?.last_name].filter(Boolean).join(" ") || value?.email || "Staff member"; }

export default function AccountsCashUpReviewPage() {
  const [cashUps, setCashUps] = useState<CashUp[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const load = useCallback(async () => {
    setError("");
    try { setCashUps(await getPendingCashUps()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Cash-ups could not be loaded."); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  function decide(cashUp: CashUp, decision: "approve" | "return") {
    startTransition(async () => {
      try {
        await reviewCashUp({ reconciliationId: cashUp.id, decision, note: notes[cashUp.id] ?? "" });
        toast.success(decision === "approve" ? "Cash-up finally confirmed." : "Cash-up returned to the manager with your notes.");
        setNotes((current) => { const next = { ...current }; delete next[cashUp.id]; return next; });
        await load();
      } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Cash-up decision could not be saved."); }
    });
  }

  return <main className="w-full space-y-5 pb-8">
    <header className="sticky top-0 z-20 -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-6 pb-3 pt-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/reports/cash-reconciliation" aria-label="Back to reconciliation" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600"><ArrowLeft className="h-4 w-4" /></Link><span className="rounded-xl bg-[#D9B52B] p-3 text-[#03162F]"><WalletCards className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#9A7410]">Independent finance review</p><h1 className="text-xl font-black text-[#03162F]">Accounts cash-up confirmation</h1><p className="text-xs text-slate-500">Review locked tills submitted by managers on shift.</p></div></div>
      <button type="button" onClick={() => startTransition(() => { void load(); })} disabled={pending} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button>
    </header>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {!error && cashUps.length === 0 ? <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" /><h2 className="mt-2 font-bold text-emerald-900">No cash-ups awaiting review</h2><p className="mt-1 text-sm text-emerald-800">New manager-verified cash-ups will appear here.</p></section> : <div className="space-y-4">{cashUps.map((cashUp) => {
      const staff = Array.isArray(cashUp.staff) ? cashUp.staff[0] : cashUp.staff;
      const manager = Array.isArray(cashUp.manager) ? cashUp.manager[0] : cashUp.manager;
      const business = Array.isArray(cashUp.business) ? cashUp.business[0] : cashUp.business;
      const shortage = Math.max(0, -Number(cashUp.variance ?? 0));
      return <article key={cashUp.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#9A7410]">{business?.name ?? "Business"} · {cashUp.reconciliation_date}</p><h2 className="mt-1 text-lg font-bold text-[#03162F]">{staffName(staff)}</h2><p className="mt-1 text-xs text-slate-500">Manager verified by {staffName(manager)} · {cashUp.manager_verified_at ? new Date(cashUp.manager_verified_at).toLocaleString("en-ZM") : "Manager verification recorded"}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Locked · awaiting Accounts</span></div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4"><Amount label="Opening float" value={money(cashUp.opening_float)} /><Amount label="Cash drops" value={money(cashUp.cash_dropped)} /><Amount label="Expected till" value={money(cashUp.expected_cash)} /><Amount label="Counted till" value={money(cashUp.counted_cash)} /><Amount label="Variance" value={money(cashUp.variance)} /><Amount label="Salary deduction requested" value={money(cashUp.salary_deduction_amount)} /><div className="rounded-xl border border-slate-200 p-3 sm:col-span-2"><p className="text-xs font-semibold text-slate-500">Manager shortage explanation</p><p className="mt-1 text-sm text-slate-800">{cashUp.notes || "No shortage explanation."}</p><p className="mt-2 text-xs font-semibold text-slate-500">Salary deduction note</p><p className="mt-1 text-sm text-slate-800">{cashUp.salary_deduction_note || "No deduction requested."}</p></div></div>
        <div className="border-t border-slate-100 p-5"><label className="block text-xs font-semibold text-slate-600">Accounts review note {" "}{notes[cashUp.id]?.trim() ? "" : "(required to return)"}<textarea rows={2} value={notes[cashUp.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [cashUp.id]: event.target.value }))} placeholder="Add an approval note or explain what the manager must correct…" className={fieldClass} /></label><div className="mt-3 flex flex-wrap justify-end gap-2"><button type="button" disabled={pending || !notes[cashUp.id]?.trim()} onClick={() => decide(cashUp, "return")} className="rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 disabled:opacity-50">Return to manager</button><button type="button" disabled={pending} onClick={() => decide(cashUp, "approve")} className="inline-flex items-center gap-2 rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Confirm cash-up</button></div></div>
      </article>;
    })}</div>}
  </main>;
}

function Amount({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-bold tabular-nums text-[#03162F]">{value}</p></div>; }
