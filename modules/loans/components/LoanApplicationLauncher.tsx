"use client";

import { useState, type ComponentProps } from "react";
import { Plus, X } from "lucide-react";

import CustomerLoanApplicationForm from "@/modules/loans/components/CustomerLoanApplicationForm";

type LoanApplicationLauncherProps = Omit<ComponentProps<typeof CustomerLoanApplicationForm>, "onSuccess">;

export default function LoanApplicationLauncher(props: LoanApplicationLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0A2852] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2"
      >
        <Plus className="h-4 w-4" />
        New Loan Application
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-loan-application-title"
            className="my-4 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-8"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A67C00]">Alessandro Soft Loans</p>
                <h2 id="new-loan-application-title" className="mt-1 text-xl font-bold text-[#03162F]">New Loan Application</h2>
                <p className="mt-1 text-sm text-slate-500">Enter the customer and loan details to record an application.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close new loan application"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-4 sm:p-7">
              <CustomerLoanApplicationForm {...props} onSuccess={() => setOpen(false)} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
