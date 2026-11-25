"use client";

import { useEffect } from "react";
import type { CustomerLoanApplication } from "@/modules/loans/types/customer-loan";

interface LoanReceiptProps {
  loan: CustomerLoanApplication;
  kind: "disbursement" | "clearance";
  onClose: () => void;
}

function money(value: number | null | undefined) {
  return new Intl.NumberFormat("en-ZM", { style: "currency", currency: "ZMW", minimumFractionDigits: 2 }).format(Number(value ?? 0));
}

function printableDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-ZM", { dateStyle: "long", timeZone: "Africa/Lusaka" }).format(parsed);
}

export default function LoanReceipt({ loan, kind, onClose }: LoanReceiptProps) {
  const isClearance = kind === "clearance";
  const principal = Number(loan.approved_amount ?? loan.requested_amount ?? 0);
  const expected = Number(loan.total_payable ?? principal + principal * (Number(loan.interest_rate ?? 0) / 100));
  const customer = loan.customers?.full_name ?? "Customer";
  const receiptNumber = `AEOS-SL-${isClearance ? "CLR" : "DIS"}-${(loan.application_number || loan.id.slice(0, 8)).replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`;
  const issuedOn = isClearance ? loan.updated_at : loan.approved_at ?? loan.application_date;
  const phone = (loan.customers?.phone ?? "").replace(/[^+\d]/g, "").replace(/^\+/, "");
  const shareText = [
    `Alessandro Soft Loans — ${isClearance ? "Loan Clearance Receipt" : "Loan Disbursement Receipt"}`,
    `Receipt: ${receiptNumber}`,
    `Customer: ${customer}`,
    `Loan: ${loan.loan_type}`,
    `Principal: ${money(principal)}`,
    `Total repayment: ${money(expected)}`,
    isClearance ? `Status: Cleared in full on ${printableDate(issuedOn)}` : `Balance at issue: ${money(loan.outstanding_balance ?? expected)}`,
  ].join("\n");

  useEffect(() => {
    const afterPrint = () => document.body.classList.remove("printing-loan-receipt");
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("afterprint", afterPrint);
      document.body.classList.remove("printing-loan-receipt");
    };
  }, []);

  function printReceipt() {
    document.body.classList.add("printing-loan-receipt");
    window.print();
  }

  function shareReceipt() {
    const target = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(shareText)}` : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(target, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body.printing-loan-receipt * { visibility: hidden !important; }
          body.printing-loan-receipt .loan-receipt-print,
          body.printing-loan-receipt .loan-receipt-print * { visibility: visible !important; }
          body.printing-loan-receipt .loan-receipt-print { position: fixed !important; inset: 0 !important; display: block !important; width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; border: 0 !important; box-shadow: none !important; background: white !important; }
          body.printing-loan-receipt .loan-receipt-actions { display: none !important; }
          @page { size: A5; margin: 12mm; }
        }
      `}</style>
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={isClearance ? "Loan clearance receipt" : "Loan disbursement receipt"}>
        <article className="loan-receipt-print w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b-2 border-[#D4AF37] pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A67C00]">Alessandro Enterprises</p>
              <h2 className="mt-2 text-2xl font-bold text-[#03162F]">Alessandro Soft Loans</h2>
              <p className="mt-1 text-sm text-slate-600">{isClearance ? "Loan Clearance Receipt" : "Loan Disbursement Receipt"}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${isClearance ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>{isClearance ? "CLEARED" : "DISBURSED"}</span>
          </div>

          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <ReceiptField label="Receipt number" value={receiptNumber} />
            <ReceiptField label="Date" value={printableDate(issuedOn)} />
            <ReceiptField label="Customer" value={customer} />
            <ReceiptField label="Application" value={loan.application_number || loan.id.slice(0, 8).toUpperCase()} />
            <ReceiptField label="Loan product" value={loan.loan_type} />
            <ReceiptField label="Principal" value={money(principal)} strong />
            <ReceiptField label="Interest rate" value={`${Number(loan.interest_rate ?? 0)}%`} />
            <ReceiptField label="Total repayment" value={money(expected)} strong />
            <ReceiptField label="Repaid to date" value={money(loan.amount_paid)} />
            <ReceiptField label={isClearance ? "Final balance" : "Balance at issue"} value={money(isClearance ? 0 : loan.outstanding_balance ?? expected)} strong />
          </div>

          <p className="border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600">
            {isClearance
              ? "This confirms that the loan recorded above has been cleared in full. Please retain this receipt for your records."
              : "This confirms the loan principal recorded above was issued to the customer. Please retain this receipt and follow the agreed repayment terms."}
          </p>
          {loan.due_date && !isClearance && <p className="mt-3 text-sm text-slate-700"><strong>Due date:</strong> {printableDate(loan.due_date)}</p>}
          <p className="mt-5 text-xs text-slate-500">Generated by AEOS · Keep this receipt for your records.</p>

          <div className="loan-receipt-actions mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={shareReceipt} className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">Share via WhatsApp</button>
            <button type="button" onClick={printReceipt} className="rounded-lg bg-[#03162F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#102b50]">Print / Save PDF</button>
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
          </div>
        </article>
      </div>
    </>
  );
}

function ReceiptField({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="rounded-lg bg-slate-50 p-3">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className={`mt-1 break-words text-sm ${strong ? "font-bold text-[#03162F]" : "font-semibold text-slate-800"}`}>{value}</p>
  </div>;
}
