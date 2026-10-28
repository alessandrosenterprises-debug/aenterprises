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

  return <div className="space-y-6">
    <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 flex flex-col gap-4 rounded-none bg-[#03162F] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-[#D4AF37] text-[#03162F]"><ReceiptText className="size-6" /></span>
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Human resources · Payroll</p><h1 className="mt-1 text-2xl font-black">Employee payslips</h1><p className="mt-1 text-sm text-slate-300">Review and print finalized payroll statements.</p></div>
      </div>
      <Link href="/dashboard/hr/payroll" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"><ArrowLeft className="size-4" />Payroll periods</Link>
    </header>
    <PayslipList payslips={payslips} />
  </div>;
}
