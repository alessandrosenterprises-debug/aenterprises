"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  approveCustomerLoanApplication,
  rejectCustomerLoanApplication,
  deleteCustomerLoanApplication,
} from "../services/customer-loans.client";
import { updateCustomerLoanAction } from "@/app/dashboard/loans/actions";

import type {
  CustomerLoanApplication,
} from "../types/customer-loan";

import CustomerLoanDetails from "./CustomerLoanDetails";

interface Props {
  loans: CustomerLoanApplication[];
  customers: { id: string; full_name: string; phone: string; email: string | null }[];
  collaterals: { id: string; name: string }[];
  operators: { id: string; name: string }[];
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
  customers,
  collaterals,
  operators,
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

  const [rejectionLoan, setRejectionLoan] =
    useState<CustomerLoanApplication | null>(null);

  const [rejectionReason, setRejectionReason] = useState("");

  const [approvedAmount, setApprovedAmount] =
    useState("");

  const [deleteLoan, setDeleteLoan] =
  useState<CustomerLoanApplication | null>(null);

  const [editingLoan, setEditingLoan] = useState<CustomerLoanApplication | null>(null);
  const [editValues, setEditValues] = useState({
    customer_id: "",
    loan_product_id: "",
    application_number: "",
    application_source: "Walk-in" as CustomerLoanApplication["application_source"],
    application_date: "",
    loan_type: "",
    requested_amount: "",
    approved_amount: "",
    interest_rate: "",
    repayment_period: "",
    loan_purpose: "",
    collateral_required: "false",
    collateral_description: "",
    collateral_id: "",
    collateral_worth: "",
    account_operator_id: "",
    due_date: "",
    residential_address: "",
    next_of_kin_name: "",
    next_of_kin_relationship: "",
    next_of_kin_phone: "",
    nrc_front_path: "",
    nrc_back_path: "",
    selfie_path: "",
    amount_paid: "",
    status: "Pending" as CustomerLoanApplication["status"],
    approved_by: "",
    approved_at: "",
    rejection_reason: "",
    notes: "",
  });

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

  function reject(loan: CustomerLoanApplication) {
    setRejectionReason("");
    setRejectionLoan(loan);
  }

  async function handleRejectLoan() {
    if (!rejectionLoan || !rejectionReason.trim()) {
      toast.error(
        "A rejection reason is required."
      );
      return;
    }

    try {
      setProcessing(true);

      await rejectCustomerLoanApplication(
        rejectionLoan.id,
        rejectionReason.trim()
      );

      toast.success(
        "Loan application rejected."
      );

      setRejectionLoan(null);
      setRejectionReason("");

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

  function remove(loan: CustomerLoanApplication) {
    setDeleteLoan(loan);
  }

  function edit(loan: CustomerLoanApplication) {
    setEditingLoan(loan);
    setEditValues({
      customer_id: loan.customer_id ?? "",
      loan_product_id: loan.loan_product_id ?? "",
      application_number: loan.application_number ?? "",
      application_source: loan.application_source,
      application_date: loan.application_date ?? "",
      loan_type: loan.loan_type ?? "",
      requested_amount: String(loan.requested_amount ?? ""),
      approved_amount: loan.approved_amount == null ? "" : String(loan.approved_amount),
      interest_rate: loan.interest_rate == null ? "" : String(loan.interest_rate),
      repayment_period: loan.repayment_period == null ? "" : String(loan.repayment_period),
      loan_purpose: loan.loan_purpose ?? "",
      collateral_required: String(loan.collateral_required),
      collateral_description: loan.collateral_description ?? "",
      collateral_id: loan.collateral_id ?? "",
      collateral_worth: loan.collateral_worth == null ? "" : String(loan.collateral_worth),
      account_operator_id: loan.account_operator_id ?? "",
      due_date: loan.due_date ?? "",
      residential_address: loan.residential_address ?? "",
      next_of_kin_name: loan.next_of_kin_name ?? "",
      next_of_kin_relationship: loan.next_of_kin_relationship ?? "",
      next_of_kin_phone: loan.next_of_kin_phone ?? "",
      nrc_front_path: loan.nrc_front_path ?? "",
      nrc_back_path: loan.nrc_back_path ?? "",
      selfie_path: loan.selfie_path ?? "",
      amount_paid: String(loan.amount_paid ?? 0),
      status: loan.status,
      approved_by: loan.approved_by ?? "",
      approved_at: loan.approved_at ?? "",
      rejection_reason: loan.rejection_reason ?? "",
      notes: loan.notes ?? "",
    });
  }

  async function handleUpdateLoan() {
    if (!editingLoan) return;

    const requestedAmount = Number(editValues.requested_amount);
    const amountPaid = Number(editValues.amount_paid);
    const approvedAmount = editValues.approved_amount.trim()
      ? Number(editValues.approved_amount)
      : null;
    const principal = approvedAmount ?? requestedAmount;
    const interestRate = editValues.interest_rate.trim()
      ? Number(editValues.interest_rate)
      : 0;
    const totalDue = principal + principal * (interestRate / 100);

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      toast.error("Requested amount must be greater than zero.");
      return;
    }

    if (!Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > totalDue) {
      toast.error("Repaid amount must be between zero and the total debt.");
      return;
    }

    if (approvedAmount !== null && (!Number.isFinite(approvedAmount) || approvedAmount <= 0)) {
      toast.error("Approved amount must be greater than zero, or left blank.");
      return;
    }

    if (!Number.isFinite(interestRate) || interestRate < 0) {
      toast.error("Interest rate cannot be negative.");
      return;
    }

    const repaymentPeriod = editValues.repayment_period.trim()
      ? Number(editValues.repayment_period)
      : null;
    if (repaymentPeriod !== null && (!Number.isFinite(repaymentPeriod) || repaymentPeriod <= 0)) {
      toast.error("Repayment period must be greater than zero.");
      return;
    }

    const collateralWorth = editValues.collateral_worth.trim()
      ? Number(editValues.collateral_worth)
      : null;
    if (collateralWorth !== null && (!Number.isFinite(collateralWorth) || collateralWorth < 0)) {
      toast.error("Collateral value cannot be negative.");
      return;
    }

    try {
      setProcessing(true);
      await updateCustomerLoanAction(editingLoan.id, {
        customer_id: editValues.customer_id,
        loan_product_id: editValues.loan_product_id || null,
        application_number: editValues.application_number || null,
        application_source: editValues.application_source,
        application_date: editValues.application_date,
        loan_type: editValues.loan_type,
        requested_amount: requestedAmount,
        approved_amount: approvedAmount,
        interest_rate: interestRate,
        repayment_period: repaymentPeriod,
        loan_purpose: editValues.loan_purpose,
        collateral_required: editValues.collateral_required === "true",
        collateral_description: editValues.collateral_description,
        collateral_id: editValues.collateral_id || null,
        collateral_worth: collateralWorth,
        account_operator_id: editValues.account_operator_id || null,
        due_date: editValues.due_date || null,
        residential_address: editValues.residential_address,
        next_of_kin_name: editValues.next_of_kin_name,
        next_of_kin_relationship: editValues.next_of_kin_relationship,
        next_of_kin_phone: editValues.next_of_kin_phone,
        nrc_front_path: editValues.nrc_front_path || null,
        nrc_back_path: editValues.nrc_back_path || null,
        selfie_path: editValues.selfie_path || null,
        amount_paid: amountPaid,
        status: editValues.status,
        approved_by: editValues.approved_by || null,
        approved_at: editValues.approved_at || null,
        rejection_reason: editValues.rejection_reason,
        notes: editValues.notes,
      });
      toast.success("Loan application updated successfully.");
      setEditingLoan(null);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update loan.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleDeleteLoan() {
    if (!deleteLoan) return;

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
      console.error("Loan deletion error:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to delete loan."
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

                        <select
                          aria-label={`Actions for loan ${loan.application_number ?? loan.id}`}
                          defaultValue=""
                          disabled={processing}
                          onChange={(event) => {
                            const action = event.currentTarget.value;
                            event.currentTarget.value = "";
                            if (action === "view") setSelectedLoan(loan);
                            else if (action === "edit") edit(loan);
                            else if (action === "approve") approve(loan);
                            else if (action === "reject") reject(loan);
                            else if (action === "delete") remove(loan);
                          }}
                          className="min-w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#03162F] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:opacity-50"
                        >
                          <option value="" disabled>Actions</option>
                          <option value="view">View</option>
                          {!(["Completed", "Rejected"].includes(loan.status)) && <option value="edit">Edit</option>}
                          {loan.status === "Pending" && <>
                            <option value="approve">Approve</option>
                            <option value="reject">Reject</option>
                          </>}
                          {!(["Completed", "Rejected"].includes(loan.status)) && <option value="delete">Delete</option>}
                        </select>

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

      {editingLoan && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !processing) setEditingLoan(null);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-bold text-[#03162F]">Edit Loan Application</h2>
              <p className="mt-1 text-sm text-slate-500">Update all saved application details for {editingLoan.customers?.full_name ?? "this customer"}.</p>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {([
                  ["Loan product ID", "loan_product_id", "text"],
                  ["Application number", "application_number", "text"],
                  ["Application date", "application_date", "date"],
                  ["Loan type", "loan_type", "text"],
                  ["Requested amount (ZMW)", "requested_amount", "number"],
                  ["Approved amount (ZMW)", "approved_amount", "number"],
                  ["Interest rate (%)", "interest_rate", "number"],
                  ["Repayment period (days)", "repayment_period", "number"],
                  ["Amount paid (ZMW)", "amount_paid", "number"],
                  ["Collateral value (ZMW)", "collateral_worth", "number"],
                  ["Due date", "due_date", "date"],
                  ["Approved by (user ID)", "approved_by", "text"],
                  ["Approved at", "approved_at", "text"],
                  ["Next of kin name", "next_of_kin_name", "text"],
                  ["Next of kin relationship", "next_of_kin_relationship", "text"],
                  ["Next of kin phone", "next_of_kin_phone", "text"],
                  ["NRC front document path", "nrc_front_path", "text"],
                  ["NRC back document path", "nrc_back_path", "text"],
                  ["Selfie document path", "selfie_path", "text"],
                ] as const).map(([label, key, type]) => (
                  <label key={key} className="space-y-2 text-sm font-medium text-slate-700">
                    {label}
                    <input
                      type={type}
                      min={type === "number" ? "0" : undefined}
                      step={type === "number" ? "0.01" : undefined}
                      value={editValues[key]}
                      onChange={(event) => setEditValues((current) => ({ ...current, [key]: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>
                ))}
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Customer
                  <select value={editValues.customer_id} onChange={(event) => setEditValues((current) => ({ ...current, customer_id: event.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
                    {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name} · {customer.phone}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Collateral
                  <select value={editValues.collateral_id} onChange={(event) => setEditValues((current) => ({ ...current, collateral_id: event.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
                    <option value="">No collateral selected</option>
                    {collaterals.map((collateral) => <option key={collateral.id} value={collateral.id}>{collateral.name}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Disbursement account
                  <select value={editValues.account_operator_id} onChange={(event) => setEditValues((current) => ({ ...current, account_operator_id: event.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
                    <option value="">No account selected</option>
                    {operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.name}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Application source
                  <select value={editValues.application_source} onChange={(event) => setEditValues((current) => ({ ...current, application_source: event.target.value as CustomerLoanApplication["application_source"] }))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
                    <option value="Customer App">Customer App</option><option value="Walk-in">Walk-in</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Status
                  <select value={editValues.status} onChange={(event) => setEditValues((current) => ({ ...current, status: event.target.value as CustomerLoanApplication["status"] }))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
                    <option>Pending</option><option>Under Review</option><option>Approved</option><option>Active</option><option>Rejected</option><option>Completed</option><option>Cancelled</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Collateral required
                  <select value={editValues.collateral_required} onChange={(event) => setEditValues((current) => ({ ...current, collateral_required: event.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
                    <option value="true">Yes</option><option value="false">No</option>
                  </select>
                </label>
                {([
                  ["Loan purpose", "loan_purpose"],
                  ["Collateral description", "collateral_description"],
                  ["Residential address", "residential_address"],
                  ["Rejection reason", "rejection_reason"],
                  ["Notes", "notes"],
                ] as const).map(([label, key]) => (
                  <label key={key} className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                    {label}
                    <textarea value={editValues[key]} onChange={(event) => setEditValues((current) => ({ ...current, [key]: event.target.value }))} rows={key === "notes" ? 3 : 2} className="w-full rounded-xl border border-slate-300 px-4 py-3" />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button type="button" disabled={processing} onClick={() => setEditingLoan(null)} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:opacity-50">Cancel</button>
              <button type="button" disabled={processing} onClick={handleUpdateLoan} className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white disabled:opacity-50">{processing ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
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

      {rejectionLoan && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !processing) {
              setRejectionLoan(null);
              setRejectionReason("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-loan-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">Loan application</p>
                <h2 id="reject-loan-title" className="mt-1 text-xl font-bold text-[#03162F]">Reject application</h2>
                <p className="mt-1 text-sm text-slate-500">Add a reason that can be shared with the customer.</p>
              </div>
              <button
                type="button"
                aria-label="Close rejection dialog"
                disabled={processing}
                onClick={() => { setRejectionLoan(null); setRejectionReason(""); }}
                className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >×</button>
            </header>
            <div className="space-y-4 p-6">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
                <p className="mt-1 font-semibold text-[#03162F]">{rejectionLoan.customers?.full_name ?? "Unknown Customer"}</p>
                <p className="mt-1 text-sm text-slate-600">Requested amount: {money(rejectionLoan.requested_amount)}</p>
              </div>
              <div>
                <label htmlFor="loan-rejection-reason" className="mb-2 block text-sm font-semibold text-slate-700">Rejection reason <span className="text-red-600">*</span></label>
                <textarea
                  id="loan-rejection-reason"
                  autoFocus
                  required
                  rows={4}
                  maxLength={1000}
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  disabled={processing}
                  placeholder="Explain why this application is being rejected..."
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10 disabled:bg-slate-100"
                />
              </div>
            </div>
            <footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                disabled={processing}
                onClick={() => { setRejectionLoan(null); setRejectionReason(""); }}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >Cancel</button>
              <button
                type="button"
                disabled={processing || !rejectionReason.trim()}
                onClick={handleRejectLoan}
                className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >{processing ? "Rejecting..." : "Reject application"}</button>
            </footer>
          </section>
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
