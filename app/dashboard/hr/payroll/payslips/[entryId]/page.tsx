import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPrintablePayslip } from "@/modules/payroll/services/payslip.service";
import PrintPayslipButton from "@/modules/payroll/components/PrintPayslipButton";

type Props = { params: Promise<{ entryId: string }> };
const value = (input: unknown) => typeof input === "string" ? input : "";
const amount = (input: unknown) => Number(input ?? 0);
const money = (input: unknown) => new Intl.NumberFormat("en-ZM", { style: "currency", currency: "ZMW", minimumFractionDigits: 2 }).format(amount(input));
const date = (input: unknown) => {
  if (typeof input !== "string" || !input) return "—";
  const parsed = new Date(`${input.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? input : new Intl.DateTimeFormat("en-ZM", { day: "2-digit", month: "long", year: "numeric" }).format(parsed);
};

export default async function PayslipPrintPage({ params }: Props) {
  const { entryId } = await params;
  const supabase = await createClient();
  const [{ data: canManageHr }, { data: canManageAccountsPayroll }] = await Promise.all([
    supabase.rpc("has_permission", { required_permission: "hr.manage" }),
    supabase.rpc("has_permission", { required_permission: "accounts.payroll" }),
  ]);
  if (!canManageHr && !canManageAccountsPayroll) redirect("/dashboard");
  const slip = await getPrintablePayslip(entryId);
  if (!slip) notFound();

  const totalDeductions = amount(slip.entry.total_deductions) + amount(slip.entry.total_tax);
  const allowances = slip.allowances;
  const deductions = slip.deductions;

  return <div className="mx-auto max-w-4xl space-y-5 pb-10">
    <div className="print:hidden flex items-center justify-between gap-3">
      <Link href="/dashboard/hr/payroll/payslips" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#03162F]"><ArrowLeft className="size-4" />All payslips</Link>
      <PrintPayslipButton entryId={entryId} />
    </div>

    <article id="payslip-print" className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="flex flex-col gap-5 border-b-4 border-[#D4AF37] bg-[#03162F] p-7 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1"><Image src="/brand/alessandro-enterprises-logo.png" alt="Alessandro Enterprises" width={64} height={64} className="h-full w-full object-contain" priority /></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Alessandro Enterprises</p><h1 className="mt-1 text-2xl font-black">Employee Payslip</h1><p className="mt-1 text-sm text-slate-300">Confidential payroll statement</p></div>
        </div>
        <div className="sm:text-right"><p className="text-xs uppercase tracking-wide text-slate-300">Payslip number</p><p className="mt-1 font-bold">{slip.payslipNumber}</p><span className="mt-2 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">{slip.status}</span></div>
      </div>

      <div className="grid gap-6 p-7 sm:grid-cols-2">
        <section><h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Employee details</h2><dl className="space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Name</dt><dd className="text-right font-semibold">{value(slip.employee.full_name) || "Employee"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Position</dt><dd className="text-right">{value(slip.employee.position) || "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Employee ID</dt><dd className="text-right">{value(slip.employee.employee_number) || value(slip.employee.staff_number) || String(slip.employee.id).slice(0, 8).toUpperCase()}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Department</dt><dd className="text-right">{value(slip.department?.name) || "—"}</dd></div></dl></section>
        <section><h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Pay details</h2><dl className="space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Pay period</dt><dd className="text-right font-semibold">{value(slip.period.name)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Period covered</dt><dd className="text-right">{date(slip.period.period_start)} – {date(slip.period.period_end)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Payment date</dt><dd className="text-right">{date(slip.period.payment_date)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Business / branch</dt><dd className="text-right">{value(slip.business?.name) || "Alessandro Enterprises"}{slip.branch?.name ? ` / ${value(slip.branch.name)}` : ""}</dd></div></dl></section>
      </div>

      <div className="mx-7 border-t border-slate-200" />
      <div className="grid gap-7 p-7 md:grid-cols-2">
        <section><h2 className="mb-3 text-sm font-bold text-[#03162F]">Earnings</h2><div className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm"><div className="flex justify-between gap-3 px-4 py-3"><span>Basic salary</span><span>{money(slip.entry.basic_salary)}</span></div>{amount(slip.entry.overtime_amount) > 0 && <div className="flex justify-between gap-3 px-4 py-3"><span>Overtime ({amount(slip.entry.overtime_hours)} hrs)</span><span>{money(slip.entry.overtime_amount)}</span></div>}{allowances.map((item) => <div key={String(item.id)} className="flex justify-between gap-3 px-4 py-3"><span>{value(item.name)}</span><span>{money(item.amount)}</span></div>)}<div className="flex justify-between gap-3 bg-slate-50 px-4 py-3 font-bold"><span>Gross pay</span><span>{money(slip.entry.gross_pay)}</span></div></div></section>
        <section><h2 className="mb-3 text-sm font-bold text-[#03162F]">Deductions</h2><div className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">{deductions.map((item) => <div key={String(item.id)} className="flex justify-between gap-3 px-4 py-3"><span>{value(item.name) || value(item.deduction_type)}</span><span>{money(item.amount)}</span></div>)}{amount(slip.entry.total_tax) > 0 && !deductions.some((item) => /paye|tax/i.test(`${value(item.name)} ${value(item.deduction_type)}`)) && <div className="flex justify-between gap-3 px-4 py-3"><span>Tax / PAYE</span><span>{money(slip.entry.total_tax)}</span></div>}{amount(slip.entry.total_deductions) > deductions.reduce((total, item) => total + amount(item.amount), 0) && <div className="flex justify-between gap-3 px-4 py-3"><span>Other deductions</span><span>{money(amount(slip.entry.total_deductions) - deductions.reduce((total, item) => total + amount(item.amount), 0))}</span></div>}<div className="flex justify-between gap-3 bg-slate-50 px-4 py-3 font-bold"><span>Total deductions</span><span>{money(totalDeductions)}</span></div></div></section>
      </div>

      <div className="mx-7 mb-7 flex flex-col gap-2 rounded-xl bg-[#03162F] p-5 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">Net pay</p><p className="mt-1 text-xs text-slate-300">Take-home amount for this pay period</p></div><p className="text-3xl font-black">{money(slip.entry.net_pay)}</p></div>
      {value(slip.entry.notes) && <div className="mx-7 mb-7 rounded-lg bg-slate-50 p-4 text-sm"><p className="font-semibold">Payroll notes</p><p className="mt-1 whitespace-pre-wrap text-slate-600">{value(slip.entry.notes)}</p></div>}
      <footer className="border-t border-slate-200 px-7 py-4 text-center text-xs text-slate-500">This is a computer-generated payslip from Alessandro Enterprises. Keep it for your records.</footer>
    </article>
    <style>{`@page{size:A4;margin:14mm}@media print{html,body{background:#fff!important}body *{visibility:hidden!important}#payslip-print,#payslip-print *{visibility:visible!important}#payslip-print{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important}#payslip-print .bg-\\[\\#03162F\\]{print-color-adjust:exact;-webkit-print-color-adjust:exact}#payslip-print .border-\\[\\#D4AF37\\]{print-color-adjust:exact;-webkit-print-color-adjust:exact}}`}</style>
  </div>;
}
