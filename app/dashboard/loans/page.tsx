import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import CustomerLoanApplicationForm from "@/modules/loans/components/CustomerLoanApplicationForm";
import CustomerLoansTable from "@/modules/loans/components/CustomerLoansTable";
import LoanMonthPicker from "@/modules/loans/components/LoanMonthPicker";

interface LoansPageProps {
  searchParams?: Promise<{ month?: string }>;
}

function getMonthKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Africa/Lusaka",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const requestedMonth = (await searchParams)?.month;
  const currentMonth = getMonthKey(new Date());
  const selectedMonth =
    requestedMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth) && requestedMonth <= currentMonth
      ? requestedMonth
      : currentMonth;
  const [selectedYear, selectedMonthNumber] = selectedMonth.split("-").map(Number);
  const monthStart = `${selectedMonth}-01`;
  const nextMonthStart = new Date(Date.UTC(selectedYear, selectedMonthNumber, 1))
    .toISOString()
    .slice(0, 10);
  const selectedMonthLabel = new Intl.DateTimeFormat("en-ZM", {
    month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(Date.UTC(selectedYear, selectedMonthNumber - 1, 1, 12)));

  /*
   * ==========================================================
   * LOAD ALL CUSTOMER LOAN DATA
   * ==========================================================
   */

  const [
    customersResult,
    collateralsResult,
    operatorsResult,
    loanProductsResult,
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

    adminSupabase
      .from("loan_products")
      .select("id, name, min_amount, max_amount, requires_collateral, status")
      .eq("status", "Active")
      .order("name", { ascending: true }),

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
    JSON.stringify(
      operatorsResult.error,
      null,
      2
    )
  );

  console.error(
    "Operators loading error details:",
    {
      message: operatorsResult.error.message,
      details: operatorsResult.error.details,
      hint: operatorsResult.error.hint,
      code: operatorsResult.error.code,
    }
  );
}

  if (loanTermsResult.error) {
    console.error(
      "Loan terms loading error:",
      loanTermsResult.error
    );
  }

  if (loanProductsResult.error) {
    console.error("Loan products loading error:", loanProductsResult.error);
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

  const loanProducts = loanProductsResult.data ?? [];

  const loanTerms =
    loanTermsResult.data ?? [];

  const loans =
    loansResult.data ?? [];

  /*
   * ==========================================================
   * LOAN STATISTICS
   * ==========================================================
   */

  const monthlyLoans = loans.filter((loan) => {
    const applicationDate = loan.application_date;
    return applicationDate >= monthStart && applicationDate < nextMonthStart;
  });

  const totalLoans = monthlyLoans.length;

  const pendingLoans =
    monthlyLoans.filter(
      (loan) =>
        loan.status === "Pending"
    ).length;

  const inProgressLoans =
    monthlyLoans.filter((loan) =>
      ["Under Review", "Approved", "Active"].includes(loan.status)
    ).length;

  const completedLoans =
    monthlyLoans.filter((loan) => loan.status === "Completed").length;

  /*
   * ==========================================================
   * TOTAL PRINCIPAL
   * ==========================================================
   */

  const totalPrincipal =
    monthlyLoans.reduce(
      (total, loan) => total + Number(loan.approved_amount ?? loan.requested_amount ?? 0),
      0
    );

  /*
   * ==========================================================
   * TOTAL OUTSTANDING
   * ==========================================================
   */

  const totalOutstanding =
    monthlyLoans
      .filter((loan) => loan.status !== "Completed")
      .reduce(
      (total, loan) => total + Number(loan.outstanding_balance || 0),
      0
      );

  const revenueLoans = monthlyLoans.filter((loan) =>
    ["Approved", "Active", "Completed"].includes(loan.status)
  );

  const totalRevenue = revenueLoans.reduce((total, loan) => {
    const principal = Number(loan.approved_amount ?? loan.requested_amount ?? 0);
    const expectedRevenue = Number(
      loan.total_payable ?? principal + principal * (Number(loan.interest_rate ?? 0) / 100)
    );
    return total + expectedRevenue;
  }, 0);

  const totalProfit = revenueLoans.reduce((total, loan) => {
    const principal = Number(loan.approved_amount ?? loan.requested_amount ?? 0);
    const expectedRevenue = Number(
      loan.total_payable ?? principal + principal * (Number(loan.interest_rate ?? 0) / 100)
    );
    return total + Math.max(expectedRevenue - principal, 0);
  }, 0);

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
        <LoanMonthPicker value={selectedMonth} currentMonth={currentMonth} label={selectedMonthLabel} />
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

        {/* IN PROGRESS */}

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-700">
            In Progress
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-800">
            {inProgressLoans}
          </p>
        </div>

        {/* COMPLETED */}

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-800">
            {completedLoans}
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

      <p className="-mt-4 text-sm text-slate-500">
        Summary for {selectedMonthLabel}. The loan list below continues to show all applications.
      </p>

      {/* ======================================================
          FINANCIAL SUMMARY
          ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

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

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-blue-700">Total Revenue</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{formatMoney(totalRevenue)}</p>
          <p className="mt-2 text-sm text-blue-800">Expected repayments for issued loans in {selectedMonthLabel}.</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-amber-700">Total Profit</p>
          <p className="mt-2 text-3xl font-bold text-amber-900">{formatMoney(totalProfit)}</p>
          <p className="mt-2 text-sm text-amber-800">Expected interest before expenses.</p>
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
          loanProducts={loanProducts}
          loanTerms={loanTerms}
        />

      </section>

      {/* ======================================================
          EXISTING LOANS TABLE
          ====================================================== */}

      <section>
        <CustomerLoansTable
          loans={loans}
          customers={customers}
          collaterals={collaterals}
          operators={operators}
        />
      </section>

    </div>
  );
}
