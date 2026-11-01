import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPrintablePayslips } from "@/modules/payroll/services/payslip.service";
import PayslipList from "@/modules/payroll/components/PayslipList";

export default async function PayslipsPage() {
  const supabase = await createClient();
  const [{ data: canManageHr }, { data: canManageAccountsPayroll }] = await Promise.all([
    supabase.rpc("has_permission", { required_permission: "hr.manage" }),
    supabase.rpc("has_permission", { required_permission: "accounts.payroll" }),
  ]);
  if (!canManageHr && !canManageAccountsPayroll) redirect("/dashboard");
  const payslips = await getPrintablePayslips();

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-[#9a7910]"><ReceiptText className="size-5" /></span>
        <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a7910]">Human Resources · Payroll</p><h2 className="mt-0.5 text-2xl font-bold tracking-tight text-[#03162F]">Employee payslips</h2><p className="mt-1 text-sm text-slate-500">Review and print finalized payroll statements.</p></div>
      </div>
      <Link href="/dashboard/hr/payroll" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#03162F] shadow-sm transition hover:bg-slate-50"><ArrowLeft className="size-4" />Payroll periods</Link>
    </header>
    <PayslipList payslips={payslips} />
  </div>;
}
