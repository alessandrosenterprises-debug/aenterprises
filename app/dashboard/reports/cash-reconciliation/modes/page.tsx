"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getCashTransactionModes, saveCashTransactionMode } from "../actions";

type Mode = Awaited<ReturnType<typeof getCashTransactionModes>>[number];
const fieldClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#03162F] outline-none focus:border-[#D9B52B] focus:ring-2 focus:ring-[#D9B52B]/20";

export default function CashTransactionModesPage() {
  const [modes, setModes] = useState<Mode[]>([]);
  const [name, setName] = useState("");
  const [affectsCash, setAffectsCash] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const load = useCallback(async () => {
    setError("");
    try { setModes(await getCashTransactionModes()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Payment modes could not be loaded."); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await saveCashTransactionMode({ name, affectsCashBalance: affectsCash });
        toast.success("Payment mode added.");
        setName(""); setAffectsCash(false);
        await load();
      } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Payment mode could not be saved."); }
    });
  }

  function toggleMode(mode: Mode) {
    startTransition(async () => {
      try {
        await saveCashTransactionMode({ name: mode.name, affectsCashBalance: mode.affects_cash_balance, active: !mode.active });
        toast.success(`${mode.name} ${mode.active ? "deactivated" : "activated"}.`);
        await load();
      } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Payment mode could not be updated."); }
    });
  }

  return <main className="w-full space-y-5 pb-8">
    <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-3 bg-[#03162F] px-6 py-5 text-white shadow-lg">
      <div className="flex items-center gap-3"><Link href="/dashboard/reports/cash-reconciliation" aria-label="Back to reconciliation" className="rounded-lg border border-white/15 bg-white/10 p-2 text-white hover:bg-white/15"><ArrowLeft className="h-4 w-4" /></Link><span className="rounded-xl bg-[#D9B52B] p-3 text-[#03162F]"><Banknote className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#E8CA62]">Till setup</p><h1 className="text-xl font-black text-white">Payment modes</h1><p className="text-xs text-slate-300">Manage the methods staff can select when recording transactions.</p></div></div>
      <button type="button" onClick={() => startTransition(() => { void load(); })} disabled={pending} className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"><RefreshCw className="h-4 w-4" />Refresh</button>
    </header>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    <form onSubmit={save} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto_auto] md:items-end">
      <label className="text-xs font-semibold text-slate-600">New payment mode<input required minLength={2} maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. POS terminal" className={fieldClass} /></label>
      <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700"><input type="checkbox" checked={affectsCash} onChange={(event) => setAffectsCash(event.target.checked)} />Counts as physical till cash</label>
      <button disabled={pending || !name.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#03162F] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Plus className="h-4 w-4" />Add mode</button>
    </form>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-[#03162F]">Available payment modes</h2><p className="mt-1 text-xs text-slate-500">New active modes appear immediately in the cashier transaction form. Till balances include only modes marked as physical cash.</p></div>
      {!modes.length ? <p className="p-8 text-center text-sm text-slate-500">No payment modes loaded.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Payment mode", "Till treatment", "Availability", "Action"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead><tbody>{modes.map((mode) => <tr key={mode.id} className="border-t border-slate-100"><td className="px-5 py-3 font-semibold text-[#03162F]">{mode.name}</td><td className="px-5 py-3">{mode.affects_cash_balance ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Counts as till cash</span> : <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Non-cash</span>}</td><td className="px-5 py-3">{mode.active ? "Active" : "Inactive"}</td><td className="px-5 py-3"><button type="button" disabled={pending} onClick={() => toggleMode(mode)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#03162F] disabled:opacity-50">{mode.active ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
