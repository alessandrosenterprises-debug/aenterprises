"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  CustomerLoanApplication,
} from "../types/customer-loan";

interface Props {
  loan: CustomerLoanApplication;
  onClose: () => void;
}

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface Approver {
  id: string;
  full_name: string | null;
  role: string | null;
}

interface DocumentCardProps {
  title: string;
  url: string | null;
  loading: boolean;
}

type RepaymentFrequency =
  | "Weekly"
  | "Bi-Weekly"
  | "Monthly";

/**
 * ============================================================
 * MONEY
 * ============================================================
 */

function money(value: number | null) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

/**
 * ============================================================
 * DATE
 * ============================================================
 */

function date(value: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-ZM", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

/**
 * ============================================================
 * DATE + TIME
 * ============================================================
 */

function dateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-ZM", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

/**
 * ============================================================
 * LOAN PRODUCT NAME
 * ============================================================
 *
 * We deliberately read the relationship safely because Supabase
 * can sometimes infer nested relationship types incorrectly.
 */

function getLoanProductName(
  loan: CustomerLoanApplication
): string | null {
  const product = loan.loan_products as
    | {
        name?: string | null;
      }
    | null
    | undefined;

  const name = product?.name?.trim();

  return name || null;
}

/**
 * ============================================================
 * REPAYMENT FREQUENCY
 * ============================================================
 *
 * Priority:
 *
 * 1. Loan product name
 * 2. Loan type
 * 3. Repayment period
 *
 * This means a loan with 60 days can still correctly show
 * "Monthly" even when the product relationship is missing.
 */

function getRepaymentFrequency(
  productName: string | null | undefined,
  loanType: string | null | undefined,
  repaymentPeriod: number | null | undefined
): RepaymentFrequency | null {
  const source = `${productName ?? ""} ${loanType ?? ""}`
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

  /**
   * Product/type takes priority.
   */

  if (
    source.includes("bi weekly") ||
    source.includes("biweekly")
  ) {
    return "Bi-Weekly";
  }

  if (source.includes("weekly")) {
    return "Weekly";
  }

  if (source.includes("monthly")) {
    return "Monthly";
  }

  /**
   * Fall back to repayment period.
   */

  const period = Number(repaymentPeriod ?? 0);

  if (!Number.isFinite(period) || period <= 0) {
    return null;
  }

  if (period === 7) {
    return "Weekly";
  }

  if (period === 14) {
    return "Bi-Weekly";
  }

  /**
   * Any normal 1-month, 2-month, 3-month, etc.
   * period is treated as Monthly.
   */

  if (period >= 28) {
    return "Monthly";
  }

  return null;
}

/**
 * ============================================================
 * REPAYMENT PERIOD LABEL
 * ============================================================
 */

function formatPeriod(days: number | null) {
  if (!days || days <= 0) {
    return "Not set";
  }

  if (days === 7) {
    return "7 Days";
  }

  if (days === 14) {
    return "14 Days";
  }

  if (days >= 28 && days <= 31) {
    return "1 Month";
  }

  if (days >= 56 && days <= 62) {
    return "2 Months";
  }

  if (days >= 84 && days <= 93) {
    return "3 Months";
  }

  if (days >= 112 && days <= 124) {
    return "4 Months";
  }

  if (days >= 168 && days <= 186) {
    return "6 Months";
  }

  return `${days} Days`;
}

/**
 * ============================================================
 * INSTALLMENT COUNT
 * ============================================================
 */

function calculateInstallmentCount(
  days: number | null,
  frequency: RepaymentFrequency | null
) {
  if (!days || days <= 0 || !frequency) {
    return null;
  }

  switch (frequency) {
    case "Weekly":
      return Math.max(1, Math.ceil(days / 7));

    case "Bi-Weekly":
      return Math.max(1, Math.ceil(days / 14));

    case "Monthly":
      return Math.max(1, Math.ceil(days / 30));

    default:
      return null;
  }
}

/**
 * ============================================================
 * DETAIL
 * ============================================================
 */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

/**
 * ============================================================
 * DOCUMENT TYPE
 * ============================================================
 */

function isPdf(url: string) {
  return (
    url.toLowerCase().includes(".pdf") ||
    url.toLowerCase().includes("application/pdf")
  );
}

/**
 * ============================================================
 * DOCUMENT CARD
 * ============================================================
 */

function DocumentCard({
  title,
  url,
  loading,
}: DocumentCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="font-semibold text-slate-900">
          {title}
        </p>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Open
          </a>
        )}
      </div>

      <div className="flex min-h-[280px] items-center justify-center bg-slate-100 p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#03162F]" />

            <p className="text-sm text-slate-500">
              Loading document...
            </p>
          </div>
        ) : url ? (
          isPdf(url) ? (
            <div className="w-full">
              <iframe
                src={url}
                title={title}
                className="h-[360px] w-full rounded-xl border border-slate-200 bg-white"
              />

              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                Open PDF in new tab
              </a>
            </div>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <img
                src={url}
                alt={title}
                className="mx-auto max-h-[360px] w-full rounded-xl object-contain"
              />

              <p className="mt-3 text-center text-sm font-semibold text-blue-600 hover:text-blue-800">
                Open full document
              </p>
            </a>
          )
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-xl">
              📄
            </div>

            <p className="font-medium text-slate-500">
              Document not available
            </p>

            <p className="mt-1 text-xs text-slate-400">
              No document was attached to this application.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================
 * MAIN COMPONENT
 * ============================================================
 */

export default function CustomerLoanDetails({
  loan,
  onClose,
}: Props) {
  /**
   * ==========================================================
   * DOCUMENT STATE
   * ==========================================================
   */

  const [nrcFrontUrl, setNrcFrontUrl] =
    useState<string | null>(null);

  const [nrcBackUrl, setNrcBackUrl] =
    useState<string | null>(null);

  const [selfieUrl, setSelfieUrl] =
    useState<string | null>(null);

  const [
    documentsLoading,
    setDocumentsLoading,
  ] = useState(false);

  const [
    documentsError,
    setDocumentsError,
  ] = useState<string | null>(null);

  /**
   * ==========================================================
   * APPROVER STATE
   * ==========================================================
   */

  const [approver, setApprover] =
    useState<Approver | null>(null);

  const [
    approverLoading,
    setApproverLoading,
  ] = useState(false);

  /**
   * ==========================================================
   * LOAN PRODUCT
   * ==========================================================
   */

  const loanProductName = useMemo(() => {
    return getLoanProductName(loan);
  }, [loan]);

  /**
   * ==========================================================
   * REPAYMENT FREQUENCY
   * ==========================================================
   */

  const repaymentFrequency = useMemo(() => {
    return getRepaymentFrequency(
      loanProductName,
      loan.loan_type,
      loan.repayment_period
    );
  }, [
    loanProductName,
    loan.loan_type,
    loan.repayment_period,
  ]);

  /**
   * ==========================================================
   * DISPLAYED LOAN PRODUCT
   * ==========================================================
   *
   * If an actual product exists, display it.
   *
   * Otherwise:
   *
   * Weekly
   * Bi-Weekly
   * Monthly
   *
   * This prevents "Not specified" when the repayment period
   * clearly identifies the loan type.
   */

  const displayedLoanProduct = useMemo(() => {
    return (
      loanProductName ??
      repaymentFrequency ??
      "Not specified"
    );
  }, [
    loanProductName,
    repaymentFrequency,
  ]);

  /**
   * ==========================================================
   * REPAYMENT PERIOD
   * ==========================================================
   */

  const repaymentPeriodLabel = useMemo(() => {
    return formatPeriod(
      loan.repayment_period
    );
  }, [
    loan.repayment_period,
  ]);

  /**
   * ==========================================================
   * INSTALLMENT COUNT
   * ==========================================================
   */

  const installmentCount = useMemo(() => {
    return calculateInstallmentCount(
      loan.repayment_period,
      repaymentFrequency
    );
  }, [
    loan.repayment_period,
    repaymentFrequency,
  ]);

  /**
   * ==========================================================
   * FINANCIAL DISPLAY VALUES
   * ==========================================================
   */

  const principalAmount =
    loan.approved_amount !== null
      ? Number(loan.approved_amount)
      : Number(loan.requested_amount);

  const interestAmount = useMemo(() => {
    if (
      loan.interest_rate === null ||
      !Number.isFinite(
        Number(loan.interest_rate)
      )
    ) {
      return null;
    }

    return (
      principalAmount *
      (Number(loan.interest_rate) / 100)
    );
  }, [
    principalAmount,
    loan.interest_rate,
  ]);

  /**
   * ==========================================================
   * LOAD VERIFICATION DOCUMENTS
   * ==========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      if (
        !loan.nrc_front_path &&
        !loan.nrc_back_path &&
        !loan.selfie_path
      ) {
        setNrcFrontUrl(null);
        setNrcBackUrl(null);
        setSelfieUrl(null);
        return;
      }

      setDocumentsLoading(true);
      setDocumentsError(null);

      try {
        const response = await fetch(
          "/api/loans/verification-documents",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              nrcFrontPath:
                loan.nrc_front_path,

              nrcBackPath:
                loan.nrc_back_path,

              selfiePath:
                loan.selfie_path,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load verification documents."
          );
        }

        const result =
          await response.json();

        if (cancelled) {
          return;
        }

        setNrcFrontUrl(
          result.nrcFrontUrl ?? null
        );

        setNrcBackUrl(
          result.nrcBackUrl ?? null
        );

        setSelfieUrl(
          result.selfieUrl ?? null
        );
      } catch (error) {
        console.error(
          "Verification document loading error:",
          error
        );

        if (!cancelled) {
          setDocumentsError(
            "Unable to load verification documents."
          );

          setNrcFrontUrl(null);
          setNrcBackUrl(null);
          setSelfieUrl(null);
        }
      } finally {
        if (!cancelled) {
          setDocumentsLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [
    loan.nrc_front_path,
    loan.nrc_back_path,
    loan.selfie_path,
  ]);

  /**
   * ==========================================================
   * LOAD APPROVER
   * ==========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadApprover() {
      if (!loan.approved_by) {
        setApprover(null);
        setApproverLoading(false);
        return;
      }

      setApproverLoading(true);

      try {
        const response = await fetch(
          `/api/loans/approver/${loan.approved_by}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load loan approver."
          );
        }

        const result =
          await response.json();

        if (!cancelled) {
          setApprover(
            result.approver ?? null
          );
        }
      } catch (error) {
        console.error(
          "Loan approver loading error:",
          error
        );

        if (!cancelled) {
          setApprover(null);
        }
      } finally {
        if (!cancelled) {
          setApproverLoading(false);
        }
      }
    }

    void loadApprover();

    return () => {
      cancelled = true;
    };
  }, [loan.approved_by]);

  /**
   * ==========================================================
   * PRINT
   * ==========================================================
   */

  useEffect(() => {
    function handleAfterPrint() {
      document.body.classList.remove(
        "printing-loan-application"
      );
    }

    window.addEventListener(
      "afterprint",
      handleAfterPrint
    );

    return () => {
      window.removeEventListener(
        "afterprint",
        handleAfterPrint
      );

      document.body.classList.remove(
        "printing-loan-application"
      );
    };
  }, []);

  function handlePrint() {
    document.body.classList.add(
      "printing-loan-application"
    );

    window.print();
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <>
   <style jsx global>{`
  @media print {
    /* =========================================================
       SHOW ONLY THE LOAN APPLICATION
    ========================================================= */

    body * {
      visibility: hidden !important;
    }

    .loan-print-modal,
    .loan-print-modal * {
      visibility: visible !important;
    }

    /* =========================================================
       MAIN PRINT CONTAINER
    ========================================================= */

    .loan-print-modal {
      position: absolute !important;
      inset: 0 !important;
      display: block !important;
      width: 100% !important;
      height: auto !important;
      padding: 0 !important;
      margin: 0 !important;
      background: white !important;
      overflow: visible !important;
    }

    .loan-print-container {
      display: block !important;
      width: 100% !important;
      max-width: none !important;
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }

    .loan-print-content {
      display: block !important;
      width: 100% !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      padding: 8px 0 !important;
    }

    .loan-print-header {
      position: static !important;
      padding: 0 0 10px !important;
    }

    /* =========================================================
       HIDE BUTTONS
    ========================================================= */

    .print-button,
    .loan-close-button,
    .loan-print-footer {
      display: none !important;
    }

    /* =========================================================
       SECTION SPACING
    ========================================================= */

    .loan-print-content .space-y-8 > * + * {
      margin-top: 14px !important;
    }

    section {
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    /* =========================================================
       KEEP THE EXACT TWO-COLUMN ARRANGEMENT
       USED IN APPLICATION INFORMATION
    ========================================================= */

    .loan-print-content .grid.md\:grid-cols-2 {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      column-gap: 40px !important;
      row-gap: 16px !important;
    }

    /* =========================================================
       KEEP FOUR-COLUMN FINANCIAL / REPAYMENT ARRANGEMENT
    ========================================================= */

    .loan-print-content .grid.lg\:grid-cols-4 {
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      column-gap: 18px !important;
      row-gap: 14px !important;
    }

    /* =========================================================
       DETAIL ITEMS
    ========================================================= */

    section .grid > div {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /* =========================================================
       DOCUMENT PREVIEWS
    ========================================================= */

    .document-preview {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /* Do not force large document containers to stay on one page */
    .document-preview.md\:col-span-2 {
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    /* =========================================================
       REDUCE CARD PADDING
    ========================================================= */

    section.rounded-2xl,
    section.rounded-xl {
      padding: 12px !important;
    }

    /* =========================================================
       COMPACT TEXT SPACING
    ========================================================= */

    h3 {
      margin-bottom: 10px !important;
    }

    .mb-5 {
      margin-bottom: 12px !important;
    }

    .mb-4 {
      margin-bottom: 10px !important;
    }

    .mb-3 {
      margin-bottom: 8px !important;
    }

    .mt-6 {
      margin-top: 12px !important;
    }

    .mt-5 {
      margin-top: 10px !important;
    }

    .mt-4 {
      margin-top: 8px !important;
    }

    /* =========================================================
       REMOVE UNNECESSARY MINIMUM HEIGHTS
    ========================================================= */

    .min-h-\[280px\] {
      min-height: auto !important;
    }

    /* =========================================================
       DOCUMENTS SHOULD NOT CREATE HUGE EMPTY AREAS
    ========================================================= */

    iframe {
      max-height: 260px !important;
    }

    img {
      max-height: 260px !important;
    }

    /* =========================================================
       PAGE SETUP
    ========================================================= */

    @page {
      size: A4;
      margin: 8mm;
    }
  }
`}</style>
      <div
        className="loan-print-modal fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Loan Application Details"
      >
        <div className="loan-print-container flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="loan-print-header flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-[#03162F]">
                Loan Application Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Complete customer loan application
                information.
              </p>
            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={handlePrint}
                className="print-button inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A2852]"
              >
                <span aria-hidden="true">
                  🖨
                </span>

                Print Application
              </button>

              <button
                type="button"
                onClick={onClose}
                className="loan-close-button rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close"
              >
                ✕
              </button>

            </div>
          </div>

          {/* ==================================================
              CONTENT
          ================================================== */}

          <div className="loan-print-content overflow-y-auto p-6">

            <div className="space-y-8">

              {/* ==================================================
                  CUSTOMER
              ================================================== */}

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Customer
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {loan.customers?.full_name ??
                    "Unknown Customer"}
                </p>

                {loan.customers?.customer_code && (
                  <p className="mt-1 text-sm text-slate-500">
                    Customer Code:{" "}
                    {loan.customers.customer_code}
                  </p>
                )}

                <p className="mt-1 text-sm text-slate-500">
                  {loan.customers?.phone ??
                    "No phone number"}
                </p>

                {loan.customers?.email && (
                  <p className="mt-1 text-sm text-slate-500">
                    {loan.customers.email}
                  </p>
                )}
              </section>

              {/* ==================================================
                  APPLICATION INFORMATION
              ================================================== */}

              <section>
                <h3 className="mb-4 text-lg font-bold text-[#03162F]">
                  Application Information
                </h3>

                <div className="grid gap-6 md:grid-cols-2">

                  <Detail
                    label="Application Number"
                    value={
                      loan.application_number ??
                      "Not assigned"
                    }
                  />

                  <Detail
                    label="Application Source"
                    value={
                      loan.application_source ??
                      "Not specified"
                    }
                  />

                  <Detail
                    label="Loan Product"
                    value={displayedLoanProduct}
                  />

                  <Detail
                    label="Loan Type"
                    value={
                      loan.loan_type ??
                      "Not specified"
                    }
                  />

                  <Detail
                    label="Requested Amount"
                    value={money(
                      loan.requested_amount
                    )}
                  />

                  <Detail
                    label="Approved Amount"
                    value={
                      loan.approved_amount !== null
                        ? money(
                            loan.approved_amount
                          )
                        : "Not approved"
                    }
                  />

                  <Detail
                    label="Interest Rate"
                    value={
                      loan.interest_rate !== null
                        ? `${loan.interest_rate}%`
                        : "Not set"
                    }
                  />

                  <Detail
                    label="Repayment"
                    value={
                      repaymentPeriodLabel
                    }
                  />

                  <Detail
                    label="Application Date"
                    value={date(
                      loan.application_date
                    )}
                  />

                  <Detail
                    label="Due Date"
                    value={date(
                      loan.due_date
                    )}
                  />

                  <Detail
                    label="Status"
                    value={
                      loan.status ??
                      "Unknown"
                    }
                  />

                  <Detail
                    label="Collateral Required"
                    value={
                      loan.collateral_required
                        ? "Yes"
                        : "No"
                    }
                  />

                </div>
              </section>

              {/* ==================================================
                  FINANCIAL INFORMATION
              ================================================== */}

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-5 text-lg font-bold text-[#03162F]">
                  Financial Information
                </h3>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

                  <Detail
                    label="Principal"
                    value={money(
                      principalAmount
                    )}
                  />

                  <Detail
                    label="Interest"
                    value={
                      interestAmount !== null
                        ? money(
                            interestAmount
                          )
                        : "Not calculated"
                    }
                  />

                  <Detail
                    label="Total Payable"
                    value={
                      loan.total_payable !== null
                        ? money(
                            loan.total_payable
                          )
                        : "Not calculated"
                    }
                  />

                  <Detail
                    label="Amount Paid"
                    value={money(
                      loan.amount_paid
                    )}
                  />

                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">

                  <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
                    <p className="text-sm font-medium text-purple-700">
                      Outstanding Balance
                    </p>

                    <p className="mt-1 text-2xl font-bold text-purple-900">
                      {loan.outstanding_balance !==
                      null
                        ? money(
                            loan.outstanding_balance
                          )
                        : "Not calculated"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                    <p className="text-sm font-medium text-blue-700">
                      Total Repayment Period
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-950">
                      {loan.repayment_period
                        ? `${loan.repayment_period} days`
                        : "Not set"}
                    </p>
                  </div>

                </div>
              </section>

              {/* ==================================================
                  REPAYMENT SCHEDULE
              ================================================== */}

              <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="mb-4 text-lg font-bold text-blue-950">
                  Repayment Schedule
                </h3>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

                  <Detail
                    label="Repayment Frequency"
                    value={
                      repaymentFrequency ??
                      "Not specified"
                    }
                  />

                  <Detail
                    label="Repayment Period"
                    value={
                      loan.repayment_period
                        ? `${loan.repayment_period} days`
                        : "Not set"
                    }
                  />

                  <Detail
                    label="Number of Installments"
                    value={
                      installmentCount !== null
                        ? String(
                            installmentCount
                          )
                        : "Not calculated"
                    }
                  />

                  <Detail
                    label={
                      repaymentFrequency
                        ? `${repaymentFrequency} Installment`
                        : "Installment"
                    }
                    value={
                      loan.monthly_installment !==
                      null
                        ? money(
                            loan.monthly_installment
                          )
                        : "Not calculated"
                    }
                  />

                </div>
              </section>

              {/* ==================================================
                  COLLATERAL
              ================================================== */}

              {(loan.collateral_id ||
                loan.collateral_description ||
                loan.collateral_worth !== null) && (
                <section>
                  <h3 className="mb-4 text-lg font-bold text-[#03162F]">
                    Collateral
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">

                    <Detail
                      label="Collateral"
                      value={
                        loan.collateral_description ??
                        "Collateral selected"
                      }
                    />

                    <Detail
                      label="Estimated Worth"
                      value={
                        loan.collateral_worth !==
                        null
                          ? money(
                              loan.collateral_worth
                            )
                          : "Not provided"
                      }
                    />

                  </div>
                </section>
              )}

              {/* ==================================================
                  CUSTOMER VERIFICATION
              ================================================== */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-[#03162F]">
                    Customer Verification
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Review the identity documents
                    submitted with this loan
                    application.
                  </p>
                </div>

                {documentsError && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {documentsError}
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">

                  <div className="document-preview">
                    <DocumentCard
                      title="NRC Front"
                      url={nrcFrontUrl}
                      loading={
                        documentsLoading
                      }
                    />
                  </div>

                  <div className="document-preview">
                    <DocumentCard
                      title="NRC Back"
                      url={nrcBackUrl}
                      loading={
                        documentsLoading
                      }
                    />
                  </div>

                  <div className="document-preview md:col-span-2">
                    <DocumentCard
                      title="Customer Selfie"
                      url={selfieUrl}
                      loading={
                        documentsLoading
                      }
                    />
                  </div>

                </div>
              </section>

              {/* ==================================================
                  CUSTOMER DETAILS
              ================================================== */}

              {(loan.residential_address ||
                loan.next_of_kin_name ||
                loan.next_of_kin_phone) && (
                <section>
                  <h3 className="mb-4 text-lg font-bold text-[#03162F]">
                    Customer Details
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">

                    <Detail
                      label="Residential Address"
                      value={
                        loan.residential_address ??
                        "Not provided"
                      }
                    />

                    <Detail
                      label="Next of Kin"
                      value={
                        loan.next_of_kin_name ??
                        "Not provided"
                      }
                    />

                    <Detail
                      label="Relationship"
                      value={
                        loan.next_of_kin_relationship ??
                        "Not provided"
                      }
                    />

                    <Detail
                      label="Next of Kin Phone"
                      value={
                        loan.next_of_kin_phone ??
                        "Not provided"
                      }
                    />

                  </div>
                </section>
              )}

              {/* ==================================================
                  LOAN PURPOSE
              ================================================== */}

              {loan.loan_purpose && (
                <section>
                  <h3 className="mb-3 text-lg font-bold text-[#03162F]">
                    Loan Purpose
                  </h3>

                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-800">
                    {loan.loan_purpose}
                  </p>
                </section>
              )}

              {/* ==================================================
                  NOTES
              ================================================== */}

              {loan.notes && (
                <section>
                  <h3 className="mb-3 text-lg font-bold text-[#03162F]">
                    Notes
                  </h3>

                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-800">
                    {loan.notes}
                  </p>
                </section>
              )}

              {/* ==================================================
                  REJECTION
              ================================================== */}

              {loan.rejection_reason && (
                <section className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <p className="font-semibold text-red-700">
                    Rejection Reason
                  </p>

                  <p className="mt-1 text-sm text-red-800">
                    {loan.rejection_reason}
                  </p>
                </section>
              )}

              {/* ==================================================
                  APPROVAL
              ================================================== */}

              {loan.approved_at && (
                <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

                  <h3 className="mb-4 text-lg font-bold text-emerald-950">
                    Approval Information
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">

                    <div>
                      <p className="text-sm text-emerald-700">
                        Approved By
                      </p>

                      {approverLoading ? (
                        <p className="mt-1 font-semibold text-emerald-950">
                          Loading...
                        </p>
                      ) : approver ? (
                        <>
                          <p className="mt-1 font-semibold text-emerald-950">
                            {approver.full_name ??
                              "Unknown Approver"}
                          </p>

                          {approver.role && (
                            <p className="mt-1 text-sm capitalize text-emerald-700">
                              {approver.role.replace(
                                /_/g,
                                " "
                              )}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-1 font-semibold text-emerald-950">
                          Approval recorded
                        </p>
                      )}
                    </div>

                    <Detail
                      label="Approved At"
                      value={dateTime(
                        loan.approved_at
                      )}
                    />

                  </div>

                  {loan.approved_by && (
                    <p className="mt-4 text-xs text-emerald-700">
                      Approval recorded against
                      the authenticated staff
                      account.
                    </p>
                  )}

                </section>
              )}

            </div>
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="loan-print-footer flex shrink-0 justify-end border-t border-slate-200 px-6 py-5">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#03162F] px-6 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
            >
              Close
            </button>

          </div>

        </div>
      </div>
    </>
  );
}