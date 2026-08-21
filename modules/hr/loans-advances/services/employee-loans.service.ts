import { createClient } from "@/lib/supabase/server";

export interface EmployeeLoan {
  id: string;
  employee_id: string;
  loan_product_id: string | null;
  loan_type: string;

  principal_amount: number;
  interest_rate: number;
  total_payable: number;

  repayment_period: number;
  monthly_installment: number;

  application_date: string;
  start_date: string | null;

  amount_paid: number;
  outstanding_balance: number;

  status: string;

  approved_by: string | null;
  approved_at: string | null;

  rejection_reason: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;

  employees?: {
    full_name: string;
    position: string | null;
  } | null;

  loan_products?: {
    name: string;
    description: string | null;
    min_amount: number | null;
    max_amount: number | null;
    interest_rate: number | null;
    repayment_period: number | null;
    requires_collateral: boolean;
    status: string;
  } | null;
}

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

/* ============================================================
   GET EMPLOYEE LOANS
============================================================ */

export async function getEmployeeLoans(): Promise<EmployeeLoan[]> {
  const supabase = await createClient();

  /*
   * Load the loan records first.
   *
   * We intentionally do NOT use:
   *
   * employees (...)
   * loan_products (...)
   *
   * in the same Supabase query.
   *
   * This avoids relationship/schema-cache problems.
   */

  const { data: loanData, error: loanError } =
    await supabase
      .from("hr_employee_loans")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

  if (loanError) {
    console.error(
      "Employee loans loading error:",
      loanError
    );

    throw new Error(loanError.message);
  }

  const loans = loanData ?? [];

  if (loans.length === 0) {
    return [];
  }

  /* ==========================================================
     LOAD EMPLOYEES
  ========================================================== */

  const employeeIds = [
    ...new Set(
      loans
        .map((loan) => loan.employee_id)
        .filter(Boolean)
    ),
  ];

  const { data: employeeData, error: employeeError } =
    await supabase
      .from("employees")
      .select(`
        id,
        full_name,
        position
      `)
      .in("id", employeeIds);

  if (employeeError) {
    console.error(
      "Employee data loading error:",
      employeeError
    );

    throw new Error(employeeError.message);
  }

  /* ==========================================================
     LOAD LOAN PRODUCTS
  ========================================================== */

  const loanProductIds = [
    ...new Set(
      loans
        .map((loan) => loan.loan_product_id)
        .filter(Boolean)
    ),
  ];

  let loanProductData: any[] = [];

  if (loanProductIds.length > 0) {
    const {
      data,
      error: loanProductError,
    } = await supabase
      .from("loan_products")
      .select(`
        id,
        name,
        description,
        min_amount,
        max_amount,
        interest_rate,
        repayment_period,
        requires_collateral,
        status
      `)
      .in("id", loanProductIds);

    if (loanProductError) {
      console.error(
        "Loan products loading error:",
        loanProductError
      );

      throw new Error(
        loanProductError.message
      );
    }

    loanProductData = data ?? [];
  }

  /* ==========================================================
     CREATE LOOKUP MAPS
  ========================================================== */

  const employeeMap = new Map(
    (employeeData ?? []).map(
      (employee) => [
        employee.id,
        {
          full_name: employee.full_name,
          position: employee.position ?? null,
        },
      ]
    )
  );

  const loanProductMap = new Map(
    loanProductData.map(
      (product) => [
        product.id,
        {
          name: product.name,
          description:
            product.description ?? null,
          min_amount:
            product.min_amount ?? null,
          max_amount:
            product.max_amount ?? null,
          interest_rate:
            product.interest_rate ?? null,
          repayment_period:
            product.repayment_period ?? null,
          requires_collateral:
            product.requires_collateral,
          status: product.status,
        },
      ]
    )
  );

  /* ==========================================================
     COMBINE DATA
  ========================================================== */

  return loans.map((loan) => ({
    ...loan,

    employees:
      employeeMap.get(
        loan.employee_id
      ) ?? null,

    loan_products:
      loan.loan_product_id
        ? loanProductMap.get(
            loan.loan_product_id
          ) ?? null
        : null,
  })) as EmployeeLoan[];
}

/* ============================================================
   CREATE EMPLOYEE LOAN
============================================================ */

export async function createEmployeeLoan(
  input: EmployeeLoanInput
): Promise<EmployeeLoan> {
  const supabase = await createClient();

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
    .select("*")
    .single();

  if (error) {
    console.error(
      "Employee loan creation error:",
      error
    );

    throw new Error(error.message);
  }

  return data as EmployeeLoan;
}

/* ============================================================
   UPDATE EMPLOYEE LOAN
============================================================ */

export async function updateEmployeeLoan(
  id: string,
  input: Partial<EmployeeLoanInput>
): Promise<EmployeeLoan> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hr_employee_loans")
    .update({
      ...input,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Employee loan update error:",
      error
    );

    throw new Error(error.message);
  }

  return data as EmployeeLoan;
}

/* ============================================================
   DELETE EMPLOYEE LOAN
============================================================ */

export async function deleteEmployeeLoan(
  id: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("hr_employee_loans")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Employee loan deletion error:",
      error
    );

    throw new Error(error.message);
  }
}