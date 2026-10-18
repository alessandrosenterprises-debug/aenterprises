"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { addStarterLoanProductsAction } from "@/app/dashboard/configuration/actions";

export default function LoanProductStarterTemplates() {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const addTemplates = async () => {
    setIsAdding(true);
    try {
      const result = await addStarterLoanProductsAction();
      if (result.productsAdded || result.termsAdded) {
        toast.success(`Added ${result.productsAdded} draft products and ${result.termsAdded} repayment terms.`);
      } else if (!result.issues.length) {
        toast.success("Starter products and terms are already in place.");
      }
      if (result.issues.length) {
        toast.error(`Some terms could not be added: ${result.issues.slice(0, 2).join(" · ")}`);
      } else if (result.productsAdded || result.termsAdded) {
        toast.info("Edit the draft rates and activate the products and terms before offering them to customers.");
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add loan product templates.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-slate-900">Start with editable loan types</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Adds common product drafts with 7–180 day term options. Drafts are inactive with a 0% placeholder until you edit and activate them.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link href="/dashboard/configuration/loan-terms" className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-amber-100">
          Configure terms <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={addTemplates}
          disabled={isAdding}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0A2852] disabled:cursor-wait disabled:opacity-60"
        >
          <Layers3 className="h-4 w-4 text-[#D4AF37]" />
          {isAdding ? "Adding drafts…" : "Add starter loan types"}
        </button>
      </div>
    </div>
  );
}
