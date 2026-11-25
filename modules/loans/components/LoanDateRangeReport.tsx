"use client";

import { useMemo, useState } from "react";

export interface LoanReportRecord {
  id: string;
  applicationNumber: string;
  applicationDate: string;
  customer: string;
  product: string;
  source: string;
  status: string;
  requested: number;
  approved: number;
  repaid: number;
  outstanding: number;
  expected: number;
}

interface LoanDateRangeReportProps {
  records: LoanReportRecord[];
  defaultFrom: string;
  defaultTo: string;
}

const money = (value: number) => new Intl.NumberFormat("en-ZM", {
  style: "currency",
  currency: "ZMW",
  minimumFractionDigits: 2,
}).format(value);

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export default function LoanDateRangeReport({ records, defaultFrom, defaultTo }: LoanDateRangeReportProps) {
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [generatedRange, setGeneratedRange] = useState({ from: defaultFrom, to: defaultTo });
  const [rangeError, setRangeError] = useState("");

  const report = useMemo(() => records.filter((record) => {
    const day = record.applicationDate.slice(0, 10);
    return day >= generatedRange.from && day <= generatedRange.to;
  }), [records, generatedRange]);

  const totals = useMemo(() => report.reduce((result, loan) => {
    result.requested += loan.requested;
    result.approved += loan.approved;
    result.repaid += loan.repaid;
    result.outstanding += loan.outstanding;
    result.expected += loan.expected;
    return result;
  }, { requested: 0, approved: 0, repaid: 0, outstanding: 0, expected: 0 }), [report]);

  function generateReport() {
    if (!fromDate || !toDate) {
      setRangeError("Choose both a start date and an end date.");
      return;
    }
    if (fromDate > toDate) {
      setRangeError("The start date must be before or equal to the end date.");
      return;
    }
    setRangeError("");
    setGeneratedRange({ from: fromDate, to: toDate });
  }

  function downloadCsv() {
    const heading = ["Application date", "Application", "Customer", "Loan product", "Source", "Status", "Requested (ZMW)", "Approved (ZMW)", "Repaid (ZMW)", "Outstanding (ZMW)", "Expected repayment (ZMW)"];
    const rows = report.map((loan) => [loan.applicationDate.slice(0, 10), loan.applicationNumber, loan.customer, loan.product, loan.source, loan.status, loan.requested.toFixed(2), loan.approved.toFixed(2), loan.repaid.toFixed(2), loan.outstanding.toFixed(2), loan.expected.toFixed(2)]);
    const content = [heading, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `soft-loans-${generatedRange.from}-to-${generatedRange.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const summaryCards = [
    { label: "Applications", value: String(report.length), color: "text-[#03162F]" },
    { label: "Requested", value: money(totals.requested), color: "text-blue-800" },
    { label: "Approved", value: money(totals.approved), color: "text-emerald-800" },
    { label: "Repaid", value: money(totals.repaid), color: "text-violet-800" },
    { label: "Outstanding", value: money(totals.outstanding), color: "text-rose-800" },
    { label: "Expected repayment", value: money(totals.expected), color: "text-amber-800" },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A67C00]">Reporting</p>
          <h2 className="mt-1 text-xl font-bold text-[#03162F]">Loan report by date range</h2>
          <p className="mt-1 text-sm text-slate-600">Generate an application and repayment summary for any period.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-semibold text-slate-600">From
            <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">To
            <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900" />
          </label>
          <button type="button" onClick={generateReport} className="h-10 rounded-lg bg-[#03162F] px-4 text-sm font-semibold text-white hover:bg-[#102b50]">Generate report</button>
          <button type="button" onClick={downloadCsv} disabled={!report.length} className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Export CSV</button>
        </div>
      </div>
      <div className="p-5">
        {rangeError && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{rangeError}</p>}
        <p className="mb-4 text-sm text-slate-600">Showing {report.length} application{report.length === 1 ? "" : "s"} from <strong>{generatedRange.from}</strong> to <strong>{generatedRange.to}</strong>.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {summaryCards.map((card) => <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-600">{card.label}</p>
            <p className={`mt-2 break-words text-lg font-bold ${card.color}`}>{card.value}</p>
          </div>)}
        </div>
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>{["Applied", "Application", "Customer", "Loan product", "Source", "Status", "Requested", "Approved", "Repaid", "Outstanding"].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.map((loan) => <tr key={loan.id} className="text-slate-800">
                <td className="whitespace-nowrap px-3 py-3">{loan.applicationDate.slice(0, 10)}</td>
                <td className="px-3 py-3">{loan.applicationNumber}</td>
                <td className="px-3 py-3">{loan.customer}</td>
                <td className="px-3 py-3">{loan.product}</td>
                <td className="px-3 py-3">{loan.source}</td>
                <td className="px-3 py-3">{loan.status}</td>
                <td className="whitespace-nowrap px-3 py-3">{money(loan.requested)}</td>
                <td className="whitespace-nowrap px-3 py-3">{loan.approved ? money(loan.approved) : "—"}</td>
                <td className="whitespace-nowrap px-3 py-3">{money(loan.repaid)}</td>
                <td className="whitespace-nowrap px-3 py-3">{money(loan.outstanding)}</td>
              </tr>)}
              {!report.length && <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-600">No loan applications were submitted in this date range.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
