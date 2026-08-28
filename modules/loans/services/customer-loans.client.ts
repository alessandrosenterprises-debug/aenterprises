import { supabase } from "@/lib/supabase/client";

import type {
  CustomerLoanApplication,
  CustomerLoanApplicationInput,
} from "../types/customer-loan";

export async function createCustomerLoanApplication(
  input: CustomerLoanApplicationInput
): Promise<CustomerLoanApplication> {
  const requestedAmount = Number(input.requested_amount);

  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    throw new Error(
      "Requested loan amount must be greater than zero."
    );
  }

  let product: {
    id: string;
    name: string;
    min_amount: number | null;
    max_amount: number | null;
    interest_rate: number | null;
    repayment_period: number | null;
    requires_collateral: boolean;
    status: string;
  } | null = null;

  if (input.loan_product_id) {
    const { data, error } = await supabase
      .from("loan_products")
      .select(`
        id,
        name,
        min_amount,
        max_amount,
        interest_rate,
        repayment_period,
        requires_collateral,
        status
      `)
      .eq("id", input.loan_product_id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    product = data;
  }

  if (input.loan_product_id && !product) {
    throw new Error(
      "The selected loan product could not be found."
    );
  }

  if (product && product.status !== "Active") {
    throw new Error(
      "The selected loan product is not active."
    );
  }

  // Minimum/maximum are validation rules.
  // They are intentionally NOT displayed as form fields.
  if (
    product?.min_amount !== null &&
    product?.min_amount !== undefined &&
    requestedAmount < Number(product.min_amount)
  ) {
    throw new Error(
      `Requested amount is below the allowed amount for this loan product.`
    );
  }

  if (
    product?.max_amount !== null &&
    product?.max_amount !== undefined &&
    requestedAmount > Number(product.max_amount)
  ) {
    throw new Error(
      `Requested amount exceeds the allowed amount for this loan product.`
    );
  }

  const interestRate =
    input.interest_rate ??
    product?.interest_rate ??
    null;

  const repaymentPeriod =
    input.repayment_period ??
    product?.repayment_period ??
    null;

  const collateralRequired =
    input.collateral_required ??
    product?.requires_collateral ??
    false;

  const { data, error } = await supabase
  .from("customer_loan_applications")
  .insert({
    customer_id: input.customer_id,

    loan_product_id:
      input.loan_product_id ?? null,

    application_source:
      input.application_source,

    application_date:
      input.application_date ??
      new Date().toISOString().split("T")[0],

    loan_type:
      input.loan_type,

    requested_amount:
      requestedAmount,

    interest_rate:
      interestRate,

    repayment_period:
      repaymentPeriod,

    loan_purpose:
      input.loan_purpose?.trim() || null,

    collateral_required:
      collateralRequired,

    collateral_description:
      input.collateral_description?.trim() ||
      null,

    collateral_id:
      input.collateral_id ?? null,

    collateral_worth:
      input.collateral_worth !== undefined &&
      input.collateral_worth !== null
        ? Number(input.collateral_worth)
        : null,

    account_operator_id:
      input.account_operator_id ?? null,

    due_date:
      input.due_date ?? null,

    status: "Pending",

    amount_paid: 0,

    outstanding_balance:
      requestedAmount,

    notes:
      input.notes?.trim() || null,
  })
  .select("*")
  .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CustomerLoanApplication;
}

export async function approveCustomerLoanApplication(
  id: string,
  approvedAmount: number
): Promise<CustomerLoanApplication> {
  const amount = Number(approvedAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Approved amount must be greater than zero."
    );
  }

  const { data: application, error: loadError } =
    await supabase
      .from("customer_loan_applications")
      .select(`
        id,
        requested_amount,
        interest_rate,
        repayment_period
      `)
      .eq("id", id)
      .maybeSingle();

  if (loadError) {
    throw new Error(loadError.message);
  }

  if (!application) {
    throw new Error(
      "Loan application not found."
    );
  }

  const interestRate =
    application.interest_rate !== null
      ? Number(application.interest_rate)
      : 0;

  const repaymentPeriod =
    application.repayment_period !== null
      ? Number(application.repayment_period)
      : 0;

  let totalPayable = amount;

  if (interestRate > 0) {
    totalPayable =
      amount +
      amount * (interestRate / 100);
  }

  const monthlyInstallment =
    repaymentPeriod > 0
      ? totalPayable / repaymentPeriod
      : null;

  const now =
    new Date().toISOString();

  const { data, error } = await supabase
    .from("customer_loan_applications")
    .update({
      approved_amount: amount,
      total_payable: totalPayable,
      monthly_installment:
        monthlyInstallment,
      amount_paid: 0,
      outstanding_balance:
        totalPayable,
      status: "Approved",
      approved_at: now,
      rejection_reason: null,
      updated_at: now,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CustomerLoanApplication;
}

export async function rejectCustomerLoanApplication(
  id: string,
  rejectionReason: string
): Promise<CustomerLoanApplication> {
  const reason =
    rejectionReason.trim();

  if (!reason) {
    throw new Error(
      "A rejection reason is required."
    );
  }

  const { data, error } = await supabase
    .from("customer_loan_applications")
    .update({
      status: "Rejected",
      rejection_reason: reason,
      approved_amount: null,
      approved_at: null,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CustomerLoanApplication;
}

export async function deleteCustomerLoanApplication(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("customer_loan_applications")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}