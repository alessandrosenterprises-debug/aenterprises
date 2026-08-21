"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import EmployeeLoanModal from "./EmployeeLoanModal";

import {
  approveEmployeeLoan,
  deleteEmployeeLoan,
  rejectEmployeeLoan,
} from "../services/employee-loans.client";

import { AEConfirmDialog } from "@/components/enterprise/confirm-dialog";

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
}

interface LoanProduct {
  id: string;
  name: string;
  description?: string | null;
  min_amount?: number | null;
  max_amount?: number | null;
  interest_rate?: number | null;
  repayment_period?: number | null;
  requires_collateral?: boolean;
  status?: string;
}

interface EmployeeLoan {
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

interface EmployeeLoansTableProps {
  loans: EmployeeLoan[];
  employees: Employee[];
  loanProducts: LoanProduct[];
}

export default function EmployeeLoansTable({
  loans,
  employees,
  loanProducts,
}: EmployeeLoansTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [selectedLoan, setSelectedLoan] =
    useState<EmployeeLoan | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [approveOpen, setApproveOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [rejectOpen, setRejectOpen] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [processing, setProcessing] =
    useState(false);

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredLoans = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return loans;
    }

    return loans.filter((loan) => {
      return (
        loan.employees?.full_name
          ?.toLowerCase()
          .includes(query) ||

        loan.employees?.position
          ?.toLowerCase()
          .includes(query) ||

        loan.loan_type
          ?.toLowerCase()
          .includes(query) ||

        loan.loan_products?.name
          ?.toLowerCase()
          .includes(query) ||

        loan.status
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [loans, search]);

  /* ==========================================================
     COUNTS
  ========================================================== */

  const pendingCount = loans.filter(
    (loan) => loan.status === "Pending"
  ).length;

  const approvedCount = loans.filter(
    (loan) =>
      loan.status === "Approved" ||
      loan.status === "Active"
  ).length;

  const rejectedCount = loans.filter(
    (loan) => loan.status === "Rejected"
  ).length;

  const completedCount = loans.filter(
    (loan) => loan.status === "Completed"
  ).length;

  /* ==========================================================
     HELPERS
  ========================================================== */

  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-ZM", {
      style: "currency",
      currency: "ZMW",
      minimumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(
    date: string | null
  ) {
    if (!date) {
      return "—";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-ZM", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

      default:
        return "bg-amber-100 text-amber-700";
    }
  }

  function closeAll() {
    setDetailsOpen(false);
    setEditOpen(false);
    setApproveOpen(false);
    setDeleteOpen(false);
    setRejectOpen(false);
    setSelectedLoan(null);
    setRejectionReason("");
  }

  /* ==========================================================
     APPROVE
  ========================================================== */

  async function handleApprove() {
    if (!selectedLoan) {
      return;
    }

    try {
      setProcessing(true);

      await approveEmployeeLoan(
        selectedLoan.id
      );

      toast.success(
        "Loan approved successfully."
      );

      closeAll();
      router.refresh();
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

  /* ==========================================================
     REJECT
  ========================================================== */

  async function handleReject() {
    if (!selectedLoan) {
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error(
        "Please enter a rejection reason."
      );

      return;
    }

    try {
      setProcessing(true);

      await rejectEmployeeLoan(
        selectedLoan.id,
        rejectionReason.trim()
      );

      toast.success(
        "Loan application rejected."
      );

      closeAll();
      router.refresh();
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

  /* ==========================================================
     DELETE
  ========================================================== */

  async function handleDelete() {
    if (!selectedLoan) {
      return;
    }

    try {
      setProcessing(true);

      await deleteEmployeeLoan(
        selectedLoan.id
      );

      toast.success(
        "Loan deleted successfully."
      );

      closeAll();
      router.refresh();
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

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="border-b border-slate-200 p-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-xl font-bold text-[#03162F]">
                Employee Loans & Advances
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review, approve and manage employee
                loan and advance applications.
              </p>
            </div>

          </div>

          {/* ==================================================
              SUMMARY
          ================================================== */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-700">
                Pending
              </p>

              <p className="mt-1 text-2xl font-bold text-amber-800">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">
                Approved / Active
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-800">
                {approvedCount}
              </p>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                Rejected
              </p>

              <p className="mt-1 text-2xl font-bold text-red-800">
                {rejectedCount}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-700">
                Completed
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-800">
                {completedCount}
              </p>
            </div>

          </div>

          {/* ==================================================
              SEARCH
          ================================================== */}

          <div className="relative mt-6">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search employee, loan type, product or status..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10"
            />

          </div>

        </div>

        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b border-slate-200 bg-slate-50">

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Employee
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Loan / Advance
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Principal
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Repayment
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Outstanding
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Applied
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
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    {search
                      ? "No matching loans or advances found."
                      : "No employee loans or advances have been created yet."}
                  </td>

                </tr>

              ) : (

                filteredLoans.map(
                  (loan) => (

                    <tr
                      key={loan.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >

                      {/* EMPLOYEE */}

                      <td className="px-6 py-4">

                        <p className="font-semibold text-slate-900">
                          {loan.employees?.full_name ??
                            "Unknown Employee"}
                        </p>

                        {loan.employees?.position && (
                          <p className="mt-1 text-xs text-slate-500">
                            {loan.employees.position}
                          </p>
                        )}

                      </td>

                      {/* LOAN */}

                      <td className="px-6 py-4">

                        <p className="font-medium text-slate-800">
                          {loan.loan_type}
                        </p>

                        {loan.loan_products?.name && (
                          <p className="mt-1 text-xs text-slate-500">
                            {loan.loan_products.name}
                          </p>
                        )}

                      </td>

                      {/* PRINCIPAL */}

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {formatMoney(
                          Number(
                            loan.principal_amount
                          )
                        )}
                      </td>

                      {/* REPAYMENT */}

                      <td className="px-6 py-4 text-slate-600">

                        <p>
                          {loan.repayment_period}{" "}
                          {loan.repayment_period ===
                          1
                            ? "month"
                            : "months"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatMoney(
                            Number(
                              loan.monthly_installment
                            )
                          )}{" "}
                          / month
                        </p>

                      </td>

                      {/* OUTSTANDING */}

                      <td className="px-6 py-4 font-semibold text-purple-700">
                        {formatMoney(
                          Number(
                            loan.outstanding_balance
                          )
                        )}
                      </td>

                      {/* DATE */}

                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(
                          loan.application_date
                        )}
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

                        <div className="flex items-center justify-center gap-1">

                          {/* VIEW */}

                          <button
                            type="button"
                            title="View loan"
                            onClick={() => {
                              setSelectedLoan(
                                loan
                              );

                              setDetailsOpen(
                                true
                              );
                            }}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye size={18} />
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            title="Edit loan"
                            onClick={() => {
                              setSelectedLoan(
                                loan
                              );

                              setEditOpen(
                                true
                              );
                            }}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                          >
                            <Pencil size={18} />
                          </button>

                          {/* APPROVE */}

                          {loan.status ===
                            "Pending" && (
                            <button
                              type="button"
                              title="Approve loan"
                              onClick={() => {
                                setSelectedLoan(
                                  loan
                                );

                                setApproveOpen(
                                  true
                                );
                              }}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <Check
                                size={18}
                              />
                            </button>
                          )}

                          {/* REJECT */}

                          {loan.status ===
                            "Pending" && (
                            <button
                              type="button"
                              title="Reject loan"
                              onClick={() => {
                                setSelectedLoan(
                                  loan
                                );

                                setRejectOpen(
                                  true
                                );
                              }}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <X size={18} />
                            </button>
                          )}

                          {/* DELETE */}

                          <button
                            type="button"
                            title="Delete loan"
                            onClick={() => {
                              setSelectedLoan(
                                loan
                              );

                              setDeleteOpen(
                                true
                              );
                            }}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2
                              size={18}
                            />
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

      {/* ==========================================================
          DETAILS
      ========================================================== */}

      {detailsOpen &&
        selectedLoan && (
          <LoanDetails
            loan={selectedLoan}
            onClose={() => {
              setDetailsOpen(false);
              setSelectedLoan(null);
            }}
          />
        )}

      {/* ==========================================================
          EDIT MODAL
      ========================================================== */}

      <EmployeeLoanModal
        employees={employees}
        loanProducts={loanProducts}
        mode="edit"
        loan={
          selectedLoan ?? undefined
        }
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedLoan(null);
        }}
      />

      {/* ==========================================================
          APPROVE CONFIRMATION
      ========================================================== */}

      <AEConfirmDialog
        open={approveOpen}
        title="Approve Loan / Advance"
        message={`Are you sure you want to approve the loan / advance for "${
          selectedLoan?.employees
            ?.full_name ??
          "this employee"
        }"?`}
        loading={processing}
        onCancel={() => {
          setApproveOpen(false);
          setSelectedLoan(null);
        }}
        onConfirm={
          handleApprove
        }
      />

      {/* ==========================================================
          REJECT DIALOG
      ========================================================== */}

      {rejectOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-xl font-bold text-[#03162F]">
                Reject Loan / Advance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the reason why this
                application is being rejected.
              </p>

            </div>

            <div className="p-6">

              <textarea
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Rejection reason..."
                className="w-full resize-none rounded-xl border border-slate-300 p-4 text-sm text-slate-900 outline-none transition focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10"
              />

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setRejectOpen(
                      false
                    );

                    setSelectedLoan(
                      null
                    );

                    setRejectionReason(
                      ""
                    );
                  }}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={
                    handleReject
                  }
                  className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing
                    ? "Rejecting..."
                    : "Reject Loan"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ==========================================================
          DELETE CONFIRMATION
      ========================================================== */}

      <AEConfirmDialog
        open={deleteOpen}
        title="Delete Loan / Advance"
        message={`Are you sure you want to permanently delete the loan / advance for "${
          selectedLoan?.employees
            ?.full_name ??
          "this employee"
        }"? This action cannot be undone.`}
        loading={processing}
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedLoan(null);
        }}
        onConfirm={
          handleDelete
        }
      />

    </>
  );
}

/* ============================================================
   LOAN DETAILS
============================================================ */

function LoanDetails({
  loan,
  onClose,
}: {
  loan: EmployeeLoan;
  onClose: () => void;
}) {
  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-ZM", {
      style: "currency",
      currency: "ZMW",
      minimumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(
    date: string | null
  ) {
    if (!date) {
      return "—";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-ZM", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

          <div>
            <h2 className="text-xl font-bold text-[#03162F]">
              Loan / Advance Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complete application information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>

        </div>

        <div className="grid gap-6 p-6">

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

            <p className="text-sm text-slate-500">
              Employee
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {loan.employees?.full_name ??
                "Unknown Employee"}
            </p>

            {loan.employees?.position && (
              <p className="mt-1 text-sm text-slate-500">
                {loan.employees.position}
              </p>
            )}

          </div>

          <div className="grid gap-6 md:grid-cols-2">

            <Detail
              label="Loan Type"
              value={loan.loan_type}
            />

            <Detail
              label="Loan Product"
              value={
                loan.loan_products?.name ??
                "No product selected"
              }
            />

            <Detail
              label="Principal Amount"
              value={formatMoney(
                Number(
                  loan.principal_amount
                )
              )}
            />

            <Detail
              label="Interest Rate"
              value={`${Number(
                loan.interest_rate
              ).toFixed(2)}%`}
            />

            <Detail
              label="Total Payable"
              value={formatMoney(
                Number(
                  loan.total_payable
                )
              )}
            />

            <Detail
              label="Repayment Period"
              value={`${loan.repayment_period} ${
                loan.repayment_period ===
                1
                  ? "month"
                  : "months"
              }`}
            />

            <Detail
              label="Monthly Installment"
              value={formatMoney(
                Number(
                  loan.monthly_installment
                )
              )}
            />

            <Detail
              label="Amount Paid"
              value={formatMoney(
                Number(
                  loan.amount_paid
                )
              )}
            />

            <Detail
              label="Outstanding Balance"
              value={formatMoney(
                Number(
                  loan.outstanding_balance
                )
              )}
            />

            <Detail
              label="Status"
              value={loan.status}
            />

            <Detail
              label="Application Date"
              value={formatDate(
                loan.application_date
              )}
            />

            <Detail
              label="Start Date"
              value={formatDate(
                loan.start_date
              )}
            />

          </div>

          <Detail
            label="Notes"
            value={
              loan.notes ||
              "No notes provided."
            }
          />

          {loan.rejection_reason && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">

              <p className="text-sm font-semibold text-red-700">
                Rejection Reason
              </p>

              <p className="mt-1 text-sm text-red-800">
                {loan.rejection_reason}
              </p>

            </div>
          )}

          {loan.approved_at && (
            <Detail
              label="Approved At"
              value={new Date(
                loan.approved_at
              ).toLocaleString(
                "en-ZM"
              )}
            />
          )}

        </div>

        <div className="border-t border-slate-200 px-6 py-5">

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
  );
}

/* ============================================================
   DETAIL FIELD
============================================================ */

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