"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  History,
  RefreshCw,
  WalletCards,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { supabase } from "@/lib/supabase/client";

type LoanProduct = {
  id: string;
  name: string;
  description: string | null;
};

type Loan = {
  id: string;
  customer_id: string;
  loan_product_id: string | null;
  application_number: string | null;
  application_source: string;
  application_date: string;
  loan_type: string;
  requested_amount: number | string;
  approved_amount: number | string | null;
  interest_rate: number | string | null;
  repayment_period: number | string | null;
  monthly_installment: number | string | null;
  total_payable: number | string | null;
  amount_paid: number | string;
  outstanding_balance: number | string | null;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  loan_products?: LoanProduct | null;
};

function formatZMW(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "K0.00";
  }

  return `K${amount.toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-ZM", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClasses(status: string) {
  switch (status) {
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Active":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "Completed":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";

    case "Cancelled":
      return "bg-slate-100 text-slate-600 border-slate-200";

    case "Under Review":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "Pending":
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function statusDot(status: string) {
  switch (status) {
    case "Approved":
    case "Active":
      return "bg-emerald-500";

    case "Completed":
      return "bg-purple-500";

    case "Rejected":
      return "bg-red-500";

    case "Under Review":
      return "bg-indigo-500";

    default:
      return "bg-amber-500";
  }
}

export default function LoanHistoryPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  async function loadLoans(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      /*
       * Get the currently signed-in customer.
       */
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Please sign in to view your loan history."
        );
      }

      /*
       * Resolve the customer record linked
       * to the authenticated user.
       */
      const {
        data: customer,
        error: customerError,
      } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (customerError) {
        throw new Error(customerError.message);
      }

      if (!customer) {
        throw new Error("Customer account not found.");
      }

      /*
       * Load this customer's loan applications.
       */
      const {
        data,
        error: loansError,
      } = await supabase
        .from("customer_loan_applications")
        .select(`
          id,
          customer_id,
          loan_product_id,
          application_number,
          application_source,
          application_date,
          loan_type,
          requested_amount,
          approved_amount,
          interest_rate,
          repayment_period,
          monthly_installment,
          total_payable,
          amount_paid,
          outstanding_balance,
          due_date,
          status,
          created_at,
          updated_at,
          loan_products (
            id,
            name,
            description
          )
        `)
        .eq("customer_id", customer.id)
        .order("created_at", {
          ascending: false,
        });

      if (loansError) {
        console.error(
          "Loan history error:",
          loansError
        );

        throw new Error(loansError.message);
      }

      /*
       * Supabase can infer a relationship as either
       * an object or an array depending on the generated
       * database relationship type.
       *
       * Normalize it into the Loan type expected by
       * this page.
       */
      const normalizedLoans: Loan[] = (data ?? []).map(
        (loan) => {
          const row = loan as unknown as Loan & {
            loan_products?:
              | LoanProduct
              | LoanProduct[]
              | null;
          };

          const product = row.loan_products;

          return {
            ...row,
            loan_products: Array.isArray(product)
              ? product[0] ?? null
              : product ?? null,
          };
        }
      );

      setLoans(normalizedLoans);
    } catch (err) {
      console.error(
        "Unable to load loan history:",
        err
      );

      setLoans([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your loan history."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadLoans();
  }, []);

  const stats = useMemo(() => {
    const total = loans.length;

    const active = loans.filter(
      (loan) =>
        loan.status === "Active" ||
        loan.status === "Approved"
    ).length;

    const completed = loans.filter(
      (loan) => loan.status === "Completed"
    ).length;

    const totalBorrowed = loans.reduce(
      (sum, loan) =>
        sum +
        Number(
          loan.approved_amount ??
            loan.requested_amount ??
            0
        ),
      0
    );

    return {
      total,
      active,
      completed,
      totalBorrowed,
    };
  }, [loans]);

  return (
    <main className="min-h-screen bg-slate-50 pb-28 text-[#03162F]">
      <CustomerNavigation />

      {/* HEADER */}
      <section className="overflow-hidden bg-[#03162F] text-white">
        <div className="mx-auto max-w-4xl px-4 pb-7 pt-5 sm:px-6 sm:pb-9">
          <Link
            href="/customer/businesses/soft-loans"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 transition hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Soft Loans
          </Link>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]">
              <History className="h-6 w-6" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
                Alessandro Soft Loans
              </p>

              <h1 className="mt-0.5 text-2xl font-black sm:text-3xl">
                Loan History
              </h1>

              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                View all your loan applications and repayments.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pt-5 sm:px-6">
        {/* STATS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <FileText className="h-5 w-5 text-[#D4AF37]" />

            <p className="mt-3 text-2xl font-black">
              {stats.total}
            </p>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Applications
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <WalletCards className="h-5 w-5 text-blue-600" />

            <p className="mt-3 text-2xl font-black">
              {stats.active}
            </p>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Active Loans
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Banknote className="h-5 w-5 text-emerald-600" />

            <p className="mt-3 text-lg font-black">
              {formatZMW(stats.totalBorrowed)}
            </p>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Total Approved
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Clock3 className="h-5 w-5 text-purple-600" />

            <p className="mt-3 text-2xl font-black">
              {stats.completed}
            </p>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Completed
            </p>
          </div>
        </div>

        {/* TITLE + REFRESH */}
        <div className="mt-7 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Your Applications
            </p>

            <h2 className="mt-1 text-xl font-black">
              All Loans
            </h2>
          </div>

          <button
            type="button"
            onClick={() => loadLoans(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#03162F] shadow-sm transition hover:border-[#D4AF37] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          loans.length === 0 && (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#03162F]/5">
                <History className="h-7 w-7 text-[#03162F]/40" />
              </div>

              <h3 className="mt-4 text-lg font-black">
                No loan history yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">
                Once you submit a loan application, it
                will appear here.
              </p>

              <Link
                href="/customer/businesses/soft-loans/apply"
                className="mt-5 inline-flex rounded-xl bg-[#D4AF37] px-5 py-3 text-xs font-black text-[#03162F] transition hover:bg-[#c9a532]"
              >
                Apply For A Loan
              </Link>
            </div>
          )}

        {/* LOANS */}
        {!loading && loans.length > 0 && (
          <div className="mt-5 space-y-3">
            {loans.map((loan) => {
              const productName =
                loan.loan_products?.name ??
                loan.loan_type ??
                "Loan";

              const amount =
                loan.approved_amount ??
                loan.requested_amount;

              return (
                <button
                  key={loan.id}
                  type="button"
                  onClick={() => setSelectedLoan(loan)}
                  className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4AF37]/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]">
                        <Banknote className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-black">
                          {productName}
                        </h3>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {loan.application_number ??
                            "Loan Application"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClasses(
                        loan.status
                      )}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusDot(
                          loan.status
                        )}`}
                      />

                      {loan.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-4">
                    <div>
                      <p className="text-[10px] text-slate-400">
                        Amount
                      </p>

                      <p className="mt-0.5 text-sm font-black">
                        {formatZMW(amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">
                        Applied
                      </p>

                      <p className="mt-0.5 text-xs font-bold text-slate-700">
                        {formatDate(
                          loan.application_date
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">
                        Paid
                      </p>

                      <p className="mt-0.5 text-xs font-bold text-emerald-600">
                        {formatZMW(loan.amount_paid)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">
                        Outstanding
                      </p>

                      <p className="mt-0.5 text-xs font-black text-[#03162F]">
                        {formatZMW(
                          loan.outstanding_balance
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end text-[11px] font-bold text-slate-400 transition group-hover:text-[#03162F]">
                    View Details
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* DETAILS MODAL */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#03162F]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Loan Details
                </p>

                <h2 className="mt-1 text-xl font-black text-[#03162F]">
                  {selectedLoan.loan_products?.name ??
                    selectedLoan.loan_type}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedLoan.application_number ??
                    "Loan Application"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLoan(null)}
                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-[#03162F] p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Loan Amount
              </p>

              <p className="mt-1 text-3xl font-black">
                {formatZMW(
                  selectedLoan.approved_amount ??
                    selectedLoan.requested_amount
                )}
              </p>

              <div className="mt-4">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${statusClasses(
                    selectedLoan.status
                  )}`}
                >
                  {selectedLoan.status}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400">
                  Requested
                </p>

                <p className="mt-1 text-sm font-black">
                  {formatZMW(
                    selectedLoan.requested_amount
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400">
                  Approved
                </p>

                <p className="mt-1 text-sm font-black">
                  {formatZMW(
                    selectedLoan.approved_amount
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400">
                  Interest
                </p>

                <p className="mt-1 text-sm font-black">
                  {selectedLoan.interest_rate != null
                    ? `${selectedLoan.interest_rate}%`
                    : "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400">
                  Repayment Period
                </p>

                <p className="mt-1 text-sm font-black">
                  {selectedLoan.repayment_period != null
                    ? `${selectedLoan.repayment_period} days`
                    : "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400">
                  Total Payable
                </p>

                <p className="mt-1 text-sm font-black">
                  {formatZMW(
                    selectedLoan.total_payable
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400">
                  Installment
                </p>

                <p className="mt-1 text-sm font-black">
                  {formatZMW(
                    selectedLoan.monthly_installment
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400">
                  Amount Paid
                </p>

                <p className="mt-1 text-sm font-black text-emerald-600">
                  {formatZMW(
                    selectedLoan.amount_paid
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] text-slate-400">
                  Outstanding
                </p>

                <p className="mt-1 text-sm font-black">
                  {formatZMW(
                    selectedLoan.outstanding_balance
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-[#D4AF37]" />

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Application Date
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    {formatDate(
                      selectedLoan.application_date
                    )}
                  </p>
                </div>
              </div>

              {selectedLoan.due_date && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5 text-[#D4AF37]" />

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Due Date
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {formatDate(
                          selectedLoan.due_date
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}