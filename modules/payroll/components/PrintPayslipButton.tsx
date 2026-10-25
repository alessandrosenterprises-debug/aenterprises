"use client";

import { useTransition } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { preparePayslipForPrint } from "@/app/dashboard/hr/payroll/payslips/actions";

export default function PrintPayslipButton({ entryId, compact = false }: { entryId: string; compact?: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        try {
          await preparePayslipForPrint(entryId);
          window.print();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Payslip could not be prepared.");
        }
      })}
      className={`print:hidden inline-flex items-center justify-center gap-2 rounded-lg bg-[#03162F] font-semibold text-white transition hover:bg-[#0A2852] disabled:cursor-wait disabled:opacity-60 ${compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}
    >
      <Printer className="size-4" />
      {pending ? "Preparing…" : "Print / Save PDF"}
    </button>
  );
}
