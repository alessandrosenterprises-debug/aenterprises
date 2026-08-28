"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  approveCustomerLoanApplication,
  rejectCustomerLoanApplication,
  deleteCustomerLoanApplication,
} from "../services/customer-loans.client";

import type {
  CustomerLoanApplication,
} from "../types/customer-loan";

import CustomerLoanDetails from "./CustomerLoanDetails";

interface Props {
  loans: CustomerLoanApplication[];
}

function money(value: number | null) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function statusClass(status: string) {
  switch (status) {
    case "Approved":
    case "Active":
      return "bg-emerald-100 text-emerald-700";

    case "Rejected":
      return "bg-red-100 text-red-700";

    case "Completed":
      return "bg-blue-100 text-blue-700";

    case "Cancelled":
      return "bg-slate-100 text-slate-600";

    case "Under Review":
      return "bg-purple-100 text-purple-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default function CustomerLoansTable({
  loans,
}: Props) {
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [selectedLoan, setSelectedLoan] =
    useState<CustomerLoanApplication | null>(null);

  /*
   * ==========================================================
   * APPROVAL MODAL
   * ==========================================================
   */

  const [approvalLoan, setApprovalLoan] =
    useState<CustomerLoanApplication | null>(null);

  const [approvedAmount, setApprovedAmount] =
    useState("");

    const [deleteLoan, setDeleteLoan] =
  useState<CustomerLoanApplication | null>(null);

  const [processing, setProcessing] =
    useState(false);

  /*
   * ==========================================================
   * FILTER LOANS
   * ==========================================================
   */

  const filteredLoans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return loans.filter((loan) => {
      const matchesSearch =
        !query ||
        loan.customers?.full_name
          ?.toLowerCase()
          .includes(query) ||
        loan.customers?.phone
          ?.toLowerCase()
          .includes(query) ||
        loan.application_number
          ?.toLowerCase()
          .includes(query) ||
        loan.loan_type
          ?.toLowerCase()
          .includes(query) ||
        loan.loan_products?.name
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        loan.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    loans,
    search,
    statusFilter,
  ]);

  /*
   * ==========================================================
   * OPEN APPROVAL MODAL
   * ==========================================================
   */

  function approve(
    loan: CustomerLoanApplication
  ) {
    setApprovalLoan(loan);

    setApprovedAmount(
      String(
        loan.requested_amount ?? ""
      )
    );
  }

  /*
   * ==========================================================
   * APPROVE LOAN
   * ==========================================================
   */

  async function handleApproveLoan() {
    if (!approvalLoan) {
      return;
    }

    const amount = Number(
      approvedAmount
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error(
        "Enter a valid approved amount."
      );

      return;
    }

    try {
      setProcessing(true);

      await approveCustomerLoanApplication(
        approvalLoan.id,
        amount
      );

      toast.success(
        "Loan approved successfully."
      );

      setApprovalLoan(null);
      setApprovedAmount("");

      /*
       * Refresh the page so the table,
       * balances and status show the
       * newly approved loan.
       */
      window.location.reload();
    } catch (error) {
      console.error(
        "Loan approval error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to approve loan."
      );
    } finally {
      setProcessing(false);
    }
  }

  /*
   * ==========================================================
   * REJECT LOAN
   * ==========================================================
   */

  async function reject(
    loan: CustomerLoanApplication
  ) {
    const reason = window.prompt(
      "Enter rejection reason:"
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      toast.error(
        "A rejection reason is required."
      );

      return;
    }

    try {
      setProcessing(true);

      await rejectCustomerLoanApplication(
        loan.id,
        reason
      );

      toast.success(
        "Loan application rejected."
      );

      window.location.reload();
    } catch (error) {
      console.error(
        "Loan rejection error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reject loan."
      );
    } finally {
      setProcessing(false);
    }
  }

  /*
   * ==========================================================
   * DELETE LOAN
   * ==========================================================
   */

 function remove(
  loan: CustomerLoanApplication
) {
  setDeleteLoan(loan);
}

async function handleDeleteLoan() {
  if (!deleteLoan) {
    return;
  }

  try {
    setProcessing(true);

    await deleteCustomerLoanApplication(
      deleteLoan.id
    );

    toast.success(
      "Loan application deleted."
    );

    setDeleteLoan(null);

    window.location.reload();
  } catch (error) {
    console.error(
      "Loan deletion error:",
      error
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to delete loan."
    );
  } finally {
    setProcessing(false);
  }
}

  /*
   * ==========================================================
   * CLOSE APPROVAL MODAL
   * ==========================================================
   */

  function closeApprovalModal() {
    if (processing) {
      return;
    }

    setApprovalLoan(null);
    setApprovedAmount("");
  }

  /*
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ====================================================
            SEARCH / FILTER
            ==================================================== */}

        <div className="border-b border-slate-200 p-6">

          <div className="flex flex-col gap-4 lg:flex-row">

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search customer, loan type or product..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            >
              <option value="All">
                All Statuses
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Under Review">
                Under Review
              </option>

              <option value="Approved">
                Approved
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Rejected">
                Rejected
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>

          </div>

        </div>

        {/* ====================================================
            TABLE
            ==================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Customer
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Loan
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Requested
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Outstanding
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Source
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Status
                </th>

                <th className="px-6 py-4 text-center font-semibold text-slate-700">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {filteredLoans.length === 0 ? (
                <tr>

                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    {search
                      ? "No matching loan applications found."
                      : "No customer loan applications yet."}
                  </td>

                </tr>
              ) : (
                filteredLoans.map(
                  (loan) => (
                    <tr
                      key={loan.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >

                      {/* CUSTOMER */}

                      <td className="px-6 py-4">

                        <p className="font-semibold text-slate-900">
                          {loan.customers?.full_name ??
                            "Unknown Customer"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {loan.customers?.phone}
                        </p>

                      </td>

                      {/* LOAN */}

                      <td className="px-6 py-4">

                        <p className="font-medium text-slate-800">
                          {loan.loan_type}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {loan.loan_products?.name ??
                            "No product"}
                        </p>

                      </td>

                      {/* REQUESTED */}

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {money(
                          loan.requested_amount
                        )}
                      </td>

                      {/* OUTSTANDING */}

                      <td className="px-6 py-4 font-semibold text-purple-700">
                        {money(
                          loan.outstanding_balance
                        )}
                      </td>

                      {/* SOURCE */}

                      <td className="px-6 py-4 text-slate-600">
                        {loan.application_source}
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            loan.status
                          )}`}
                        >
                          {loan.status}
                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-4">

                        <div className="flex items-center justify-center gap-2">

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedLoan(
                                loan
                              )
                            }
                            className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            View
                          </button>

                          {/* APPROVE / REJECT */}

                          {loan.status ===
                            "Pending" && (
                            <>
                              <button
                                type="button"
                                disabled={
                                  processing
                                }
                                onClick={() =>
                                  approve(
                                    loan
                                  )
                                }
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                disabled={
                                  processing
                                }
                                onClick={() =>
                                  reject(
                                    loan
                                  )
                                }
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* DELETE */}

                          <button
                            type="button"
                            disabled={
                              processing
                            }
                            onClick={() =>
                              remove(
                                loan
                              )
                            }
                            className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ======================================================
          LOAN DETAILS
          ====================================================== */}

      {selectedLoan && (
        <CustomerLoanDetails
          loan={selectedLoan}
          onClose={() =>
            setSelectedLoan(null)
          }
        />
      )}

      {/* ======================================================
          APPROVE LOAN MODAL
          ====================================================== */}

      {approvalLoan && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeApprovalModal();
            }
          }}
        >

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="border-b border-slate-200 px-6 py-5">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <h2 className="text-xl font-bold text-[#03162F]">
                    Approve Customer Loan
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the approved amount for this loan.
                  </p>

                </div>

                <button
                  type="button"
                  disabled={processing}
                  onClick={
                    closeApprovalModal
                  }
                  className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>

              </div>

            </div>

            {/* MODAL BODY */}

            <div className="space-y-5 p-6">

              {/* CUSTOMER */}

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </p>

                <p className="mt-1 font-semibold text-[#03162F]">
                  {approvalLoan.customers?.full_name ??
                    "Unknown Customer"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Requested amount:{" "}
                  <span className="font-semibold text-slate-700">
                    {money(
                      approvalLoan.requested_amount
                    )}
                  </span>
                </p>

              </div>

              {/* APPROVED AMOUNT */}

              <div>

                <label
                  htmlFor="approved-amount"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Approved Amount (ZMW)
                </label>

                <input
                  id="approved-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={approvedAmount}
                  onChange={(event) =>
                    setApprovedAmount(
                      event.target.value
                    )
                  }
                  disabled={processing}
                  placeholder="Enter approved amount"
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#03162F] outline-none transition focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10 disabled:bg-slate-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  You can approve the requested amount
                  or enter a different amount.
                </p>

              </div>

            </div>

            {/* MODAL ACTIONS */}

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">

              <button
                type="button"
                disabled={processing}
                onClick={
                  closeApprovalModal
                }
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={
                  handleApproveLoan
                }
                className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing
                  ? "Approving..."
                  : "Approve Loan"}
              </button>

            </div>

          </div>

        </div>
      )}
      {/* ======================================================
    DELETE LOAN MODAL
    ====================================================== */}

{deleteLoan && (
  <div
    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
    onMouseDown={(event) => {
      if (
        event.target === event.currentTarget &&
        !processing
      ) {
        setDeleteLoan(null);
      }
    }}
  >
    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

      {/* HEADER */}

      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-start justify-between gap-4">

          <div>
            <h2 className="text-xl font-bold text-[#03162F]">
              Delete Loan Application
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              This action cannot be undone.
            </p>
          </div>

          <button
            type="button"
            disabled={processing}
            onClick={() =>
              setDeleteLoan(null)
            }
            className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>

        </div>
      </div>

      {/* BODY */}

      <div className="space-y-4 p-6">

        <div className="rounded-xl border border-red-100 bg-red-50 p-4">

          <p className="text-sm font-semibold text-red-700">
            Are you sure you want to delete this
            loan application?
          </p>

          <p className="mt-2 text-sm text-red-800">
            Customer:
            {" "}
            <span className="font-bold">
              {deleteLoan.customers?.full_name ??
                "Unknown Customer"}
            </span>
          </p>

          <p className="mt-1 text-sm text-red-800">
            Requested amount:
            {" "}
            <span className="font-bold">
              {money(
                deleteLoan.requested_amount
              )}
            </span>
          </p>

        </div>

        <p className="text-sm text-slate-500">
          Deleting this application will permanently
          remove it from the customer loans list.
        </p>

      </div>

      {/* ACTIONS */}

      <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">

        <button
          type="button"
          disabled={processing}
          onClick={() =>
            setDeleteLoan(null)
          }
          className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={processing}
          onClick={
            handleDeleteLoan
          }
          className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing
            ? "Deleting..."
            : "Delete Loan"}
        </button>

      </div>

    </div>
  </div>
)}
    </>
  );
}