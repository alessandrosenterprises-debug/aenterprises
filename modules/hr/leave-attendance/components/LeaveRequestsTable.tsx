"use client";

import {
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Check,
  Eye,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { toast } from "sonner";

import {
  AEConfirmDialog,
} from "@/components/enterprise";

import LeaveRequestModal from "./LeaveRequestModal";

import {
  approveLeaveRequest,
  deleteLeaveRequest,
  rejectLeaveRequest,
} from "../services/leave-requests.client";

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
}

interface LeaveType {
  id: string;
  name: string;
  description?: string | null;
  default_days?: number | null;
  is_paid?: boolean;
  is_active?: boolean;
}

interface LeaveRequest {
  id: string;

  employee_id: string;
  leave_type_id: string;

  start_date: string;
  end_date: string;

  days: number;

  reason: string | null;

  status: string;

  approved_by?: string | null;
  approved_at?: string | null;

  rejection_reason?: string | null;

  notes: string | null;

  employees?: {
    full_name: string;
    position?: string | null;
  } | null;

  hr_leave_types?: {
    name: string;
    is_paid?: boolean;
  } | null;
}

interface LeaveRequestsTableProps {
  requests: LeaveRequest[];
  employees: Employee[];
  leaveTypes: LeaveType[];
}

export default function LeaveRequestsTable({
  requests,
  employees,
  leaveTypes,
}: LeaveRequestsTableProps) {
  const router = useRouter();

  const [search, setSearch] =
    useState("");

  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState<LeaveRequest | null>(
    null
  );

  const [editOpen, setEditOpen] =
    useState(false);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [approveOpen, setApproveOpen] =
    useState(false);

  const [rejectOpen, setRejectOpen] =
    useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [processing, setProcessing] =
    useState(false);

  /* ==========================================================
     SEARCH
  ========================================================== */

  const filteredRequests =
    useMemo(() => {
      if (!search.trim()) {
        return requests;
      }

      const query =
        search.toLowerCase();

      return requests.filter(
        (request) =>
          request.employees?.full_name
            ?.toLowerCase()
            .includes(query) ||

          request.employees?.position
            ?.toLowerCase()
            .includes(query) ||

          request.hr_leave_types?.name
            ?.toLowerCase()
            .includes(query) ||

          request.status
            ?.toLowerCase()
            .includes(query)
      );
    }, [requests, search]);

  /* ==========================================================
     COUNTS
  ========================================================== */

  const pendingCount =
    requests.filter(
      (request) =>
        request.status === "Pending"
    ).length;

  const approvedCount =
    requests.filter(
      (request) =>
        request.status === "Approved"
    ).length;

  const rejectedCount =
    requests.filter(
      (request) =>
        request.status === "Rejected"
    ).length;

  /* ==========================================================
     CLOSE ALL
  ========================================================== */

  function closeAllDialogs() {
    setDetailsOpen(false);
    setEditOpen(false);
    setDeleteOpen(false);
    setApproveOpen(false);
    setRejectOpen(false);

    setSelectedRequest(null);

    setRejectionReason("");
  }

  /* ==========================================================
     APPROVE
  ========================================================== */

  async function handleApprove() {
    if (!selectedRequest) {
      return;
    }

    try {
      setProcessing(true);

      await approveLeaveRequest(
        selectedRequest.id
      );

      toast.success(
        "Leave request approved successfully."
      );

      closeAllDialogs();

      router.refresh();
    } catch (error) {
      console.error(
        "Leave approval error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to approve leave request."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* ==========================================================
     REJECT
  ========================================================== */

  async function handleReject() {
    if (!selectedRequest) {
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

      await rejectLeaveRequest(
        selectedRequest.id,
        rejectionReason.trim()
      );

      toast.success(
        "Leave request rejected."
      );

      closeAllDialogs();

      router.refresh();
    } catch (error) {
      console.error(
        "Leave rejection error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reject leave request."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* ==========================================================
     DELETE
  ========================================================== */

  async function handleDelete() {
    if (!selectedRequest) {
      return;
    }

    try {
      setProcessing(true);

      await deleteLeaveRequest(
        selectedRequest.id
      );

      toast.success(
        "Leave request deleted successfully."
      );

      closeAllDialogs();

      router.refresh();
    } catch (error) {
      console.error(
        "Leave request delete error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete leave request."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* ==========================================================
     STATUS STYLE
  ========================================================== */

  function statusClass(
    status: string
  ) {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      case "Cancelled":
        return "bg-slate-100 text-slate-600";

      default:
        return "bg-amber-100 text-amber-700";
    }
  }

  /* ==========================================================
     DATE FORMAT
  ========================================================== */

  function formatDate(
    date: string
  ) {
    if (!date) {
      return "—";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
      "en-ZM",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

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
                Leave Requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review and manage employee
                leave requests.
              </p>
            </div>

            <LeaveRequestModal
              employees={employees}
              leaveTypes={leaveTypes}
            />
          </div>

          {/* ==================================================
              SUMMARY
          ================================================== */}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
                Approved
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
          </div>

          {/* ==================================================
              SEARCH
          ================================================== */}

          <div className="mt-6">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search employee, position, leave type or status..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10"
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
                  Leave Type
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Period
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Days
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
              {filteredRequests.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    {search
                      ? "No matching leave requests found."
                      : "No leave requests yet."}
                  </td>
                </tr>
              ) : (
                filteredRequests.map(
                  (request) => (
                    <tr
                      key={request.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      {/* EMPLOYEE */}

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {request
                            .employees
                            ?.full_name ??
                            "Unknown Employee"}
                        </p>

                        {request
                          .employees
                          ?.position && (
                          <p className="mt-1 text-xs text-slate-500">
                            {
                              request
                                .employees
                                .position
                            }
                          </p>
                        )}
                      </td>

                      {/* LEAVE TYPE */}

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">
                          {request
                            .hr_leave_types
                            ?.name ??
                            "Unknown Leave Type"}
                        </p>

                        {request
                          .hr_leave_types
                          ?.is_paid !==
                          undefined && (
                          <p className="mt-1 text-xs text-slate-500">
                            {request
                              .hr_leave_types
                              .is_paid
                              ? "Paid"
                              : "Unpaid"}
                          </p>
                        )}
                      </td>

                      {/* PERIOD */}

                      <td className="px-6 py-4 text-slate-600">
                        <div>
                          {formatDate(
                            request.start_date
                          )}
                        </div>

                        <div className="text-xs text-slate-400">
                          to{" "}
                          {formatDate(
                            request.end_date
                          )}
                        </div>
                      </td>

                      {/* DAYS */}

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {request.days}
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* VIEW */}

                          <button
                            type="button"
                            title="View"
                            onClick={() => {
                              setSelectedRequest(
                                request
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
                            title="Edit"
                            onClick={() => {
                              setSelectedRequest(
                                request
                              );

                              setEditOpen(
                                true
                              );
                            }}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                          >
                            <Pencil
                              size={18}
                            />
                          </button>

                          {/* APPROVE */}

                          {request.status ===
                            "Pending" && (
                            <button
                              type="button"
                              title="Approve"
                              onClick={() => {
                                setSelectedRequest(
                                  request
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

                          {request.status ===
                            "Pending" && (
                            <button
                              type="button"
                              title="Reject"
                              onClick={() => {
                                setSelectedRequest(
                                  request
                                );

                                setRejectOpen(
                                  true
                                );

                                setRejectionReason(
                                  ""
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
                            title="Delete"
                            onClick={() => {
                              setSelectedRequest(
                                request
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

      {/* ======================================================
          DETAILS
      ====================================================== */}

      {detailsOpen &&
        selectedRequest && (
          <LeaveRequestDetails
            request={selectedRequest}
            onClose={() => {
              setDetailsOpen(false);
              setSelectedRequest(
                null
              );
            }}
          />
        )}

      {/* ======================================================
          EDIT
      ====================================================== */}

      <LeaveRequestModal
        employees={employees}
        leaveTypes={leaveTypes}
        mode="edit"
        request={
          selectedRequest ?? undefined
        }
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedRequest(
            null
          );
        }}
      />

      {/* ======================================================
          APPROVE
      ====================================================== */}

      <AEConfirmDialog
        open={approveOpen}
        title="Approve Leave Request"
        message={`Are you sure you want to approve the leave request for "${
          selectedRequest?.employees
            ?.full_name ??
          "this employee"
        }"?`}
        loading={processing}
        confirmLabel="Approve"
        loadingLabel="Approving..."
        variant="success"
        onCancel={() => {
          if (processing) {
            return;
          }

          setApproveOpen(false);
          setSelectedRequest(
            null
          );
        }}
        onConfirm={
          handleApprove
        }
      />

      {/* ======================================================
          REJECT
      ====================================================== */}

      {rejectOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="rounded-t-2xl bg-[#03162F] px-6 py-5">
              <h2 className="text-xl font-bold text-white">
                Reject Leave Request
              </h2>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-500">
                Enter the reason why this
                leave request is being
                rejected.
              </p>

              <textarea
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(
                    event.target.value
                  )
                }
                rows={4}
                disabled={processing}
                placeholder="Rejection reason..."
                className="mt-5 w-full resize-none rounded-xl border border-slate-300 p-4 text-sm text-slate-900 outline-none transition focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10 disabled:bg-slate-100"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (processing) {
                      return;
                    }

                    setRejectOpen(
                      false
                    );

                    setSelectedRequest(
                      null
                    );

                    setRejectionReason(
                      ""
                    );
                  }}
                  disabled={processing}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    processing ||
                    !rejectionReason.trim()
                  }
                  onClick={
                    handleReject
                  }
                  className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing
                    ? "Rejecting..."
                    : "Reject Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          DELETE
      ====================================================== */}

      <AEConfirmDialog
        open={deleteOpen}
        title="Delete Leave Request"
        message={`Are you sure you want to delete the leave request for "${
          selectedRequest?.employees
            ?.full_name ??
          "this employee"
        }"? This action cannot be undone.`}
        loading={processing}
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        variant="danger"
        onCancel={() => {
          if (processing) {
            return;
          }

          setDeleteOpen(false);
          setSelectedRequest(
            null
          );
        }}
        onConfirm={
          handleDelete
        }
      />
    </>
  );
}

/* ============================================================
   DETAILS MODAL
============================================================ */

function LeaveRequestDetails({
  request,
  onClose,
}: {
  request: LeaveRequest;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#03162F]">
              Leave Request Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complete request information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-6 p-6">
          <Detail
            label="Employee"
            value={
              request.employees
                ?.full_name ??
              "Unknown Employee"
            }
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Detail
              label="Position"
              value={
                request.employees
                  ?.position ??
                "—"
              }
            />

            <Detail
              label="Leave Type"
              value={
                request.hr_leave_types
                  ?.name ??
                "Unknown Leave Type"
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Detail
              label="Start Date"
              value={formatDetailDate(
                request.start_date
              )}
            />

            <Detail
              label="End Date"
              value={formatDetailDate(
                request.end_date
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Detail
              label="Days"
              value={`${request.days}`}
            />

            <Detail
              label="Status"
              value={request.status}
            />
          </div>

          <Detail
            label="Reason"
            value={
              request.reason ||
              "No reason provided."
            }
          />

          <Detail
            label="Notes"
            value={
              request.notes ||
              "No notes provided."
            }
          />

          {request.rejection_reason && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                Rejection Reason
              </p>

              <p className="mt-1 text-sm text-red-800">
                {
                  request.rejection_reason
                }
              </p>
            </div>
          )}

          {request.approved_at && (
            <Detail
              label="Approved At"
              value={new Date(
                request.approved_at
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

/* ============================================================
   DETAIL DATE
============================================================ */

function formatDetailDate(
  date: string
) {
  if (!date) {
    return "—";
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    "en-ZM",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}