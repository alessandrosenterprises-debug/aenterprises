"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SoftLoansLoanOverviewProps {
  slug: string;
}

interface LoanApplication {
  id: string;
  application_number: string | null;
  application_date: string;
  requested_amount: number;
  approved_amount: number | null;
  interest_rate: number | null;
  repayment_period: number | null;
  monthly_installment: number | null;
  total_payable: number | null;
  amount_paid: number;
  outstanding_balance: number | null;
  status:
    | "Pending"
    | "Under Review"
    | "Approved"
    | "Rejected"
    | "Active"
    | "Completed"
    | "Cancelled";
  rejection_reason: string | null;
  created_at: string;
}

function formatMoney(
  value: number | null | undefined,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `K${Number(value).toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-ZM", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(
  status: LoanApplication["status"],
) {
  switch (status) {
    case "Approved":
    case "Active":
    case "Completed":
      return "bg-emerald-50 text-emerald-700";

    case "Rejected":
    case "Cancelled":
      return "bg-red-50 text-red-700";

    case "Under Review":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

function statusIcon(
  status: LoanApplication["status"],
) {
  switch (status) {
    case "Approved":
    case "Active":
    case "Completed":
      return (
        <CheckCircle2 className="h-4 w-4" />
      );

    case "Rejected":
    case "Cancelled":
      return (
        <FileText className="h-4 w-4" />
      );

    case "Under Review":
      return (
        <Clock3 className="h-4 w-4" />
      );

    default:
      return (
        <Clock3 className="h-4 w-4" />
      );
  }
}

export default function SoftLoansLoanOverview({
  slug,
}: SoftLoansLoanOverviewProps) {
  const [loans, setLoans] = useState<
    LoanApplication[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadLoans() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/customer/loan-applications",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ??
              "Unable to load your loans.",
          );
        }

        if (!mounted) return;

        setLoans(
          Array.isArray(data?.applications)
            ? data.applications
            : [],
        );
      } catch (err) {
        if (!mounted) return;

        console.error(
          "Soft Loans overview error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your loans.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadLoans();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * The API already returns newest first.
   *
   * The latest application is what should appear
   * under "Your Loan".
   *
   * This intentionally includes Pending and
   * Under Review applications.
   */
  const latestLoan =
    loans.length > 0
      ? loans[0]
      : null;

  /*
   * Recent Loans should include all application
   * statuses, not only Active loans.
   */
  const recentLoans =
    loans.slice(0, 3);

  return (
    <>
      {/* ===================================================
          YOUR LOAN
      =================================================== */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Overview
            </p>

            <h2 className="mt-1 text-lg font-black text-[#03162F]">
              Your Loan
            </h2>
          </div>

          <WalletCards className="h-5 w-5 text-[#D4AF37]" />
        </div>

        {loading ? (
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="animate-pulse">
              <div className="h-3 w-32 rounded bg-slate-200" />

              <div className="mt-3 h-8 w-36 rounded bg-slate-200" />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="h-16 rounded-2xl bg-slate-100" />
                <div className="h-16 rounded-2xl bg-slate-100" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[26px] border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-bold text-red-700">
              Unable to load loan information
            </p>

            <p className="mt-1 text-xs text-red-600">
              {error}
            </p>
          </div>
        ) : latestLoan ? (
          <Link
            href={`/customer/businesses/${slug}/status`}
            className="block rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {latestLoan.application_number ||
                    "Loan Application"}
                </p>

                <p className="mt-2 text-2xl font-black text-[#03162F]">
                  {formatMoney(
                    latestLoan.approved_amount ??
                      latestLoan.requested_amount,
                  )}
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${statusClass(
                  latestLoan.status,
                )}`}
              >
                {statusIcon(
                  latestLoan.status,
                )}

                {latestLoan.status}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                  Outstanding
                </p>

                <p className="mt-1 text-sm font-black text-[#03162F]">
                  {formatMoney(
                    latestLoan.outstanding_balance,
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                  Total Payable
                </p>

                <p className="mt-1 text-sm font-black text-[#03162F]">
                  {formatMoney(
                    latestLoan.total_payable,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#03162F]">
              <span>
                View loan status
              </span>

              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ) : (
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]">
                <WalletCards className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-sm font-black text-[#03162F]">
                  No Loan Application
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  You currently have no loan
                  applications.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===================================================
          RECENT LOANS
      =================================================== */}
      <section>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Activity
            </p>

            <h2 className="mt-1 text-lg font-black text-[#03162F]">
              Recent Loans
            </h2>
          </div>

          <Link
            href={`/customer/businesses/${slug}/history`}
            className="text-[10px] font-bold text-[#03162F]"
          >
            View All
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {loading ? (
            <>
              <div className="h-20 animate-pulse rounded-2xl bg-white" />
              <div className="h-20 animate-pulse rounded-2xl bg-white" />
            </>
          ) : recentLoans.length > 0 ? (
            recentLoans.map((loan) => (
              <Link
                key={loan.id}
                href={`/customer/businesses/${slug}/status`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-[#03162F]">
                    {loan.application_number ||
                      "Loan Application"}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatDate(
                      loan.application_date,
                    )}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-black text-[#03162F]">
                    {formatMoney(
                      loan.approved_amount ??
                        loan.requested_amount,
                    )}
                  </p>

                  <span
                    className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                      loan.status,
                    )}`}
                  >
                    {loan.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <History className="mx-auto h-7 w-7 text-slate-300" />

              <p className="mt-3 text-sm font-bold text-[#03162F]">
                No loan history yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Your loan applications will
                appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}