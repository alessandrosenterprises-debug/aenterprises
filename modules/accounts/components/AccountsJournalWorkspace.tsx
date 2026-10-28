"use client";

import { useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpenCheck, Plus, Save, Send, Trash2 } from "lucide-react";
import { createAccountsChartAccount, createAccountsJournalDraft, createPayrollJournalDraft, postAccountsJournal } from "@/app/dashboard/accounts/actions";

type Data = Awaited<ReturnType<typeof import("@/app/dashboard/accounts/actions").getAccountsJournalData>>;
type JournalLine = { accountId: string; description: string; debit: string; credit: string };
const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#03162F] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-amber-100";
const money = (value: number | string | null) => `ZMW ${Number(value ?? 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AccountsJournalWorkspace({ data }: { data: Data }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [entryDate, setEntryDate] = useState(data.today);
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: "", description: "", debit: "", credit: "" },
    { accountId: "", description: "", debit: "", credit: "" },
  ]);
  const [newAccount, setNewAccount] = useState({ code: "", name: "", accountType: "expense" as "asset" | "liability" | "equity" | "income" | "expense" });
  const [showAccounts, setShowAccounts] = useState(false);
  const [payrollRunId, setPayrollRunId] = useState("");
  const debits = useMemo(() => lines.reduce((sum, line) => sum + Number(line.debit || 0), 0), [lines]);
  const credits = useMemo(() => lines.reduce((sum, line) => sum + Number(line.credit || 0), 0), [lines]);
  const balanced = debits > 0 && Math.abs(debits - credits) < 0.01;

  function updateLine(index: number, key: keyof JournalLine, value: string) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [key]: value, ...(key === "debit" && Number(value) > 0 ? { credit: "" } : {}), ...(key === "credit" && Number(value) > 0 ? { debit: "" } : {}) } : line));
  }

  function saveDraft() {
    startTransition(async () => {
      try {
        const result = await createAccountsJournalDraft({ entryDate, memo, lines: lines.map((line) => ({ accountId: line.accountId, description: line.description, debit: Number(line.debit || 0), credit: Number(line.credit || 0) })) });
        toast.success(`Journal #${result.id.slice(0, 8)} saved as a draft.`);
        setMemo(""); setLines([{ accountId: "", description: "", debit: "", credit: "" }, { accountId: "", description: "", debit: "", credit: "" }]);
        router.refresh();
      } catch (error) { toast.error(error instanceof Error ? error.message : "Journal could not be saved."); }
    });
  }

  function post(entryId: string) {
    startTransition(async () => {
      try { await postAccountsJournal(entryId); toast.success("Balanced journal posted to the ledger."); router.refresh(); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Journal could not be posted."); }
    });
  }

  function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try { await createAccountsChartAccount(newAccount); toast.success("Account added to the chart."); setNewAccount({ code: "", name: "", accountType: "expense" }); router.refresh(); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Account could not be added."); }
    });
  }

  function importPayroll() {
    startTransition(async () => {
      try {
        const result = await createPayrollJournalDraft(payrollRunId);
        toast.success(`Payroll journal draft ${result.id.slice(0, 8)} created. Review it, then post when ready.`);
        setPayrollRunId("");
        router.refresh();
      } catch (error) { toast.error(error instanceof Error ? error.message : "Payroll journal could not be created."); }
    });
  }

  return <main className="w-full space-y-5 pb-8">
    <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-3 bg-[#03162F] px-6 py-5 text-white shadow-lg"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#D4AF37] p-3 text-[#03162F]"><BookOpenCheck className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Accounts · Double-entry bookkeeping</p><h1 className="text-xl font-black">General ledger journals</h1><p className="mt-1 text-xs text-slate-300">Record balanced entries and preserve an audit-ready posting trail.</p></div></div><span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">{data.accounts.length} active accounts</span></header>

    {data.canManage && <>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex sm:items-end sm:justify-between sm:gap-4"><div><h2 className="font-black text-[#03162F]">Transfer finalized payroll to ledger</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">Creates a balanced draft from payroll and reviewed NAPSA, NHIMA and PAYE schedules. Shortage recovery and loan deductions are posted against their receivable accounts. Review the draft before posting.</p>{data.payrollNeedsMigration && <p className="mt-2 text-xs font-semibold text-rose-700">Payroll run list is unavailable. Confirm payroll database migrations are installed.</p>}</div><div className="mt-3 flex w-full gap-2 sm:mt-0 sm:max-w-xl"><select value={payrollRunId} onChange={(event) => setPayrollRunId(event.target.value)} className={`${inputClass} min-w-0`}><option value="">Choose finalized payroll</option>{data.payrollRuns.map((run) => { const period = Array.isArray(run.period) ? run.period[0] : run.period; return <option key={run.id} value={run.id}>{period?.name ?? "Payroll"} · {run.status}</option>; })}</select><button type="button" disabled={pending || !payrollRunId} onClick={importPayroll} className="shrink-0 rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Prepare journal</button></div></section>
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-[#03162F]">New balanced journal</h2><p className="mt-1 text-xs text-slate-500">Debits must equal credits. Posted journals are immutable.</p></div><div className="space-y-4 p-5"><div className="grid gap-3 sm:grid-cols-[180px_1fr]"><label className="text-xs font-semibold text-slate-600">Entry date<input type="date" value={entryDate} max={data.today} onChange={(event) => setEntryDate(event.target.value)} className={`${inputClass} mt-1`} /></label><label className="text-xs font-semibold text-slate-600">Memo / business purpose<input maxLength={240} value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="e.g. Record monthly payroll liabilities" className={`${inputClass} mt-1`} /></label></div>
        <div className="space-y-2">{lines.map((line, index) => <div key={index} className="grid items-end gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.5fr_1fr_0.65fr_0.65fr_auto]"><label className="text-[11px] font-semibold text-slate-500">Account<select value={line.accountId} onChange={(event) => updateLine(index, "accountId", event.target.value)} className={`${inputClass} mt-1`}><option value="">Choose account</option>{data.accounts.map((account) => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}</select></label><label className="text-[11px] font-semibold text-slate-500">Line description<input value={line.description} onChange={(event) => updateLine(index, "description", event.target.value)} placeholder="Optional detail" className={`${inputClass} mt-1`} /></label><label className="text-[11px] font-semibold text-slate-500">Debit<input type="number" min="0" step="0.01" value={line.debit} onChange={(event) => updateLine(index, "debit", event.target.value)} placeholder="0.00" className={`${inputClass} mt-1 text-right tabular-nums`} /></label><label className="text-[11px] font-semibold text-slate-500">Credit<input type="number" min="0" step="0.01" value={line.credit} onChange={(event) => updateLine(index, "credit", event.target.value)} placeholder="0.00" className={`${inputClass} mt-1 text-right tabular-nums`} /></label><button type="button" aria-label="Remove journal line" disabled={lines.length <= 2} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>)}</div>
        <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => setLines((current) => [...current, { accountId: "", description: "", debit: "", credit: "" }])} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-[#03162F]"><Plus className="h-4 w-4" />Add line</button><div className="flex items-center gap-4 text-sm"><span>Debits <b className="tabular-nums">{money(debits)}</b></span><span>Credits <b className="tabular-nums">{money(credits)}</b></span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${balanced ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{balanced ? "Balanced" : "Out of balance"}</span><button type="button" disabled={pending || !balanced || !memo.trim() || lines.some((line) => !line.accountId)} onClick={saveDraft} className="inline-flex items-center gap-2 rounded-lg bg-[#03162F] px-4 py-2.5 font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />Save draft</button></div></div>
      </div></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-2"><div><h2 className="font-black text-[#03162F]">Chart of accounts</h2><p className="mt-1 text-xs text-slate-500">Core balance sheet and income accounts.</p></div><button type="button" onClick={() => setShowAccounts((shown) => !shown)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">{showAccounts ? "Close" : "Add account"}</button></div>
        {showAccounts && <form onSubmit={addAccount} className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3"><input required pattern="[0-9]{3,8}" value={newAccount.code} onChange={(event) => setNewAccount((current) => ({ ...current, code: event.target.value }))} placeholder="Account code" className={inputClass} /><input required minLength={2} maxLength={100} value={newAccount.name} onChange={(event) => setNewAccount((current) => ({ ...current, name: event.target.value }))} placeholder="Account name" className={inputClass} /><select value={newAccount.accountType} onChange={(event) => setNewAccount((current) => ({ ...current, accountType: event.target.value as typeof current.accountType }))} className={inputClass}><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="income">Income</option><option value="expense">Expense</option></select><button disabled={pending} className="w-full rounded-lg bg-[#03162F] px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Save chart account</button></form>}
        <div className="mt-4 max-h-96 space-y-1 overflow-y-auto">{data.accounts.map((account) => <div key={account.id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-xs"><span className="font-bold tabular-nums text-[#03162F]">{account.code}</span><span className="min-w-0 flex-1 truncate px-2 text-slate-700">{account.name}</span><span className="rounded bg-slate-100 px-2 py-1 capitalize text-slate-500">{account.account_type}</span></div>)}</div>
      </article>
      </section>
    </>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-[#03162F]">Journal register</h2><p className="mt-1 text-xs text-slate-500">Recent drafts and posted entries</p></div>{data.journals.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No journal entries have been recorded yet.</div> : <div className="divide-y divide-slate-100">{data.journals.map((journal) => {
      const debit = journal.lines.reduce((sum, line) => sum + Number(line.debit ?? 0), 0);
      const credit = journal.lines.reduce((sum, line) => sum + Number(line.credit ?? 0), 0);
      return <article key={journal.id} className="p-4 sm:px-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="font-black text-[#03162F]">JE-{String(journal.entry_number).padStart(5, "0")}</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${journal.status === "posted" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{journal.status}</span></div><p className="mt-1 font-semibold text-slate-800">{journal.memo}</p><p className="mt-1 text-xs text-slate-500">{journal.entry_date} · {journal.lines.length} lines</p></div><div className="text-right"><p className="text-sm font-black tabular-nums text-[#03162F]">{money(debit)}</p><p className="text-xs text-slate-500">Debits · credits {money(credit)}</p>{data.canManage && journal.status === "draft" && <button type="button" disabled={pending || Math.abs(debit - credit) > 0.009 || debit <= 0} onClick={() => post(journal.id)} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#03162F] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" />Post journal</button>}</div></div><details className="mt-3 rounded-lg border border-slate-200"><summary className="cursor-pointer px-3 py-2 text-xs font-bold text-slate-600">View journal lines</summary><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2">Account</th><th className="px-3 py-2">Description</th><th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Credit</th></tr></thead><tbody>{journal.lines.map((line) => { const account = Array.isArray(line.account) ? line.account[0] : line.account; return <tr key={line.id} className="border-t border-slate-100"><td className="px-3 py-2 font-semibold">{account?.code} · {account?.name}</td><td className="px-3 py-2">{line.description || journal.memo}</td><td className="px-3 py-2 text-right tabular-nums">{Number(line.debit) > 0 ? money(line.debit) : "—"}</td><td className="px-3 py-2 text-right tabular-nums">{Number(line.credit) > 0 ? money(line.credit) : "—"}</td></tr>; })}</tbody></table></div></details></article>;
    })}</div>}</section>
  </main>;
}
