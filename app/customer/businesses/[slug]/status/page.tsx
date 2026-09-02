"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface LoanProduct {
  id: string;
  name: string;
  description: string | null;
  interest_rate: number | null;
  repayment_period: number | null;
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
  due_date: string | null;
  status: string;
  rejection_reason: string | null;
  loan_products: LoanProduct | null;
}

function formatMoney(value: number | null | undefined) {
  return `K${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

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

function getStatusIcon(status: string) {
  switch (status) {
    case "Approved":
    case "Active":
    case "Completed":
      return <CheckCircle2 className="h-5 w-5" />;

    case "Rejected":
    case "Cancelled":
      return <XCircle className="h-5 w-5" />;

    case "Under Review":
      return <FileText className="h-5 w-5" />;

    default:
      return <Clock3 className="h-5 w-5" />;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "Approved":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";

    case "Active":
      return "border-blue-400/30 bg-blue-500/10 text-blue-300";

    case "Completed":
      return "border-purple-400/30 bg-purple-500/10 text-purple-300";

    case "Rejected":
      return "border-red-400/30 bg-red-500/10 text-red-300";

    case "Cancelled":
      return "border-slate-400/30 bg-slate-500/10 text-slate-300";

    case "Under Review":
      return "border-blue-400/30 bg-blue-500/10 text-blue-300";

    default:
      return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  }
}

export default function CustomerLoanStatusPage({
  params,
}: PageProps) {
  const [slug, setSlug] = useState("");
  const [application, setApplication] =
    useState<LoanApplication | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadStatus() {
      try {
        setLoading(true);
        setError("");

        const resolvedParams = await params;

        if (!mounted) return;

        setSlug(resolvedParams.slug);

        /*
         * The browser already has the customer's
         * authenticated Supabase session.
         *
         * Calling the API from the browser allows
         * the session cookies to accompany the request.
         */
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
              "Unable to load your loan status.",
          );
        }

        const applications =
          Array.isArray(data?.applications)
            ? data.applications
            : [];

        if (!mounted) return;

        /*
         * The API returns newest applications first.
         * The first application is therefore the
         * customer's latest loan application.
         */
        setApplication(
          applications.length > 0
            ? applications[0]
            : null,
        );
      } catch (err) {
        if (!mounted) return;

        console.error(
          "Customer loan status error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your loan status.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStatus();

    return () => {
      mounted = false;
    };
  }, [params]);

  const backHref = slug
    ? `/customer/businesses/${slug}`
    : "/customer/businesses";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06152f] px-4 pb-28 pt-6 text-white">
        <div className="mx-auto w-full max-w-xl">
          <Link
            href={backHref}
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="animate-pulse space-y-5">
              <div className="h-5 w-40 rounded bg-white/10" />
              <div className="h-16 rounded-2xl bg-white/10" />
              <div className="h-24 rounded-2xl bg-white/10" />
              <div className="h-24 rounded-2xl bg-white/10" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#06152f] px-4 pb-28 pt-6 text-white">
        <div className="mx-auto w-full max-w-xl">
          <Link
            href={backHref}
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Soft Loans
          </Link>

          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6">
            <div className="mb-3 flex items-center gap-3 text-red-300">
              <AlertCircle className="h-5 w-5" />
              <h1 className="font-semibold">
                Unable to Load Loan Status
              </h1>
            </div>

            <p className="text-sm leading-6 text-slate-300">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06152f] px-4 pb-28 pt-5 text-white">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href={backHref}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Soft Loans
        </Link>

        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#d6b25e]">
            Alessandro Soft Loans
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            Loan Status
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Track your latest loan application.
          </p>
        </header>

        {!application ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
              <FileText className="h-6 w-6 text-[#d6b25e]" />
            </div>

            <h2 className="text-lg font-semibold">
              No Loan Application
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
              You have not submitted a loan application
              yet.
            </p>

            <Link
              href={`/customer/businesses/${slug}/apply`}
              className="mt-6 inline-flex rounded-xl bg-[#d6b25e] px-5 py-3 text-sm font-semibold text-[#06152f] transition hover:scale-[1.02]"
            >
              Apply For A Loan
            </Link>
          </section>
        ) : (
          <div className="space-y-4">
            <section className="rounded-3xl border border-[#d6b25e]/20 bg-gradient-to-br from-[#102958] to-[#081b3d] p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    Application Number
                  </p>

                  <p className="mt-1 break-all text-base font-bold text-white">
                    {application.application_number ??
                      "Not available"}
                  </p>
                </div>

                <div
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                    application.status,
                  )}`}
                >
                  {getStatusIcon(
                    application.status,
                  )}

                  <span>
                    {application.status}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black/15 p-4">
                  <p className="text-xs text-slate-400">
                    Requested
                  </p>

                  <p className="mt-1 text-lg font-bold text-white">
                    {formatMoney(
                      application.requested_amount,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-black/15 p-4">
                  <p className="text-xs text-slate-400">
                    Approved
                  </p>

                  <p className="mt-1 text-lg font-bold text-white">
                    {application.approved_amount !==
                    null
                      ? formatMoney(
                          application.approved_amount,
                        )
                      : "Pending"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="mb-4 text-base font-semibold">
                Loan Details
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">
                    Loan Service
                  </span>

                  <span className="text-right text-sm font-medium text-white">
                    {application.loan_products
                      ?.name ?? "Customer Loan"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">
                    Application Date
                  </span>

                  <span className="text-sm text-white">
                    {formatDate(
                      application.application_date,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">
                    Interest Rate
                  </span>

                  <span className="text-sm text-white">
                    {application.interest_rate !==
                    null
                      ? `${Number(
                          application.interest_rate,
                        )}%`
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">
                    Repayment Period
                  </span>

                  <span className="text-sm text-white">
                    {application.repayment_period !==
                    null
                      ? `${application.repayment_period} days`
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">
                    Due Date
                  </span>

                  <span className="text-sm text-white">
                    {formatDate(
                      application.due_date,
                    )}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="mb-4 text-base font-semibold">
                Payment Summary
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-xs text-slate-400">
                    Total Payable
                  </p>

                  <p className="mt-1 text-base font-bold">
                    {application.total_payable !==
                    null
                      ? formatMoney(
                          application.total_payable,
                        )
                      : "Pending"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-xs text-slate-400">
                    Amount Paid
                  </p>

                  <p className="mt-1 text-base font-bold">
                    {formatMoney(
                      application.amount_paid,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-xs text-slate-400">
                    Outstanding
                  </p>

                  <p className="mt-1 text-base font-bold">
                    {application.outstanding_balance !==
                    null
                      ? formatMoney(
                          application.outstanding_balance,
                        )
                      : "Pending"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-xs text-slate-400">
                    Installment
                  </p>

                  <p className="mt-1 text-base font-bold">
                    {application.monthly_installment !==
                    null
                      ? formatMoney(
                          application.monthly_installment,
                        )
                      : "Pending"}
                  </p>
                </div>
              </div>
            </section>

            {application.status === "Rejected" &&
              application.rejection_reason && (
                <section className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5">
                  <h2 className="text-base font-semibold text-red-300">
                    Application Decision
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {application.rejection_reason}
                  </p>
                </section>
              )}

            {application.status === "Pending" && (
              <section className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />

                  <div>
                    <h2 className="text-sm font-semibold text-amber-200">
                      Application Under Review
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Your application has been received
                      successfully and is awaiting review.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <Link
              href={`/customer/businesses/${slug}`}
              className="block rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Back to Soft Loans
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}