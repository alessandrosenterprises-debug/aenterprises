import { supabase } from "@/lib/supabase/client";

export interface EmployeeLoanInput {
  employee_id: string;
  loan_product_id?: string | null;
  loan_type: string;

  principal_amount: number;
  interest_rate: number;
  total_payable: number;

  repayment_period: number;
  monthly_installment: number;

  application_date: string;
  start_date?: string | null;

  amount_paid?: number;
  outstanding_balance: number;

  status?: string;

  approved_by?: string | null;
  approved_at?: string | null;

  rejection_reason?: string | null;
  notes?: string | null;
}

export async function createEmployeeLoan(
  input: EmployeeLoanInput
) {
  const { data, error } = await supabase
    .from("hr_employee_loans")
    .insert({
      employee_id: input.employee_id,
      loan_product_id:
        input.loan_product_id ?? null,
      loan_type: input.loan_type,

      principal_amount:
        input.principal_amount,
      interest_rate:
        input.interest_rate,
      total_payable:
        input.total_payable,

      repayment_period:
        input.repayment_period,
      monthly_installment:
        input.monthly_installment,

      application_date:
        input.application_date,
      start_date:
        input.start_date ?? null,

      amount_paid:
        input.amount_paid ?? 0,
      outstanding_balance:
        input.outstanding_balance,

      status:
        input.status ?? "Pending",

      approved_by:
        input.approved_by ?? null,
      approved_at:
        input.approved_at ?? null,

      rejection_reason:
        input.rejection_reason ?? null,
      notes:
        input.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateEmployeeLoan(
  id: string,
  input: Partial<EmployeeLoanInput>
) {
  const { data, error } = await supabase
    .from("hr_employee_loans")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function approveEmployeeLoan(
  id: string
) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("hr_employee_loans")
    .update({
      status: "Approved",
      approved_at: now,
      rejection_reason: null,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function rejectEmployeeLoan(
  id: string,
  rejectionReason: string
) {
  const { data, error } = await supabase
    .from("hr_employee_loans")
    .update({
      status: "Rejected",
      rejection_reason:
        rejectionReason,
      approved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteEmployeeLoan(
  id: string
) {
  const { error } = await supabase
    .from("hr_employee_loans")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}