"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  createEmployeePayrollSettings,
  updateEmployeePayrollSettings,
} from "@/modules/payroll/services/employee-payroll-settings.client";

import type {
  EmployeePayrollSettings,
} from "@/modules/payroll/types/payroll.types";

interface Employee {
  id: string;
  full_name: string;
  phone?: string | null;
  position?: string | null;
  salary?: number | null;
}

interface EmployeePayrollSettingsFormValues {
  employee_id: string;

  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  branch_code: string;

  payment_method: string;

  tax_number: string;
  napsa_number: string;
  nhima_number: string;
  pension_number: string;

  loan_deduction_enabled: boolean;
  default_loan_deduction: number;
  default_advance_deduction: number;
}

interface EmployeePayrollSettingsFormProps {
  employees: Employee[];

  settings?: EmployeePayrollSettings | null;

  onSuccess?: () => void;

  mode?: "create" | "edit";
}

export default function EmployeePayrollSettingsForm({
  employees,
  settings,
  onSuccess,
  mode = "create",
}: EmployeePayrollSettingsFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } =
    useForm<EmployeePayrollSettingsFormValues>({
      defaultValues: {
        employee_id:
          settings?.employee_id ?? "",

        bank_name:
          settings?.bank_name ?? "",

        bank_account_name:
          settings?.bank_account_name ?? "",

        bank_account_number:
          settings?.bank_account_number ?? "",

        branch_code:
          settings?.branch_code ?? "",

        payment_method:
          settings?.payment_method ?? "Bank",

        tax_number:
          settings?.tax_number ?? "",

        napsa_number:
          settings?.napsa_number ?? "",

        nhima_number:
          settings?.nhima_number ?? "",

        pension_number:
          settings?.pension_number ?? "",

        loan_deduction_enabled:
          settings?.loan_deduction_enabled ?? false,

        default_loan_deduction:
          settings?.default_loan_deduction ?? 0,

        default_advance_deduction:
          settings?.default_advance_deduction ?? 0,
      },
    });

  const employeeOptions = employees.map(
    (employee) => ({
      label: employee.full_name,
      value: employee.id,
    })
  );

  async function onSubmit(
    data: EmployeePayrollSettingsFormValues
  ) {
    try {
      if (!data.employee_id) {
        toast.error(
          "Please select an employee."
        );

        return;
      }

      if (!data.payment_method) {
        toast.error(
          "Please select a payment method."
        );

        return;
      }

      const payload = {
        employee_id: data.employee_id,

        bank_name:
          data.bank_name.trim() || null,

        bank_account_name:
          data.bank_account_name.trim() || null,

        bank_account_number:
          data.bank_account_number.trim() || null,

        branch_code:
          data.branch_code.trim() || null,

        payment_method:
          data.payment_method,

        tax_number:
          data.tax_number.trim() || null,

        napsa_number:
          data.napsa_number.trim() || null,

        nhima_number:
          data.nhima_number.trim() || null,

        pension_number:
          data.pension_number.trim() || null,

        loan_deduction_enabled:
          data.loan_deduction_enabled,

        default_loan_deduction:
          Number(
            data.default_loan_deduction
          ) || 0,

        default_advance_deduction:
          Number(
            data.default_advance_deduction
          ) || 0,
      };

      if (
        mode === "edit" &&
        settings?.id
      ) {
        await updateEmployeePayrollSettings(
          settings.id,
          payload
        );

        toast.success(
          "Payroll settings updated successfully."
        );
      } else {
        await createEmployeePayrollSettings(
          payload
        );

        toast.success(
          "Payroll settings created successfully."
        );
      }

      onSuccess?.();

      router.refresh();
    } catch (error) {
      console.error(
        "Employee payroll settings save error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save payroll settings."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
    >
      {/* Employee */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-bold text-[#03162F]">
            Employee
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Select the employee whose payroll
            settings you want to configure.
          </p>
        </div>

        <Select
          label="Employee *"
          placeholder="Select Employee"
          options={employeeOptions}
          {...register("employee_id")}
        />
      </section>

      {/* Payment */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-bold text-[#03162F]">
            Payment Details
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Configure how the employee receives
            their salary.
          </p>
        </div>

        <Select
          label="Payment Method *"
          placeholder="Select Payment Method"
          options={[
            {
              label: "Bank",
              value: "Bank",
            },
            {
              label: "Mobile Money",
              value: "Mobile Money",
            },
            {
              label: "Cash",
              value: "Cash",
            },
          ]}
          {...register("payment_method")}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Bank Name"
            placeholder="e.g. Zanaco"
            {...register("bank_name")}
          />

          <Input
            label="Account Name"
            placeholder="Name on bank account"
            {...register(
              "bank_account_name"
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Account Number"
            placeholder="Bank account number"
            {...register(
              "bank_account_number"
            )}
          />

          <Input
            label="Branch Code"
            placeholder="Bank branch code"
            {...register("branch_code")}
          />
        </div>
      </section>

      {/* Statutory */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-bold text-[#03162F]">
            Statutory & Identification
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Store the employee's payroll and
            statutory identification numbers.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Tax Number"
            placeholder="Tax identification number"
            {...register("tax_number")}
          />

          <Input
            label="NAPSA Number"
            placeholder="NAPSA number"
            {...register("napsa_number")}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="NHIMA Number"
            placeholder="NHIMA number"
            {...register("nhima_number")}
          />

          <Input
            label="Pension Number"
            placeholder="Pension number"
            {...register("pension_number")}
          />
        </div>
      </section>

      {/* Deductions */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-bold text-[#03162F]">
            Default Deductions
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Configure deductions that should be
            available when payroll is processed.
          </p>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-300"
            {...register(
              "loan_deduction_enabled"
            )}
          />

          <span className="font-medium text-slate-700">
            Enable Loan Deduction
          </span>
        </label>

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            label="Default Loan Deduction"
            placeholder="0.00"
            {...register(
              "default_loan_deduction",
              {
                valueAsNumber: true,
              }
            )}
          />

          <Input
            type="number"
            step="0.01"
            min="0"
            label="Default Advance Deduction"
            placeholder="0.00"
            {...register(
              "default_advance_deduction",
              {
                valueAsNumber: true,
              }
            )}
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
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
            ? "Save Payroll Settings"
            : "Update Payroll Settings"}
        </SubmitButton>
      </div>
    </form>
  );
}