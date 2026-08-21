"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import Modal from "@/components/ui/modal/Modal";

import type { LeaveType } from "../services/leave-types.service";
import {
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "../services/leave-types.client";

import LeaveTypeModal from "./LeaveTypeModal";

interface LeaveTypesTableProps {
  leaveTypes: LeaveType[];
}

export default function LeaveTypesTable({
  leaveTypes,
}: LeaveTypesTableProps) {
  const router = useRouter();

  const [search, setSearch] =
    useState("");

  const [selectedLeaveType, setSelectedLeaveType] =
    useState<LeaveType | null>(null);

  const [viewOpen, setViewOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [createOpen, setCreateOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  /*
   * ============================================================
   * FILTER
   * ============================================================
   */

  const filteredLeaveTypes = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return leaveTypes;
    }

    return leaveTypes.filter(
      (leaveType) =>
        leaveType.name
          .toLowerCase()
          .includes(query) ||
        leaveType.description
          ?.toLowerCase()
          .includes(query)
    );
  }, [leaveTypes, search]);

  /*
   * ============================================================
   * DELETE
   * ============================================================
   */

  async function handleDelete() {
    if (!selectedLeaveType) {
      return;
    }

    try {
      setDeleting(true);

      await deleteLeaveType(
        selectedLeaveType.id
      );

      toast.success(
        "Leave type deleted successfully."
      );

      setDeleteOpen(false);
      setSelectedLeaveType(null);

      router.refresh();
    } catch (error) {
      console.error(
        "Leave type deletion error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete leave type."
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
   * ============================================================
   * REFRESH AFTER SAVE
   * ============================================================
   */

  function handleSaved() {
    router.refresh();
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#03162F]">
                Leave Types
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create and manage the types of leave
                available to employees.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedLeaveType(null);
                setCreateOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
            >
              <Plus size={18} />

              Add Leave Type
            </button>
          </div>
        </div>

        {/* =====================================================
            TOOLBAR
        ===================================================== */}

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search leave types..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>
        </div>

        {/* =====================================================
            TABLE
        ===================================================== */}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Leave Type
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Default Days
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Payment
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
              {filteredLeaveTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-14 text-center"
                  >
                    <div className="mx-auto max-w-md">
                      <p className="font-semibold text-slate-700">
                        {search
                          ? "No matching leave types found."
                          : "No leave types configured yet."}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {!search &&
                          "Create your first leave type to make it available when submitting leave requests."}
                      </p>

                      {!search && (
                        <button
                          type="button"
                          onClick={() =>
                            setCreateOpen(true)
                          }
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 font-semibold text-white transition hover:bg-[#0A2852]"
                        >
                          <Plus size={17} />

                          Add Leave Type
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeaveTypes.map(
                  (leaveType) => (
                    <tr
                      key={leaveType.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      {/* NAME */}

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {leaveType.name}
                          </p>

                          {leaveType.description && (
                            <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                              {
                                leaveType.description
                              }
                            </p>
                          )}
                        </div>
                      </td>

                      {/* DAYS */}

                      <td className="px-6 py-4 font-medium text-slate-700">
                        {leaveType.default_days}
                      </td>

                      {/* PAYMENT */}

                      <td className="px-6 py-4">
                        <span
                          className={
                            leaveType.is_paid
                              ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                              : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                          }
                        >
                          {leaveType.is_paid
                            ? "Paid"
                            : "Unpaid"}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">
                        <span
                          className={
                            leaveType.is_active
                              ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                              : "inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                          }
                        >
                          {leaveType.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          {/* VIEW */}

                          <button
                            type="button"
                            title="View"
                            onClick={() => {
                              setSelectedLeaveType(
                                leaveType
                              );

                              setViewOpen(true);
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
                              setSelectedLeaveType(
                                leaveType
                              );

                              setEditOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                          >
                            <Pencil size={18} />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            title="Delete"
                            onClick={() => {
                              setSelectedLeaveType(
                                leaveType
                              );

                              setDeleteOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={18} />
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

        {/* =====================================================
            FOOTER
        ===================================================== */}

        {leaveTypes.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredLeaveTypes.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {leaveTypes.length}
              </span>{" "}
              leave types
            </p>
          </div>
        )}
      </section>

      {/* =====================================================
          CREATE
      ===================================================== */}

      <LeaveTypeModal
        open={createOpen}
        mode="create"
        onClose={() => {
          setCreateOpen(false);
        }}
        onSaved={handleSaved}
      />

      {/* =====================================================
          EDIT
      ===================================================== */}

      <LeaveTypeModal
        open={editOpen}
        mode="edit"
        leaveType={selectedLeaveType}
        onClose={() => {
          setEditOpen(false);
          setSelectedLeaveType(null);
        }}
        onSaved={handleSaved}
      />

      {/* =====================================================
          VIEW
      ===================================================== */}

      <Modal
        open={viewOpen}
        title="Leave Type Details"
        onClose={() => {
          setViewOpen(false);
          setSelectedLeaveType(null);
        }}
      >
        {selectedLeaveType && (
          <div className="space-y-6">
            {/* NAME */}

            <div>
              <p className="text-sm text-slate-500">
                Leave Type
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {selectedLeaveType.name}
              </p>
            </div>

            {/* DESCRIPTION */}

            <div>
              <p className="text-sm text-slate-500">
                Description
              </p>

              <p className="mt-1 text-slate-700">
                {selectedLeaveType.description ||
                  "No description provided."}
              </p>
            </div>

            {/* DETAILS */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Default Days
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {
                    selectedLeaveType.default_days
                  }
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Payment
                </p>

                <p
                  className={
                    selectedLeaveType.is_paid
                      ? "mt-1 font-bold text-emerald-600"
                      : "mt-1 font-bold text-slate-600"
                  }
                >
                  {selectedLeaveType.is_paid
                    ? "Paid Leave"
                    : "Unpaid Leave"}
                </p>
              </div>
            </div>

            {/* STATUS */}

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">
                Status
              </p>

              <p
                className={
                  selectedLeaveType.is_active
                    ? "mt-1 font-bold text-emerald-600"
                    : "mt-1 font-bold text-red-600"
                }
              >
                {selectedLeaveType.is_active
                  ? "Active"
                  : "Inactive"}
              </p>
            </div>

            {/* CLOSE */}

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => {
                  setViewOpen(false);
                  setSelectedLeaveType(null);
                }}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      <Modal
        open={deleteOpen}
        title="Delete Leave Type"
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false);
            setSelectedLeaveType(null);
          }
        }}
      >
        {selectedLeaveType && (
          <div className="space-y-6">
            <p className="text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                "{selectedLeaveType.name}"
              </span>
              ?
            </p>

            <p className="text-sm text-red-600">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteOpen(false);
                  setSelectedLeaveType(null);
                }}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Leave Type"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}