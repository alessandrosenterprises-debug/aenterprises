import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* ============================================================
   TYPES
   ============================================================ */

export interface CustomerLoanProduct {
  id: string;

  name: string;
  description: string | null;

  min_amount: number | null;
  max_amount: number | null;

  /*
   * Legacy/default product values.
   *
   * Loan-entry configuration should prefer
   * loan_product_terms when configured.
   */
  interest_rate: number | null;
  repayment_period: number | null;

  requires_collateral: boolean;

  status: string;

  created_at: string;
  updated_at: string;
}

export interface LoanProductTerm {
  id: string;

  loan_product_id: string;

  period_days: number;

  interest_rate: number;

  active: boolean;
}

/* ============================================================
   INTERNAL ERROR HELPER
   ============================================================ */

function getSupabaseErrorDetails(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const details =
      error as Record<string, unknown>;

    return {
      message: details.message,
      details: details.details,
      hint: details.hint,
      code: details.code,
    };
  }

  return {
    message:
      error instanceof Error
        ? error.message
        : String(error),

    details: undefined,
    hint: undefined,
    code: undefined,
  };
}

/* ============================================================
   GET ACTIVE CUSTOMER LOAN PRODUCTS
   ============================================================ */

/**
 * Gets active loan products for customer-facing functionality.
 *
 * This uses the normal authenticated Supabase client.
 *
 * Used by:
 *
 * - Customer App
 * - Walk-in loan application
 * - Other customer-facing loan functionality
 */
export async function getCustomerLoanProducts(): Promise<
  CustomerLoanProduct[]
> {
  const supabase = await createClient();

  const {
    data,
    error,
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
      status,
      created_at,
      updated_at
    `)
    .eq("status", "Active")
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Customer loan products loading error:",
      getSupabaseErrorDetails(error)
    );

    throw new Error(error.message);
  }

  return (data ?? []) as CustomerLoanProduct[];
}

/* ============================================================
   GET ACTIVE LOAN PRODUCTS FOR CONFIGURATION
   ============================================================ */

/**
 * Gets active loan products for administrator
 * configuration screens.
 *
 * Uses the server-side service-role client so configuration
 * RLS policies cannot incorrectly leave the product dropdown
 * empty.
 *
 * IMPORTANT:
 *
 * createAdminClient() is server-only.
 * SUPABASE_SERVICE_ROLE_KEY must NEVER be exposed
 * to the browser.
 */
export async function getConfigurationLoanProducts(): Promise<
  CustomerLoanProduct[]
> {
  const supabase = createAdminClient();

  const {
    data,
    error,
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
      status,
      created_at,
      updated_at
    `)
    .eq("status", "Active")
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Configuration loan products loading error:",
      getSupabaseErrorDetails(error)
    );

    throw new Error(error.message);
  }

  return (data ?? []) as CustomerLoanProduct[];
}

/* ============================================================
   GET LOAN TERMS FOR ONE PRODUCT
   ============================================================ */

/**
 * Gets the configured repayment terms for one loan product.
 *
 * Example:
 *
 * Loan Product
 *     ↓
 * loan_product_id
 *     ↓
 * 7 Days  — 7%
 * 15 Days — 15%
 * 31 Days — 30%
 *
 * This reads from:
 *
 * loan_product_terms
 *
 * NOT from the legacy repayment_period / interest_rate
 * columns on loan_products.
 */
export async function getLoanProductTerms(
  loanProductId: string
): Promise<LoanProductTerm[]> {
  if (!loanProductId) {
    return [];
  }

  const supabase = createAdminClient();

  const {
    data,
    error,
  } = await supabase
    .from("loan_product_terms")
    .select(`
      id,
      loan_product_id,
      period_days,
      interest_rate,
      active
    `)
    .eq(
      "loan_product_id",
      loanProductId
    )
    .eq("active", true)
    .order("period_days", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Loan product terms loading error:",
      getSupabaseErrorDetails(error)
    );

    throw new Error(error.message);
  }

  return (data ?? []) as LoanProductTerm[];
}

/* ============================================================
   GET ALL ACTIVE LOAN TERMS
   ============================================================ */

/**
 * Gets every active configured loan term.
 *
 * This is useful for the walk-in/customer loan form when
 * the loan product is already known elsewhere in the page,
 * or when the page needs to preload all available terms.
 *
 * Example result:
 *
 * [
 *   {
 *     loan_product_id: "...",
 *     period_days: 7,
 *     interest_rate: 7
 *   },
 *   {
 *     loan_product_id: "...",
 *     period_days: 15,
 *     interest_rate: 15
 *   },
 *   {
 *     loan_product_id: "...",
 *     period_days: 31,
 *     interest_rate: 30
 *   }
 * ]
 */
export async function getConfigurationLoanTerms(): Promise<
  LoanProductTerm[]
> {
  const supabase = createAdminClient();

  const {
    data,
    error,
  } = await supabase
    .from("loan_product_terms")
    .select(`
      id,
      loan_product_id,
      period_days,
      interest_rate,
      active
    `)
    .eq("active", true)
    .order("period_days", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Configuration loan terms loading error:",
      getSupabaseErrorDetails(error)
    );

    throw new Error(error.message);
  }

  return (data ?? []) as LoanProductTerm[];
}

/* ============================================================
   GET LOAN PRODUCT WITH ITS TERMS
   ============================================================ */

/**
 * Gets one loan product together with its configured
 * repayment terms.
 *
 * This is useful when opening a loan product for
 * configuration or preparing the loan-entry form.
 */
export async function getConfigurationLoanProductWithTerms(
  loanProductId: string
) {
  if (!loanProductId) {
    return null;
  }

  const products =
    await getConfigurationLoanProducts();

  const product =
    products.find(
      (item) =>
        item.id === loanProductId
    ) ?? null;

  if (!product) {
    return null;
  }

  const terms =
    await getLoanProductTerms(
      loanProductId
    );

  return {
    product,
    terms,
  };
}

/* ============================================================
   GET DEFAULT TERM
   ============================================================ */

/**
 * Returns the first active configured term for a
 * loan product.
 *
 * Terms are ordered by period_days, so this normally
 * returns the shortest configured repayment period.
 */
export async function getDefaultLoanProductTerm(
  loanProductId: string
): Promise<LoanProductTerm | null> {
  const terms =
    await getLoanProductTerms(
      loanProductId
    );

  return terms[0] ?? null;
}