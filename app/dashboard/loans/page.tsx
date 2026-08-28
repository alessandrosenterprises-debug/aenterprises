import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import CustomerLoanApplicationForm from "@/modules/loans/components/CustomerLoanApplicationForm";
import CustomerLoansTable from "@/modules/loans/components/CustomerLoansTable";

export default async function LoansPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  /*
   * ==========================================================
   * LOAD ALL CUSTOMER LOAN DATA
   * ==========================================================
   */

  const [
    customersResult,
    collateralsResult,
    operatorsResult,
    loanTermsResult,
    loansResult,
  ] = await Promise.all([
    /*
     * ========================================================
     * CUSTOMERS
     * ========================================================
     */

    supabase
      .from("customers")
      .select(`
        id,
        customer_code,
        full_name,
        phone,
        email,
        national_id
      `)
      .eq("is_active", true)
      .order("full_name", {
        ascending: true,
      }),

    /*
     * ========================================================
     * COLLATERAL CATALOGUE
     * ========================================================
     */

    supabase
      .from("collateral_catalogue")
      .select(`
        id,
        name,
        description,
        active
      `)
      .eq("active", true)
      .order("name", {
        ascending: true,
      }),

    /*
     * ========================================================
     * DISBURSEMENT ACCOUNTS / OPERATORS
     * ========================================================
     */

    supabase
      .from("operators")
      .select(`
        id,
        name,
        type,
        code,
        logo,
        active
      `)
      .eq("active", true)
      .order("name", {
        ascending: true,
      }),

    /*
     * ========================================================
     * LOAN TERMS
     *
     * These are configured from:
     *
     * /dashboard/configuration/loanTerms
     *
     * IMPORTANT:
     *
     * Use the admin client here because loan_product_terms
     * configuration data may be hidden by RLS when using
     * the normal authenticated client.
     * ========================================================
     */

    adminSupabase
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
      }),

    /*
     * ========================================================
     * EXISTING CUSTOMER LOANS
     * ========================================================
     */

    supabase
      .from("customer_loan_applications")
      .select(`
        *,
        customers (
          id,
          customer_code,
          full_name,
          phone,
          email,
          national_id
        ),
        collateral_catalogue (
          id,
          name,
          description
        ),
        operators (
          id,
          name,
          type,
          code,
          logo
        )
      `)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  /*
   * ==========================================================
   * ERROR HANDLING
   * ==========================================================
   */

  if (customersResult.error) {
    console.error(
      "Customers loading error:",
      customersResult.error
    );
  }

  if (collateralsResult.error) {
    console.error(
      "Collateral loading error:",
      collateralsResult.error
    );
  }

  if (operatorsResult.error) {
    console.error(
      "Operators loading error:",
      operatorsResult.error
    );
  }

  if (loanTermsResult.error) {
    console.error(
      "Loan terms loading error:",
      loanTermsResult.error
    );
  }

  if (loansResult.error) {
    console.error(
      "Customer loans loading error:",
      loansResult.error
    );
  }

  /*
   * ==========================================================
   * NORMALIZE DATA
   * ==========================================================
   */

  const customers =
    customersResult.data ?? [];

  const collaterals =
    collateralsResult.data ?? [];

  const operators =
    operatorsResult.data ?? [];

  const loanTerms =
    loanTermsResult.data ?? [];

  const loans =
    loansResult.data ?? [];

  /*
   * ==========================================================
   * DEBUG LOAN TERMS
   *
   * This confirms exactly what is being passed to
   * CustomerLoanApplicationForm.
   * ==========================================================
   */

  console.log(
    "ACTIVE LOAN TERMS:",
    loanTerms
  );

  /*
   * ==========================================================
   * LOAN STATISTICS
   * ==========================================================
   */

  const totalLoans =
    loans.length;

  const pendingLoans =
    loans.filter(
      (loan) =>
        loan.status === "Pending"
    ).length;

  const partialLoans =
    loans.filter(
      (loan) =>
        loan.status === "Partial"
    ).length;

  const clearedLoans =
    loans.filter(
      (loan) =>
        loan.status === "Cleared"
    ).length;

  /*
   * ==========================================================
   * TOTAL PRINCIPAL
   * ==========================================================
   */

  const totalPrincipal =
    loans.reduce(
      (total, loan) =>
        total +
        Number(
          loan.requested_amount || 0
        ),
      0
    );

  /*
   * ==========================================================
   * TOTAL OUTSTANDING
   * ==========================================================
   */

  const totalOutstanding =
    loans.reduce(
      (total, loan) =>
        total +
        Number(
          loan.outstanding_balance || 0
        ),
      0
    );

  /*
   * ==========================================================
   * MONEY FORMATTER
   * ==========================================================
   */

  function formatMoney(
    value: number
  ) {
    return new Intl.NumberFormat(
      "en-ZM",
      {
        style: "currency",
        currency: "ZMW",
        minimumFractionDigits: 2,
      }
    ).format(value);
  }

  /*
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="space-y-8">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#03162F]">
            Customer Loans
          </h1>

          <p className="mt-2 text-slate-500">
            Manage customer loans, repayments,
            collateral and outstanding balances.
          </p>
        </div>
      </div>

      {/* ======================================================
          SUMMARY CARDS
          ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

        {/* TOTAL */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Loans
          </p>

          <p className="mt-2 text-3xl font-bold text-[#03162F]">
            {totalLoans}
          </p>
        </div>

        {/* PENDING */}

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-blue-700">
            Pending
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-800">
            {pendingLoans}
          </p>
        </div>

        {/* PARTIAL */}

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-700">
            Partial
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-800">
            {partialLoans}
          </p>
        </div>

        {/* CLEARED */}

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">
            Cleared
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-800">
            {clearedLoans}
          </p>
        </div>

        {/* OUTSTANDING */}

        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-purple-700">
            Outstanding
          </p>

          <p className="mt-2 text-2xl font-bold text-purple-800">
            {formatMoney(
              totalOutstanding
            )}
          </p>
        </div>
      </section>

      {/* ======================================================
          FINANCIAL SUMMARY
          ====================================================== */}

      <section className="grid gap-4 md:grid-cols-2">

        {/* PRINCIPAL */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Principal Issued
          </p>

          <p className="mt-2 text-3xl font-bold text-[#03162F]">
            {formatMoney(
              totalPrincipal
            )}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Principal recorded across customer loans.
          </p>
        </div>

        {/* OUTSTANDING */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Outstanding
          </p>

          <p className="mt-2 text-3xl font-bold text-purple-700">
            {formatMoney(
              totalOutstanding
            )}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Amount currently owed by customers.
          </p>
        </div>
      </section>

      {/* ======================================================
          RECORD CUSTOMER LOAN
          ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#03162F]">
            Record Customer Loan
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select a configured loan term and record the
            customer loan. Interest and due date are calculated
            automatically.
          </p>
        </div>

        {/* ====================================================
            LOAN TERMS ARE PASSED INTO THE FORM
            ==================================================== */}

        <CustomerLoanApplicationForm
          customers={customers}
          collaterals={collaterals}
          operators={operators}
          loanTerms={loanTerms}
        />

      </section>

      {/* ======================================================
          EXISTING LOANS TABLE
          ====================================================== */}

      <section>
        <CustomerLoansTable
          loans={loans}
        />
      </section>

    </div>
  );
}