"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownToLine, CheckCircle2, CircleDollarSign, FileCheck2, Landmark, RefreshCw, ShieldCheck } from "lucide-react";
import { generateStatutorySchedules, markStatutoryFiled, markStatutoryPaid } from "@/app/dashboard/accounts/statutory/actions";

type StatutoryData = Awaited<ReturnType<typeof import("@/app/dashboard/accounts/statutory/actions").getAccountsStatutoryData>>;
type Schedule = StatutoryData["schedules"][number];
const controlClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#03162F] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-amber-100";
const money = (value: number | string | null) => `ZMW ${Number(value ?? 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function StatutoryRemittancesWorkspace({ initialData }: { initialData: StatutoryData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [references, setReferences] = useState<Record<string, string>>({});
  const [authorityFilter, setAuthorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const schedules = useMemo(() => initialData.schedules.filter((row) => (authorityFilter === "all" || row.authority === authorityFilter) && (statusFilter === "all" || row.status === statusFilter)), [initialData.schedules, authorityFilter, statusFilter]);
  const totals = initialData.schedules.reduce((result, row) => ({
    employee: result.employee + Number(row.employee_amount ?? 0),
    employer: result.employer + Number(row.employer_amount ?? 0),
    paid: result.paid + (row.status === "paid" ? Number(row.total_amount ?? 0) : 0),
    open: result.open + (row.status !== "paid" ? Number(row.total_amount ?? 0) : 0),
  }), { employee: 0, employer: 0, paid: 0, open: 0 });

  function generate() {
    startTransition(async () => {
      try {
        const result = await generateStatutorySchedules();
        toast.success(result.saved ? `${result.saved} statutory schedules generated from finalized payroll.` : "Schedules are already up to date.");
        router.refresh();
      } catch (error) { toast.error(error instanceof Error ? error.message : "Statutory schedules could not be generated."); }
    });
  }

  function advance(schedule: Schedule) {
    const value = references[schedule.id] ?? "";
    startTransition(async () => {
      try {
        if (schedule.status === "draft") await markStatutoryFiled(schedule.id, value);
        else await markStatutoryPaid(schedule.id, value);
        setReferences((current) => ({ ...current, [schedule.id]: "" }));
        toast.success(schedule.status === "draft" ? "Return marked as filed." : "Payment marked as confirmed.");
        router.refresh();
      } catch (error) { toast.error(error instanceof Error ? error.message : "The statutory status could not be saved."); }
    });
  }

  function exportCsv() {
    const quote = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
    const rows = [["Authority", "Payroll period", "Period end", "Due date", "Employee contribution", "Employer contribution", "Total", "Status", "Filing reference", "Payment reference"], ...schedules.map((row) => [row.authority, row.period_name, row.period_end, row.due_date, row.employee_amount, row.employer_amount, row.total_amount, row.status, row.filing_reference ?? "", row.payment_reference ?? ""])];
    const blob = new Blob([rows.map((row) => row.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "aeos-statutory-remittances.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  return <main className="w-full space-y-5 pb-8">
    <header className="sticky top-0 z-20 -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-4 bg-[#03162F] px-6 py-5 text-white shadow-lg">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-[#D4AF37] p-3 text-[#03162F]"><Landmark className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Accounts · Payroll liabilities</p><h1 className="text-xl font-black">NAPSA, NHIMA & PAYE</h1><p className="mt-1 text-xs text-slate-300">Generate employee schedules from finalized payroll, record return references and confirm remittances.</p></div></div>
      <div className="flex flex-wrap gap-2">{initialData.canManage && <><Link href="/dashboard/hr/payroll/settings" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2.5 text-sm font-semibold text-white">Employee payroll setup</Link><button type="button" disabled={pending} onClick={generate} className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#03162F] disabled:opacity-50"><FileCheck2 className="h-4 w-4" />Generate from payroll</button></>}<button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2.5 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4" />Refresh</button><button type="button" onClick={exportCsv} disabled={!schedules.length} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><ArrowDownToLine className="h-4 w-4" />Export CSV</button></div>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Employee deductions" value={money(totals.employee)} note="Withheld from generated payroll" icon={CircleDollarSign} />
      <StatCard label="Employer contributions" value={money(totals.employer)} note="Employer statutory share" icon={Landmark} />
      <StatCard label="Outstanding remittances" value={money(totals.open)} note={`${initialData.schedules.filter((row) => row.status !== "paid").length} filed or pending schedules`} icon={ShieldCheck} />
      <StatCard label="Confirmed paid" value={money(totals.paid)} note="Payment reference recorded" icon={CheckCircle2} />
    </section>

    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Statutory rules:</strong> the linked payroll rules are seeded with current reference rates and an effective year. Confirm employee eligibility, contribution bases, NAPSA ceiling, PAYE tax tables and any policy updates against the authorities before every payroll. AEOS records filings and payments; it does not submit directly to NAPSA, NHIMA or ZRA.</section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h2 className="font-black text-[#03162F]">Remittance schedules</h2><p className="mt-1 text-xs text-slate-500">Every schedule retains a per-employee amount and member number snapshot.</p></div><div className="flex flex-wrap gap-2"><select aria-label="Filter authority" value={authorityFilter} onChange={(event) => setAuthorityFilter(event.target.value)} className={controlClass}><option value="all">All authorities</option><option value="NAPSA">NAPSA</option><option value="NHIMA">NHIMA</option><option value="PAYE">PAYE · ZRA</option></select><select aria-label="Filter schedule status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={controlClass}><option value="all">All statuses</option><option value="draft">Needs filing</option><option value="filed">Filed · payment due</option><option value="paid">Paid</option></select></div></div>
      {!schedules.length ? <div className="p-12 text-center"><FileCheck2 className="mx-auto h-9 w-9 text-slate-300" /><h3 className="mt-3 font-bold text-[#03162F]">No matching statutory schedules</h3><p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">Finalize payroll in the HR Payroll workspace, then choose Generate from payroll. AEOS will prepare NAPSA, NHIMA and PAYE schedules for review.</p></div> : <div className="divide-y divide-slate-100">{schedules.map((schedule) => {
        const rows = initialData.lines.filter((line) => line.schedule_id === schedule.id);
        const statusTone = schedule.status === "paid" ? "bg-emerald-100 text-emerald-800" : schedule.status === "filed" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-900";
        const nextLabel = schedule.status === "draft" ? "Return reference" : "Payment reference";
        const due = new Date(`${schedule.due_date}T00:00:00`).toLocaleDateString("en-ZM", { dateStyle: "medium" });
        return <article key={schedule.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-[#03162F] px-2.5 py-1 text-xs font-bold text-white">{schedule.authority === "PAYE" ? "PAYE · ZRA" : schedule.authority}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusTone}`}>{schedule.status === "draft" ? "Needs filing" : schedule.status === "filed" ? "Filed · payment due" : "Paid"}</span></div><h3 className="mt-2 text-base font-black text-[#03162F]">{schedule.period_name}</h3><p className="mt-1 text-xs text-slate-500">Payroll period ends {schedule.period_end} · due {due} · {rows.length} employee records</p></div><div className="text-right"><p className="text-xs font-semibold text-slate-500">Total remittance</p><p className="text-lg font-black tabular-nums text-[#03162F]">{money(schedule.total_amount)}</p><p className="mt-1 text-xs text-slate-500">Employee {money(schedule.employee_amount)} · Employer {money(schedule.employer_amount)}</p></div></div>
          {initialData.canManage && schedule.status !== "paid" && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor={`reference-${schedule.id}`}>{nextLabel}</label><input id={`reference-${schedule.id}`} value={references[schedule.id] ?? ""} onChange={(event) => setReferences((current) => ({ ...current, [schedule.id]: event.target.value }))} placeholder={schedule.status === "draft" ? "Enter filing / return reference" : "Enter payment / bank reference"} className={`${controlClass} min-w-0 flex-1`} /><button type="button" disabled={pending || (references[schedule.id] ?? "").trim().length < 2} onClick={() => advance(schedule)} className="rounded-lg bg-[#03162F] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{schedule.status === "draft" ? "Mark return filed" : "Confirm payment"}</button></div>}
          {(schedule.filing_reference || schedule.payment_reference) && <p className="mt-2 text-xs text-slate-500">{schedule.filing_reference && <>Filing: <strong>{schedule.filing_reference}</strong></>}{schedule.filing_reference && schedule.payment_reference && " · "}{schedule.payment_reference && <>Payment: <strong>{schedule.payment_reference}</strong></>}</p>}
          <details className="mt-4 rounded-lg border border-slate-200"><summary className="cursor-pointer px-3 py-2 text-xs font-bold text-slate-700">View employee schedule</summary><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-3 py-2">Employee</th><th className="px-3 py-2">NAPSA number</th><th className="px-3 py-2">NHIMA number</th><th className="px-3 py-2 text-right">Employee share</th><th className="px-3 py-2 text-right">Employer share</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((line) => { const employee = Array.isArray(line.employee) ? line.employee[0] : line.employee; return <tr key={line.id}><td className="px-3 py-2 font-semibold text-[#03162F]">{employee?.full_name ?? "Employee record"}</td><td className="px-3 py-2">{line.napsa_number || "Not recorded"}</td><td className="px-3 py-2">{line.nhima_number || "Not recorded"}</td><td className="px-3 py-2 text-right tabular-nums">{money(line.employee_amount)}</td><td className="px-3 py-2 text-right tabular-nums">{money(line.employer_amount)}</td></tr>; })}</tbody></table></div></details>
        </article>;
      })}</div>}
    </section>

    <section className="grid gap-3 md:grid-cols-3">{(["NAPSA", "NHIMA", "PAYE"] as const).map((code) => { const rule = initialData.rules.find((item) => item.code === code); const config = (rule?.configuration ?? {}) as Record<string, unknown>; return <article key={code} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{code === "PAYE" ? "ZRA · PAYE" : code}</p><p className="mt-2 font-bold text-[#03162F]">Employee {code === "PAYE" ? "progressive tax" : `${Number(rule?.employee_rate ?? 0)}%`} · Employer {code === "PAYE" ? "—" : `${Number(rule?.employer_rate ?? 0)}%`}</p><p className="mt-1 text-xs text-slate-500">Effective {rule?.effective_from ?? "not set"}{config.monthly_earnings_ceiling ? ` · earnings ceiling ${money(Number(config.monthly_earnings_ceiling))}` : ""} · {rule?.active ? "Active rule" : "Inactive rule"}</p></article>; })}</section>
  </main>;
}

function StatCard({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Landmark }) { return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-slate-500"><Icon className="h-4 w-4" /><span className="text-xs font-semibold">{label}</span></div><p className="mt-3 text-xl font-black tabular-nums text-[#03162F]">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></article>; }
