"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  createPayrollPeriod,
  updatePayrollPeriod,
} from "@/modules/payroll/services/payroll-period.client";

import type {
  PayrollPeriod,
} from "@/modules/payroll/types/payroll.types";

interface PayrollPeriodFormValues {
  name: string;
  period_start: string;
  period_end: string;
  payment_date: string;
  status: string;
  notes: string;
}

interface PayrollPeriodFormProps {
  mode?: "create" | "edit";

  period?: PayrollPeriod;

  onSuccess?: () => void;
}

export default function PayrollPeriodForm({
  mode = "create",
  period,
  onSuccess,
}: PayrollPeriodFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PayrollPeriodFormValues>({
    defaultValues: {
      name: period?.name ?? "",

      period_start:
        period?.period_start ?? "",

      period_end:
        period?.period_end ?? "",

      payment_date:
        period?.payment_date ?? "",

      status:
        period?.status ?? "Draft",

      notes:
        period?.notes ?? "",
    },
  });

  async function onSubmit(
    data: PayrollPeriodFormValues
  ) {
    try {
      if (!data.name.trim()) {
        toast.error(
          "Payroll period name is required."
        );

        return;
      }

      if (!data.period_start) {
        toast.error(
          "Period start date is required."
        );

        return;
      }

      if (!data.period_end) {
        toast.error(
          "Period end date is required."
        );

        return;
      }

      if (
        data.period_end <
        data.period_start
      ) {
        toast.error(
          "Period end date cannot be before the start date."
        );

        return;
      }

      const payload = {
        name: data.name.trim(),

        period_start:
          data.period_start,

        period_end:
          data.period_end,

        payment_date:
          data.payment_date || null,

        status:
          data.status || "Draft",

        notes:
          data.notes.trim() || null,
      };

      if (
        mode === "edit" &&
        period?.id
      ) {
        await updatePayrollPeriod(
          period.id,
          payload
        );

        toast.success(
          "Payroll period updated successfully."
        );
      } else {
        await createPayrollPeriod(
          payload
        );

        toast.success(
          "Payroll period created successfully."
        );
      }

      onSuccess?.();

      router.refresh();
    } catch (error) {
      console.error(
        "Payroll period save error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save payroll period."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="grid gap-6">
        <Input
          label="Payroll Period Name *"
          placeholder="e.g. August 2026"
          {...register("name")}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            type="date"
            label="Period Start *"
            {...register(
              "period_start"
            )}
          />

          <Input
            type="date"
            label="Period End *"
            {...register(
              "period_end"
            )}
          />
        </div>

        <Input
          type="date"
          label="Payment Date"
          {...register(
            "payment_date"
          )}
        />

        <Select
          label="Status"
          placeholder="Select Status"
          options={[
            {
              label: "Draft",
              value: "Draft",
            },
            {
              label: "Open",
              value: "Open",
            },
            {
              label: "Processing",
              value: "Processing",
            },
            {
              label: "Closed",
              value: "Closed",
            },
          ]}
          {...register("status")}
        />

        <Textarea
          label="Notes"
          placeholder="Additional payroll period notes..."
          {...register("notes")}
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onSuccess}
            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>

          <SubmitButton
            loading={isSubmitting}
          >
            {mode === "create"
              ? "Create Payroll Period"
              : "Update Payroll Period"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}