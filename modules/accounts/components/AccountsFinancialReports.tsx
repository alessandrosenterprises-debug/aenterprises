"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDownToLine, Scale, TrendingUp, WalletCards } from "lucide-react";
import { getAccountsFinancialReport } from "@/app/dashboard/accounts/actions";

type Data = Awaited<ReturnType<typeof getAccountsFinancialReport>>;
const control = "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#03162F] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-amber-100";
const money = (value: number) => `ZMW ${value.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AccountsFinancialReports({ initialData, today }: { initialData: Data; today: string }) {
  const [data, setData] = useState(initialData);
  const [from, setFrom] = useState(initialData.startDate);
  const [to, setTo] = useState(initialData.endDate);
  const [pending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      try { setData(await getAccountsFinancialReport(from, to)); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Financial reports could not be generated."); }
    });
  }

  function exportCsv() {
    const rows = [["Account code", "Account", "Type", "Period movement", "Closing balance"], ...data.accounts.map((row) => [row.code, row.name, row.account_type, row.period.toFixed(2), row.closing.toFixed(2)])];
    const escaped = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([escaped], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `aeos-accounts-report-${data.startDate}-to-${data.endDate}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  const trialBalanced = Math.abs(data.totals.trialDebits - data.totals.trialCredits) < 0.01;
  const positionBalanced = Math.abs(data.totals.assets - data.totals.liabilitiesAndEquity) < 0.01;
  return <main className="w-full space-y-5 pb-8">
    <header className="sticky top-0 z-20 -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-4 bg-[#03162F] px-6 py-5 text-white shadow-lg"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#D4AF37] p-3 text-[#03162F]"><TrendingUp className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Accounts · Posted ledger only</p><h1 className="text-xl font-black">Financial statements & trial balance</h1><p className="mt-1 text-xs text-slate-300">Generate statement views from posted journal entries for a selected period.</p></div></div><button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2.5 text-sm font-semibold"><ArrowDownToLine className="h-4 w-4" />Export CSV</button></header>

    <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><label className="text-xs font-semibold text-slate-600">From<input type="date" value={from} max={today} onChange={(event) => setFrom(event.target.value)} className={`${control} mt-1 block`} /></label><label className="text-xs font-semibold text-slate-600">To<input type="date" value={to} max={today} onChange={(event) => setTo(event.target.value)} className={`${control} mt-1 block`} /></label><button type="button" disabled={pending || !from || !to || from > to} onClick={generate} className="rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{pending ? "Generating…" : "Generate reports"}</button><span className="text-xs text-slate-500">{data.startDate} to {data.endDate}</span></section>

    <div role="note" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">These statements use posted journals only. The chart opens with zero balances until operational events are reconciled and posted. AEOS does not automatically treat order revenue, cash receipts or payroll figures as ledger postings without an approved source-to-account mapping.</div>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Period income" value={money(data.totals.income)} icon={TrendingUp} /><Metric label="Period expenses" value={money(data.totals.expense)} icon={WalletCards} /><Metric label="Period net result" value={money(data.totals.netProfit)} icon={Scale} /><Metric label="Assets at period end" value={money(data.totals.assets)} icon={WalletCards} /></section>

    <section className="grid gap-4 xl:grid-cols-2">
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-3"><h2 className="font-black text-[#03162F]">Trial balance</h2><p className="mt-1 text-xs text-slate-500">Closing balances as of {data.endDate}</p></div><div className="grid grid-cols-2 gap-3 p-4"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Total debits</p><p className="mt-1 font-black tabular-nums text-[#03162F]">{money(data.totals.trialDebits)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Total credits</p><p className="mt-1 font-black tabular-nums text-[#03162F]">{money(data.totals.trialCredits)}</p></div></div><div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-2">Code · account</th><th className="px-4 py-2">Type</th><th className="px-4 py-2 text-right">Debit</th><th className="px-4 py-2 text-right">Credit</th></tr></thead><tbody className="divide-y divide-slate-100">{data.accounts.filter((row) => Math.abs(row.closing) > 0.009).map((row) => { const debitNormal = row.account_type === "asset" || row.account_type === "expense"; const debit = debitNormal ? Math.max(0, row.closing) : Math.max(0, -row.closing); const credit = debitNormal ? Math.max(0, -row.closing) : Math.max(0, row.closing); return <tr key={row.id}><td className="px-4 py-2 font-semibold text-[#03162F]">{row.code} · {row.name}</td><td className="px-4 py-2 capitalize text-slate-500">{row.account_type}</td><td className="px-4 py-2 text-right tabular-nums">{debit ? money(debit) : "—"}</td><td className="px-4 py-2 text-right tabular-nums">{credit ? money(credit) : "—"}</td></tr>; })}</tbody></table>{!trialBalanced && <p className="m-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-800">Trial balance does not balance. Review the journal register before relying on this report.</p>}</div></article>

      <article className="space-y-4"><Statement title="Income statement" subtitle={`${data.startDate} through ${data.endDate}`} rows={[...data.accounts.filter((row) => row.account_type === "income" && Math.abs(row.period) > 0.009).map((row) => ({ label: row.name, value: row.period })), ...data.accounts.filter((row) => row.account_type === "expense" && Math.abs(row.period) > 0.009).map((row) => ({ label: row.name, value: -row.period }))]} totalLabel="Net result" total={data.totals.netProfit} empty="No posted income or expense journals for this period." /><Statement title="Statement of financial position" subtitle={`Closing balances as of ${data.endDate}`} rows={[...data.accounts.filter((row) => row.account_type === "asset" && Math.abs(row.closing) > 0.009).map((row) => ({ label: row.name, value: row.closing })), ...data.accounts.filter((row) => row.account_type === "liability" && Math.abs(row.closing) > 0.009).map((row) => ({ label: row.name, value: -row.closing })), ...data.accounts.filter((row) => row.account_type === "equity" && Math.abs(row.closing) > 0.009).map((row) => ({ label: row.name, value: -row.closing })), { label: "Retained earnings to date", value: -data.totals.retainedEarnings }]} totalLabel="Assets less liabilities, equity & retained earnings" total={data.totals.assets - data.totals.liabilitiesAndEquity} empty="No posted balance sheet journals yet." /><p className={`rounded-xl p-3 text-sm font-bold ${positionBalanced && trialBalanced ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{positionBalanced && trialBalanced ? "Ledger balances are in agreement." : "Review journal postings and closing balances."}</p></article>
    </section>
  </main>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof WalletCards }) { return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Icon className="h-4 w-4" />{label}</div><p className="mt-3 text-xl font-black tabular-nums text-[#03162F]">{value}</p></article>; }
function Statement({ title, subtitle, rows, totalLabel, total, empty }: { title: string; subtitle: string; rows: { label: string; value: number }[]; totalLabel: string; total: number; empty: string }) { const display = (value: number) => value < 0 ? `(${money(Math.abs(value))})` : money(value); return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-3"><h2 className="font-black text-[#03162F]">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div>{rows.length ? <div className="divide-y divide-slate-100">{rows.map((row, index) => <div key={`${row.label}-${index}`} className="flex justify-between gap-3 px-4 py-2.5 text-sm"><span className="text-slate-600">{row.label}</span><span className="font-semibold tabular-nums text-[#03162F]">{display(row.value)}</span></div>)}</div> : <p className="px-4 py-5 text-sm text-slate-500">{empty}</p>}<div className="flex justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black"><span>{totalLabel}</span><span className="tabular-nums">{display(total)}</span></div></article>; }
