import { createClient } from "@/lib/supabase/server";

import type {
  CustomerLoanApplication,
  CustomerLoanApplicationInput,
} from "../types/customer-loan";

/**
 * Supported repayment frequencies.
 *
 * The loan repayment_period is stored as a number of days.
 * The frequency determines how many installments are expected.
 */
type RepaymentFrequency =
  | "Weekly"
  | "Bi-Weekly"
  | "Monthly";

/**
 * Approval roles allowed to approve customer loans.
 */
type LoanApprovalRole =
  | "manager"
  | "admin"
  | "super_admin";

/**
 * Determine the repayment frequency from the loan product name.
 *
 * Examples:
 * - Weekly
 * - Bi-Weekly
 * - Bi Weekly
 * - Monthly
 */
function getRepaymentFrequency(
  productName: string | null | undefined
): RepaymentFrequency | null {
  if (!productName) {
    return null;
  }

  const normalized = productName
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

  // IMPORTANT:
  // Check Bi-Weekly BEFORE Weekly because
  // "bi weekly" contains "weekly".
  if (
    normalized === "bi weekly" ||
    normalized === "biweekly" ||
    normalized.includes("bi weekly") ||
    normalized.includes("biweekly")
  ) {
    return "Bi-Weekly";
  }

  if (
    normalized === "weekly" ||
    normalized.includes("weekly")
  ) {
    return "Weekly";
  }

  if (
    normalized === "monthly" ||
    normalized.includes("monthly")
  ) {
    return "Monthly";
  }

  return null;
}

/**
 * Determine the repayment frequency from the application
 * when there is no loan product.
 */
function getFrequencyFromLoanType(
  loanType: string | null | undefined
): RepaymentFrequency | null {
  if (!loanType) {
    return null;
  }

  const normalized = loanType
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

  if (
    normalized.includes("bi weekly") ||
    normalized.includes("biweekly")
  ) {
    return "Bi-Weekly";
  }

  if (normalized.includes("weekly")) {
    return "Weekly";
  }

  if (normalized.includes("monthly")) {
    return "Monthly";
  }

  return null;
}

/**
 * Calculate the number of repayment installments.
 *
 * repaymentPeriod is stored in DAYS.
 *
 * Weekly:
 *   7 days = 1 installment
 *   14 days = 2 installments
 *   31 days = 5 installments
 *
 * Bi-Weekly:
 *   14 days = 1 installment
 *   30 days = 3 installments
 *   31 days = 3 installments
 *
 * Monthly:
 *   30/31 days = 1 installment
 *   60 days = 2 installments
 *   90 days = 3 installments
 */
function calculateInstallmentCount(
  repaymentPeriod: number,
  frequency: RepaymentFrequency
): number {
  if (
    !Number.isFinite(repaymentPeriod) ||
    repaymentPeriod <= 0
  ) {
    return 0;
  }

  switch (frequency) {
    case "Weekly":
      return Math.max(
        1,
        Math.ceil(repaymentPeriod / 7)
      );

    case "Bi-Weekly":
      return Math.max(
        1,
        Math.ceil(repaymentPeriod / 14)
      );

    case "Monthly":
      return Math.max(
        1,
        Math.ceil(repaymentPeriod / 30)
      );

    default:
      return 0;
  }
}

/**
 * Calculate the complete loan figures.
 *
 * Interest is treated as a flat percentage of the approved amount.
 *
 * Example:
 * K1,500 at 30%
 *
 * Interest:
 * K1,500 × 30% = K450
 *
 * Total payable:
 * K1,500 + K450 = K1,950
 *
 * Monthly over 31 days:
 * 1 repayment installment
 *
 * Monthly installment:
 * K1,950
 */
function calculateLoanFigures({
  amount,
  interestRate,
  repaymentPeriod,
  frequency,
  amountPaid = 0,
}: {
  amount: number;
  interestRate: number | null;
  repaymentPeriod: number | null;
  frequency: RepaymentFrequency | null;
  amountPaid?: number;
}) {
  const principal = Number(amount);
  const rate = Number(interestRate ?? 0);
  const period = Number(repaymentPeriod ?? 0);
  const paid = Math.max(0, Number(amountPaid ?? 0));

  if (
    !Number.isFinite(principal) ||
    principal <= 0
  ) {
    throw new Error(
      "Loan amount must be greater than zero."
    );
  }

  const interestAmount =
    rate > 0
      ? principal * (rate / 100)
      : 0;

  const totalPayable =
    principal + interestAmount;

  const installmentCount =
    frequency && period > 0
      ? calculateInstallmentCount(
          period,
          frequency
        )
      : 0;

  const installment =
    installmentCount > 0
      ? totalPayable / installmentCount
      : null;

  const outstandingBalance = Math.max(
    0,
    totalPayable - paid
  );

  return {
    totalPayable,
    installment,
    installmentCount,
    outstandingBalance,
  };
}

/**
 * Get the current authenticated user and verify
 * that the user has permission to approve loans.
 */
async function getLoanApprover() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Unable to verify current user: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error(
      "You must be signed in to approve a loan."
    );
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    throw new Error(
      `Unable to verify your profile: ${profileError.message}`
    );
  }

  if (!profile) {
    throw new Error(
      "Your user profile could not be found."
    );
  }

  const role =
    typeof profile.role === "string"
      ? profile.role.toLowerCase()
      : "";

  const allowedRoles: LoanApprovalRole[] = [
    "manager",
    "admin",
    "super_admin",
  ];

  if (
    !allowedRoles.includes(
      role as LoanApprovalRole
    )
  ) {
    throw new Error(
      "You do not have permission to approve customer loans."
    );
  }

  return {
    id: profile.id as string,
    name:
      profile.full_name ??
      user.email ??
      "Unknown Approver",
    role,
  };
}

/**
 * Get all customer loan applications.
 *
 * Used by the admin/dashboard side.
 */
export async function getCustomerLoanApplications(): Promise<
  CustomerLoanApplication[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_loan_applications")
    .select(`
      *,
      customers (
        id,
        customer_code,
        full_name,
        phone,
        email
      ),
      loan_products (
        id,
        name,
        description,
        min_amount,
        max_amount,
        interest_rate,
        repayment_period,
        requires_collateral,
        status
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Customer loan applications loading error:",
      error
    );

    throw new Error(error.message);
  }

  return (data ?? []) as CustomerLoanApplication[];
}

/**
 * Get a single customer loan application.
 */
export async function getCustomerLoanApplication(
  id: string
): Promise<CustomerLoanApplication | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_loan_applications")
    .select(`
      *,
      customers (
        id,
        customer_code,
        full_name,
        phone,
        email
      ),
      loan_products (
        id,
        name,
        description,
        min_amount,
        max_amount,
        interest_rate,
        repayment_period,
        requires_collateral,
        status
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "Customer loan application loading error:",
      error
    );

    throw new Error(error.message);
  }

  return data as CustomerLoanApplication | null;
}

/**
 * Create a customer loan application.
 *
 * Used by:
 * - Customer App
 * - Walk-in customer entry
 */
export async function createCustomerLoanApplication(
  input: CustomerLoanApplicationInput
): Promise<CustomerLoanApplication> {
  const supabase = await createClient();

  const requestedAmount = Number(
    input.requested_amount
  );

  if (
    !Number.isFinite(requestedAmount) ||
    requestedAmount <= 0
  ) {
    throw new Error(
      "Requested loan amount must be greater than zero."
    );
  }

  /**
   * Load selected loan product.
   *
   * Minimum and maximum amounts are used internally
   * for validation only.
   */
  const {
    data: product,
    error: productError,
  } = input.loan_product_id
    ? await supabase
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
        .maybeSingle()
    : {
        data: null,
        error: null,
      };

  if (productError) {
    console.error(
      "Loan product loading error:",
      productError
    );

    throw new Error(productError.message);
  }

  if (
    input.loan_product_id &&
    !product
  ) {
    throw new Error(
      "The selected loan product could not be found."
    );
  }

  if (
    product &&
    product.status !== "Active"
  ) {
    throw new Error(
      "The selected loan product is not active."
    );
  }

  if (
    product?.min_amount !== null &&
    product?.min_amount !== undefined &&
    requestedAmount <
      Number(product.min_amount)
  ) {
    throw new Error(
      "The requested amount is below the minimum allowed amount for this loan product."
    );
  }

  if (
    product?.max_amount !== null &&
    product?.max_amount !== undefined &&
    requestedAmount >
      Number(product.max_amount)
  ) {
    throw new Error(
      "The requested amount exceeds the maximum allowed amount for this loan product."
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

  /**
   * Determine repayment frequency.
   *
   * Product name is preferred because Weekly,
   * Bi-Weekly and Monthly are loan products.
   */
  const frequency =
    getRepaymentFrequency(
      product?.name
    ) ??
    getFrequencyFromLoanType(
      input.loan_type
    );

  /**
   * Calculate figures at creation time too.
   *
   * The application is not approved yet, therefore
   * these figures are based on the requested amount.
   *
   * Approval will recalculate everything using the
   * actual approved amount.
   */
  const calculatedFigures =
    calculateLoanFigures({
      amount: requestedAmount,
      interestRate,
      repaymentPeriod,
      frequency,
      amountPaid: 0,
    });

  const now = new Date();

  const applicationNumber =
    `LN-${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}-${String(
      now.getHours()
    ).padStart(2, "0")}${String(
      now.getMinutes()
    ).padStart(2, "0")}${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

  const { data, error } =
    await supabase
      .from("customer_loan_applications")
      .insert({
        application_number:
          applicationNumber,

        customer_id:
          input.customer_id,

        loan_product_id:
          input.loan_product_id ?? null,

        application_source:
          input.application_source,

        application_date:
          input.application_date ??
          new Date()
            .toISOString()
            .split("T")[0],

        loan_type:
          input.loan_type,

        requested_amount:
          requestedAmount,

        interest_rate:
          interestRate,

        repayment_period:
          repaymentPeriod,

        loan_purpose:
          input.loan_purpose?.trim() ||
          null,

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

        residential_address:
          input.residential_address?.trim() ||
          null,

        next_of_kin_name:
          input.next_of_kin_name?.trim() ||
          null,

        next_of_kin_relationship:
          input.next_of_kin_relationship?.trim() ||
          null,

        next_of_kin_phone:
          input.next_of_kin_phone?.trim() ||
          null,

        nrc_front_path:
          input.nrc_front_path ?? null,

        nrc_back_path:
          input.nrc_back_path ?? null,

        selfie_path:
          input.selfie_path ?? null,

        status:
          "Pending",

        amount_paid:
          0,

        total_payable:
          calculatedFigures.totalPayable,

        monthly_installment:
          calculatedFigures.installment,

        outstanding_balance:
          calculatedFigures.outstandingBalance,

        notes:
          input.notes?.trim() ||
          null,
      })
      .select("*")
      .single();

  if (error) {
    console.error(
      "Customer loan application creation error:",
      error
    );

    throw new Error(error.message);
  }

  return data as CustomerLoanApplication;
}
type LoanProductNameRelation =
  | { name: string | null }
  | { name: string | null }[]
  | null;

function getLoanProductName(
  product: LoanProductNameRelation
): string | null {
  if (Array.isArray(product)) {
    return product[0]?.name ?? null;
  }

  return product?.name ?? null;
}
/**
 * Update a customer loan application.
 */
export async function updateCustomerLoanApplication(
  id: string,
  input: Partial<CustomerLoanApplicationInput>
): Promise<CustomerLoanApplication> {
  const supabase = await createClient();

  const updateData: Record<
    string,
    unknown
  > = {
    updated_at:
      new Date().toISOString(),
  };

  if (
    input.customer_id !== undefined
  ) {
    updateData.customer_id =
      input.customer_id;
  }

  if (
    input.loan_product_id !== undefined
  ) {
    updateData.loan_product_id =
      input.loan_product_id;
  }

  if (
    input.application_source !== undefined
  ) {
    updateData.application_source =
      input.application_source;
  }

  if (
    input.application_date !== undefined
  ) {
    updateData.application_date =
      input.application_date;
  }

  if (
    input.loan_type !== undefined
  ) {
    updateData.loan_type =
      input.loan_type;
  }

  if (
    input.requested_amount !== undefined
  ) {
    const amount = Number(
      input.requested_amount
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "Requested loan amount must be greater than zero."
      );
    }

    updateData.requested_amount =
      amount;
  }

  if (
    input.interest_rate !== undefined
  ) {
    updateData.interest_rate =
      input.interest_rate;
  }

  if (
    input.repayment_period !== undefined
  ) {
    updateData.repayment_period =
      input.repayment_period;
  }

  if (
    input.loan_purpose !== undefined
  ) {
    updateData.loan_purpose =
      input.loan_purpose?.trim() ||
      null;
  }

  if (
    input.collateral_required !== undefined
  ) {
    updateData.collateral_required =
      input.collateral_required;
  }

  if (
    input.collateral_description !==
    undefined
  ) {
    updateData.collateral_description =
      input.collateral_description?.trim() ||
      null;
  }

  if (
    input.collateral_id !== undefined
  ) {
    updateData.collateral_id =
      input.collateral_id;
  }

  if (
    input.collateral_worth !== undefined
  ) {
    updateData.collateral_worth =
      input.collateral_worth !== null
        ? Number(input.collateral_worth)
        : null;
  }

  if (
    input.account_operator_id !==
    undefined
  ) {
    updateData.account_operator_id =
      input.account_operator_id;
  }

  if (
    input.due_date !== undefined
  ) {
    updateData.due_date =
      input.due_date;
  }

  if (
    input.residential_address !==
    undefined
  ) {
    updateData.residential_address =
      input.residential_address?.trim() ||
      null;
  }

  if (
    input.next_of_kin_name !==
    undefined
  ) {
    updateData.next_of_kin_name =
      input.next_of_kin_name?.trim() ||
      null;
  }

  if (
    input.next_of_kin_relationship !==
    undefined
  ) {
    updateData.next_of_kin_relationship =
      input.next_of_kin_relationship?.trim() ||
      null;
  }

  if (
    input.next_of_kin_phone !==
    undefined
  ) {
    updateData.next_of_kin_phone =
      input.next_of_kin_phone?.trim() ||
      null;
  }

  if (
    input.nrc_front_path !==
    undefined
  ) {
    updateData.nrc_front_path =
      input.nrc_front_path;
  }

  if (
    input.nrc_back_path !==
    undefined
  ) {
    updateData.nrc_back_path =
      input.nrc_back_path;
  }

  if (
    input.selfie_path !==
    undefined
  ) {
    updateData.selfie_path =
      input.selfie_path;
  }

  if (
    input.notes !== undefined
  ) {
    updateData.notes =
      input.notes?.trim() ||
      null;
  }

  /**
   * If any of the calculation inputs change,
   * recalculate the saved figures.
   */
  const shouldRecalculate =
    input.requested_amount !== undefined ||
    input.interest_rate !== undefined ||
    input.repayment_period !== undefined ||
    input.loan_product_id !== undefined ||
    input.loan_type !== undefined;

  if (shouldRecalculate) {
    const {
      data: existingLoan,
      error: existingLoanError,
    } = await supabase
      .from("customer_loan_applications")
      .select(`
        requested_amount,
        approved_amount,
        interest_rate,
        repayment_period,
        amount_paid,
        loan_type,
        loan_products (
          name
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (existingLoanError) {
      throw new Error(
        existingLoanError.message
      );
    }

    if (!existingLoan) {
      throw new Error(
        "Loan application not found."
      );
    }

    const requestedAmount =
      input.requested_amount !== undefined
        ? Number(input.requested_amount)
        : Number(
            existingLoan.requested_amount
          );

    const approvedAmount =
      existingLoan.approved_amount !== null
        ? Number(
            existingLoan.approved_amount
          )
        : null;

    const amountForCalculation =
      approvedAmount ??
      requestedAmount;

    const rate =
      input.interest_rate !== undefined
        ? input.interest_rate
        : existingLoan.interest_rate;

    const period =
      input.repayment_period !== undefined
        ? input.repayment_period
        : existingLoan.repayment_period;

    const loanType =
      input.loan_type !== undefined
        ? input.loan_type
        : existingLoan.loan_type;

    const productName = getLoanProductName(
  existingLoan.loan_products
);
    const frequency =
      getRepaymentFrequency(
        productName
      ) ??
      getFrequencyFromLoanType(
        loanType
      );

    const figures =
      calculateLoanFigures({
        amount:
          amountForCalculation,
        interestRate: rate,
        repaymentPeriod: period,
        frequency,
        amountPaid:
          Number(
            existingLoan.amount_paid ?? 0
          ),
      });

    updateData.total_payable =
      figures.totalPayable;

    updateData.monthly_installment =
      figures.installment;

    updateData.outstanding_balance =
      figures.outstandingBalance;
  }

  const { data, error } =
    await supabase
      .from("customer_loan_applications")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

  if (error) {
    console.error(
      "Customer loan application update error:",
      error
    );

    throw new Error(error.message);
  }

  return data as CustomerLoanApplication;
}

/**
 * Approve a customer loan application.
 *
 * The authenticated Manager, Admin or Super Admin
 * becomes the official approver.
 */
export async function approveCustomerLoanApplication(
  id: string,
  approvedAmount: number
): Promise<CustomerLoanApplication> {
  const supabase = await createClient();

  const amount = Number(
    approvedAmount
  );

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Approved amount must be greater than zero."
    );
  }

  /**
   * Verify the person performing the approval.
   */
  const approver =
    await getLoanApprover();

  /**
   * Load application and loan product.
   */
  const {
    data: application,
    error: loadError,
  } = await supabase
    .from("customer_loan_applications")
    .select(`
      id,
      requested_amount,
      interest_rate,
      repayment_period,
      amount_paid,
      loan_type,
      loan_products (
        name
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    throw new Error(
      loadError.message
    );
  }

  if (!application) {
    throw new Error(
      "Loan application not found."
    );
  }

  /**
   * Determine repayment frequency.
   */
  const productName = getLoanProductName(
  application.loan_products
);

  const frequency =
    getRepaymentFrequency(
      productName
    ) ??
    getFrequencyFromLoanType(
      application.loan_type
    );

  /**
   * Calculate every financial figure from
   * the approved amount.
   */
  const figures =
    calculateLoanFigures({
      amount,
      interestRate:
        application.interest_rate,
      repaymentPeriod:
        application.repayment_period,
      frequency,
      amountPaid: 0,
    });

  const now =
    new Date().toISOString();

  /**
   * Save the approved amount, calculated figures,
   * approver and approval timestamp together.
   */
  const { data, error } =
    await supabase
      .from("customer_loan_applications")
      .update({
        approved_amount:
          amount,

        total_payable:
          figures.totalPayable,

        monthly_installment:
          figures.installment,

        amount_paid:
          0,

        outstanding_balance:
          figures.totalPayable,

        status:
          "Approved",

        approved_by:
          approver.id,

        approved_at:
          now,

        rejection_reason:
          null,

        updated_at:
          now,
      })
      .eq("id", id)
      .select("*")
      .single();

  if (error) {
    console.error(
      "Customer loan approval error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  return data as CustomerLoanApplication;
}

/**
 * Reject a customer loan application.
 */
export async function rejectCustomerLoanApplication(
  id: string,
  rejectionReason: string
): Promise<CustomerLoanApplication> {
  const supabase = await createClient();

  const reason =
    rejectionReason.trim();

  if (!reason) {
    throw new Error(
      "A rejection reason is required."
    );
  }

  const { data, error } =
    await supabase
      .from("customer_loan_applications")
      .update({
        status:
          "Rejected",

        rejection_reason:
          reason,

        approved_amount:
          null,

        approved_by:
          null,

        approved_at:
          null,

        total_payable:
          null,

        monthly_installment:
          null,

        amount_paid:
          0,

        outstanding_balance:
          0,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

  if (error) {
    console.error(
      "Customer loan rejection error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  return data as CustomerLoanApplication;
}