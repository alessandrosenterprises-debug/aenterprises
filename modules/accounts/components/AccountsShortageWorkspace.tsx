"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, BadgeCheck, CircleDollarSign, RefreshCw, WalletCards } from "lucide-react";
import { applyShortageDeductionsToPayroll } from "@/app/dashboard/accounts/actions";

type Data = Awaited<ReturnType<typeof import("@/app/dashboard/accounts/actions").getAccountsShortageData>>;
const money = (value: number | string | null) => `ZMW ${Number(value ?? 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AccountsShortageWorkspace({ data }: { data: Data }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [runId, setRunId] = useState(data.payrollRuns[0]?.id ?? "");
  const pendingRows = data.deductions.filter((row) => row.status === "pending_payroll");
  const includedRows = data.deductions.filter((row) => row.status === "included");
  const paidRows = data.deductions.filter((row) => row.status === "paid");
  const pendingAmount = pendingRows.reduce((sum, row) => sum + Number(row.amount), 0);

  function apply() {
    startTransition(async () => {
      try {
        const result = await applyShortageDeductionsToPayroll(runId);
        toast.success(result.applied ? `${result.applied} shortage deduction(s) added to payroll.` : "There are no approved shortages waiting for payroll.");
        router.refresh();
      } catch (error) { toast.error(error instanceof Error ? error.message : "Shortage deductions could not be applied."); }
    });
  }

  return <main className="w-full space-y-5 pb-8">
    <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-4 bg-[#03162F] px-6 py-5 text-white shadow-lg"><div className="flex items-center gap-3"><span className="rounded-xl bg-rose-100 p-3 text-rose-800"><AlertTriangle className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Accounts · Cash control</p><h1 className="text-xl font-black">Shortages & payroll recovery</h1><p className="mt-1 text-xs text-slate-300">Only Accounts-approved deductions can enter an open payroll run.</p></div></div><button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold"><RefreshCw className="h-4 w-4" />Refresh</button></header>
    <section className="grid gap-3 sm:grid-cols-3"><Metric label="Awaiting payroll" value={String(pendingRows.length)} amount={money(pendingAmount)} icon={AlertTriangle} tone="rose" /><Metric label="Included in open payroll" value={String(includedRows.length)} amount={money(includedRows.reduce((sum, row) => sum + Number(row.amount), 0))} icon={WalletCards} tone="amber" /><Metric label="Recovered through paid payroll" value={String(paidRows.length)} amount={money(paidRows.reduce((sum, row) => sum + Number(row.amount), 0))} icon={BadgeCheck} tone="green" /></section>

    {data.canManage && <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"><label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">Open payroll run<select value={runId} onChange={(event) => setRunId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-[#03162F]"><option value="">Choose a draft or processing payroll run</option>{data.payrollRuns.map((run) => <option key={run.id} value={run.id}>{run.period?.name ?? "Payroll period"} · {run.status} · {run.id.slice(0, 8)}</option>)}</select></label><button type="button" disabled={pending || !runId || pendingRows.length === 0} onClick={apply} className="rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Add approved shortages to payroll</button></section>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h2 className="font-black text-[#03162F]">Shortage deduction register</h2><p className="mt-1 text-xs text-slate-500">The cash-up review is the approval source; this register tracks the deduction through payroll.</p></div>{!data.deductions.length ? <div className="p-12 text-center"><CircleDollarSign className="mx-auto h-9 w-9 text-slate-300" /><h3 className="mt-3 font-bold text-[#03162F]">No approved shortage deductions</h3><p className="mt-1 text-sm text-slate-500">When Accounts approves a shortage with a deduction note, it will appear here.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Employee / cashier</th><th className="px-4 py-3">Business · cash-up date</th><th className="px-4 py-3">Shortage reason</th><th className="px-4 py-3 text-right">Deduction</th><th className="px-4 py-3">Payroll status</th></tr></thead><tbody className="divide-y divide-slate-100">{data.deductions.map((row) => { const reconciliation = Array.isArray(row.reconciliation) ? row.reconciliation[0] : row.reconciliation; const business = Array.isArray(reconciliation?.business) ? reconciliation.business[0] : reconciliation?.business; const staff = Array.isArray(reconciliation?.staff) ? reconciliation.staff[0] : reconciliation?.staff; const staffName = staff?.display_name || [staff?.first_name, staff?.last_name].filter(Boolean).join(" ") || staff?.email || "Staff member"; const statusTone = row.status === "paid" ? "bg-emerald-100 text-emerald-800" : row.status === "included" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-900"; return <tr key={row.id}><td className="px-4 py-3"><p className="font-bold text-[#03162F]">{row.employee?.full_name ?? "Employee record"}</p><p className="mt-0.5 text-xs text-slate-500">Cashier: {staffName}</p></td><td className="px-4 py-3 text-xs text-slate-600">{business?.name ?? "Business"}<br />{reconciliation?.reconciliation_date ?? "—"}</td><td className="max-w-sm px-4 py-3 text-xs leading-5 text-slate-600">{row.reason}</td><td className="px-4 py-3 text-right font-black tabular-nums text-rose-700">{money(row.amount)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusTone}`}>{row.status.replaceAll("_", " ")}</span>{row.included_at && <p className="mt-1 text-[11px] text-slate-500">Added {new Date(row.included_at).toLocaleDateString("en-ZM")}</p>}</td></tr>; })}</tbody></table></div>}</section>
  </main>;
}

function Metric({ label, value, amount, icon: Icon, tone }: { label: string; value: string; amount: string; icon: typeof AlertTriangle; tone: string }) { const colors: Record<string, string> = { rose: "bg-rose-50 text-rose-700", amber: "bg-amber-50 text-amber-800", green: "bg-emerald-50 text-emerald-800" }; return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><span className={`rounded-lg p-2 ${colors[tone]}`}><Icon className="h-4 w-4" /></span><span className="text-xs font-semibold text-slate-500">{label}</span></div><p className="mt-3 text-xl font-black text-[#03162F]">{value} records</p><p className="mt-1 text-sm font-bold tabular-nums text-slate-700">{amount}</p></article>; }
