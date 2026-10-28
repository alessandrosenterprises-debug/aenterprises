import Link from "next/link";
import {
  ArrowRight, Banknote, BookOpenCheck, Calculator, FileText, Landmark, ReceiptText,
  Scale, ShieldCheck, WalletCards,
} from "lucide-react";
import { getAccountsDashboardData } from "./actions";

function money(value: number) {
  return `ZMW ${value.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function AccountsDepartmentPage() {
  const data = await getAccountsDashboardData();
  const attention = data.cashUps.pending + data.cashUps.returned + data.statutory.overdue;

  return <main className="w-full space-y-5 pb-8">
    <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 mb-8 flex flex-wrap items-center justify-between gap-4 rounded-none bg-[#03162F] px-6 py-5 text-white shadow-lg">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]"><Landmark className="h-6 w-6" /></span>
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Finance & controls</p><h1 className="text-2xl font-black">Accounts Department</h1><p className="mt-1 text-sm text-slate-300">Payroll liabilities, statutory remittances, cash control and financial records.</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">Month from {data.monthStart}</span>
        <span className={`rounded-xl px-3 py-2 text-xs font-bold ${attention ? "bg-amber-300 text-[#03162F]" : "bg-emerald-400/15 text-emerald-200"}`}>{attention ? `${attention} items need attention` : "No urgent items"}</span>
      </div>
    </header>

    {data.statutory.needsMigration && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>Statutory remittance register is not installed yet.</strong> Apply database migration 048 to enable payroll linked NAPSA, NHIMA and PAYE filing schedules.</div>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Cash-ups awaiting Accounts" value={String(data.cashUps.pending)} detail={`${data.cashUps.returned} returned for correction`} icon={Banknote} accent="amber" href="/dashboard/reports/cash-reconciliation/account-review" />
      <Metric title="Cash shortages this month" value={money(data.cashUps.shortageTotal)} detail={`Deduction notes: ${money(data.cashUps.salaryDeductionTotal)}`} icon={Scale} accent="rose" href="/dashboard/reports/cash-reconciliation" />
      <Metric title="Payroll awaiting payment" value={String(data.payroll.awaitingPayment)} detail={`${data.payroll.runs} payroll runs on record`} icon={WalletCards} accent="blue" href="/dashboard/hr/payroll" />
      <Metric title="Statutory liabilities due" value={money(data.statutory.dueAmount)} detail={`${data.statutory.awaitingPayment} schedules · ${data.statutory.overdue} overdue`} icon={Calculator} accent="violet" href="/dashboard/accounts/payroll" />
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A27B09]">Accounts workflow</p><h2 className="mt-1 text-lg font-black text-[#03162F]">Daily finance desk</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Connected to existing AEOS records</span></div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <WorkLink href="/dashboard/accounts/payroll" icon={Calculator} title="Payroll & statutory returns" detail="Reconcile finalized payroll to NAPSA, NHIMA and PAYE schedules; record filing and payment references." tone="gold" />
          <WorkLink href="/dashboard/accounts/invoices" icon={ReceiptText} title="Invoices & quotations" detail="Create branded customer documents, track due balances, record payments and convert accepted quotes." tone="blue" />
          <WorkLink href="/dashboard/accounts/journals" icon={BookOpenCheck} title="General ledger journals" detail="Prepare balanced double-entry journals and post them to the chart of accounts." tone="blue" />
          <WorkLink href="/dashboard/reports/cash-reconciliation/account-review" icon={ShieldCheck} title="Review manager cash-ups" detail={`${data.cashUps.pending} awaiting Accounts · independently verify and confirm or return.`} tone="green" />
          <WorkLink href="/dashboard/accounts/shortages" icon={Scale} title="Shortage recovery to payroll" detail="Route Accounts-approved shortage amounts into an open payroll run and track recovery." tone="red" />
          <WorkLink href="/dashboard/reports/cash-reconciliation" icon={Scale} title="Cash balancing & shortages" detail="See cashier totals, shortages, overages and manager deduction notes by date." tone="red" />
          <WorkLink href="/dashboard/hr/payroll" icon={WalletCards} title="Payroll periods & runs" detail={`Current run totals · gross ${money(data.payroll.gross)} · net ${money(data.payroll.net)}.`} tone="violet" />
          <WorkLink href="/dashboard/accounts/reports" icon={FileText} title="Financial statements" detail="Generate trial balance, income statement and statement of financial position." tone="slate" />
          <WorkLink href="/dashboard/reports" icon={Calculator} title="Enterprise activity reports" detail="Review date-range revenue, orders, bookings, deliveries and loan activity." tone="blue" />
        </div>
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A27B09]">Control checklist</p>
          <h2 className="mt-1 text-lg font-black text-[#03162F]">Close the month cleanly</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <Check text="Review and finalize all manager-verified cash-ups." />
            <Check text="Match shortages to written explanations and deduction approvals." />
            <Check text="Generate statutory schedules from finalized payroll only." />
            <Check text="Reconcile filed returns to payment references and bank records." />
            <Check text="Post balanced journal entries and retain supporting documents." />
          </ul>
        </section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Statutory calendar</p>
          <p className="mt-2 text-sm leading-6 text-amber-950">The initial schedule uses the 10th of the following month for PAYE, NAPSA and NHIMA. Confirm each authority’s current guidance and holiday adjustments before filing or payment.</p>
          <p className="mt-2 text-xs text-amber-800">Rates and contribution bases are stored as payroll rules and should be reviewed each tax year.</p>
        </section>
      </aside>
    </section>
  </main>;
}

function Metric({ title, value, detail, icon: Icon, accent, href }: { title: string; value: string; detail: string; icon: typeof WalletCards; accent: string; href: string }) {
  const tones: Record<string, string> = { amber: "bg-amber-50 text-amber-800", rose: "bg-rose-50 text-rose-700", blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700" };
  return <Link href={href} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-2"><span className={`rounded-xl p-2.5 ${tones[accent]}`}><Icon className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" /></div><p className="mt-4 text-xs font-semibold text-slate-500">{title}</p><p className="mt-1 text-xl font-black tabular-nums text-[#03162F]">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></Link>;
}

function WorkLink({ href, icon: Icon, title, detail, tone }: { href: string; icon: typeof WalletCards; title: string; detail: string; tone: string }) {
  const tones: Record<string, string> = { gold: "bg-amber-100 text-amber-800", blue: "bg-blue-100 text-blue-800", green: "bg-emerald-100 text-emerald-800", red: "bg-rose-100 text-rose-800", violet: "bg-violet-100 text-violet-800", slate: "bg-slate-100 text-slate-800" };
  return <Link href={href} className="group flex min-h-28 gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-[#D4AF37] hover:bg-amber-50/30"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2 font-bold text-[#03162F]">{title}<ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#9A7410]" /></span><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></span></Link>;
}

function Check({ text }: { text: string }) { return <li className="flex gap-2.5"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span><span>{text}</span></li>; }
