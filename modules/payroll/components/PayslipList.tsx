"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { PrintablePayslip } from "@/modules/payroll/services/payslip.service";
import PrintPayslipButton from "@/modules/payroll/components/PrintPayslipButton";

const money = (value: unknown) => new Intl.NumberFormat("en-ZM", { style: "currency", currency: "ZMW", minimumFractionDigits: 2 }).format(Number(value ?? 0));
const text = (value: unknown) => typeof value === "string" ? value : "";

export default function PayslipList({ payslips }: { payslips: PrintablePayslip[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payslips;
    return payslips.filter((slip) => [slip.payslipNumber, slip.employee.full_name, slip.employee.position, slip.period.name, slip.business?.name, slip.branch?.name]
      .some((value) => text(value).toLowerCase().includes(term)));
  }, [payslips, search]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-[#03162F]">Finalized payroll</h2>
          <p className="mt-1 text-xs text-slate-500">Only approved entries from finalized or paid payroll runs can be printed.</p>
        </div>
        <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 px-3 sm:max-w-sm">
          <Search className="size-4 text-slate-400" />
          <input className="min-w-0 flex-1 text-sm outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee, period or branch" aria-label="Search payslips" />
        </label>
      </div>
      {filtered.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Pay period</th><th className="px-4 py-3">Business / branch</th><th className="px-4 py-3">Gross</th><th className="px-4 py-3">Deductions</th><th className="px-4 py-3">Net pay</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Payslip</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((slip) => <tr key={slip.entryId} className="text-slate-700">
                <td className="px-4 py-3"><div className="font-semibold text-slate-900">{text(slip.employee.full_name) || "Employee"}</div><div className="text-xs text-slate-500">{text(slip.employee.position)}</div></td>
                <td className="px-4 py-3">{text(slip.period.name)}</td>
                <td className="px-4 py-3"><div>{text(slip.business?.name) || "Enterprise"}</div><div className="text-xs text-slate-500">{text(slip.branch?.name)}</div></td>
                <td className="px-4 py-3">{money(slip.entry.gross_pay)}</td>
                <td className="px-4 py-3">{money(Number(slip.entry.total_deductions ?? 0) + Number(slip.entry.total_tax ?? 0))}</td>
                <td className="px-4 py-3 font-bold text-[#03162F]">{money(slip.entry.net_pay)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{slip.status}</span></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2"><Link className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#03162F] hover:bg-slate-50" href={`/dashboard/hr/payroll/payslips/${slip.entryId}`}>View</Link><PrintPayslipButton entryId={slip.entryId} compact /></div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      ) : <div className="px-6 py-14 text-center"><p className="font-semibold text-slate-700">{payslips.length ? "No payslips match this search." : "No finalized payslips yet"}</p><p className="mt-1 text-sm text-slate-500">Finalize and approve a payroll run to make employee payslips available here.</p></div>}
    </section>
  );
}
