import { supabase } from "@/lib/supabase/client";

export interface EmployeePayrollSettingsInput {
  employee_id: string;

  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  branch_code?: string | null;

  payment_method: string;

  tax_number?: string | null;
  napsa_number?: string | null;
  nhima_number?: string | null;
  pension_number?: string | null;

  loan_deduction_enabled?: boolean;
  default_loan_deduction?: number;
  default_advance_deduction?: number;
}

export async function createEmployeePayrollSettings(
  data: EmployeePayrollSettingsInput
) {
  const { data: settings, error } = await supabase
    .from("hr_employee_payroll_settings")
    .insert({
      employee_id: data.employee_id,

      bank_name: data.bank_name ?? null,
      bank_account_name: data.bank_account_name ?? null,
      bank_account_number: data.bank_account_number ?? null,
      branch_code: data.branch_code ?? null,

      payment_method: data.payment_method || "Bank",

      tax_number: data.tax_number ?? null,
      napsa_number: data.napsa_number ?? null,
      nhima_number: data.nhima_number ?? null,
      pension_number: data.pension_number ?? null,

      loan_deduction_enabled:
        data.loan_deduction_enabled ?? false,

      default_loan_deduction:
        data.default_loan_deduction ?? 0,

      default_advance_deduction:
        data.default_advance_deduction ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Employee payroll settings create error:",
      error
    );

    throw new Error(error.message);
  }

  return settings;
}

export async function updateEmployeePayrollSettings(
  id: string,
  data: EmployeePayrollSettingsInput
) {
  const { data: settings, error } = await supabase
    .from("hr_employee_payroll_settings")
    .update({
      employee_id: data.employee_id,

      bank_name: data.bank_name ?? null,
      bank_account_name: data.bank_account_name ?? null,
      bank_account_number: data.bank_account_number ?? null,
      branch_code: data.branch_code ?? null,

      payment_method: data.payment_method || "Bank",

      tax_number: data.tax_number ?? null,
      napsa_number: data.napsa_number ?? null,
      nhima_number: data.nhima_number ?? null,
      pension_number: data.pension_number ?? null,

      loan_deduction_enabled:
        data.loan_deduction_enabled ?? false,

      default_loan_deduction:
        data.default_loan_deduction ?? 0,

      default_advance_deduction:
        data.default_advance_deduction ?? 0,

      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Employee payroll settings update error:",
      error
    );

    throw new Error(error.message);
  }

  return settings;
}

export async function deleteEmployeePayrollSettings(
  id: string
) {
  const { data, error } = await supabase
    .from("hr_employee_payroll_settings")
    .delete()
    .eq("id", id)
    .select();

  console.log(
    "DELETE PAYROLL SETTINGS DATA:",
    data
  );

  console.log(
    "DELETE PAYROLL SETTINGS ERROR:",
    error
  );

  if (error) {
    console.error(
      "Employee payroll settings delete error:",
      error
    );

    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(
      "No payroll settings were deleted. Check the DELETE policy or matching record."
    );
  }

  return true;
}