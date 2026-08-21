"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AERowActions } from "@/components/enterprise/actions";
import { AEConfirmDialog } from "@/components/enterprise";
import { AEDetailsModal } from "@/components/enterprise/details";
import { AEStatusBadge } from "@/components/enterprise/badge";

import AttendanceModal from "./AttendanceModal";

import {
  deleteAttendance,
} from "@/modules/hr/leave-attendance/services/attendance.client";

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  notes: string | null;

  employees?: {
    full_name: string;
    position: string | null;
  } | null;
}

interface AttendanceTableProps {
  attendance: AttendanceRecord[];
  employees: Employee[];
}

function formatTime(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString(
    "en-ZM",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function getStatusClass(
  status: string
) {
  switch (status) {
    case "Present":
      return "bg-emerald-50 text-emerald-700";

    case "Late":
      return "bg-amber-50 text-amber-700";

    case "Absent":
      return "bg-red-50 text-red-700";

    case "Leave":
      return "bg-blue-50 text-blue-700";

    case "Half Day":
      return "bg-purple-50 text-purple-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function AttendanceTable({
  attendance,
  employees,
}: AttendanceTableProps) {
  const router = useRouter();

  const [search, setSearch] =
    useState("");

  const [selectedAttendance, setSelectedAttendance] =
    useState<AttendanceRecord | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const filteredAttendance =
    useMemo(() => {
      if (!search.trim()) {
        return attendance;
      }

      const query =
        search.toLowerCase();

      return attendance.filter(
        (record) => {
          return (
            record.employees?.full_name
              ?.toLowerCase()
              .includes(query) ||
            record.employees?.position
              ?.toLowerCase()
              .includes(query) ||
            record.status
              ?.toLowerCase()
              .includes(query) ||
            record.notes
              ?.toLowerCase()
              .includes(query)
          );
        }
      );
    }, [attendance, search]);

  async function handleDelete() {
    if (!selectedAttendance) {
      return;
    }

    try {
      setDeleting(true);

      await deleteAttendance(
        selectedAttendance.id
      );

      toast.success(
        "Attendance record deleted successfully."
      );

      setDeleteOpen(false);
      setSelectedAttendance(null);

      router.refresh();
    } catch (error) {
      console.error(
        "Attendance delete error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete attendance record."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#03162F]">
            Today&apos;s Records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {attendance.length} attendance{" "}
            {attendance.length === 1
              ? "record"
              : "records"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search employee..."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10 sm:w-64"
          />

          <button
            type="button"
            onClick={() => {
              setSelectedAttendance(null);
              setEditOpen(false);
              setDetailsOpen(false);
            }}
            className="hidden"
          >
            Hidden
          </button>

          <AttendanceModal
  employees={employees}
  mode="create"
/>
        </div>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-4 text-left font-semibold text-slate-700">
                Employee
              </th>

              <th className="px-6 py-4 text-left font-semibold text-slate-700">
                Position
              </th>

              <th className="px-6 py-4 text-left font-semibold text-slate-700">
                Check In
              </th>

              <th className="px-6 py-4 text-left font-semibold text-slate-700">
                Check Out
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
            {filteredAttendance.length ===
            0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  {search
                    ? "No matching attendance records found."
                    : "No attendance records for today."}
                </td>
              </tr>
            ) : (
              filteredAttendance.map(
                (record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {record.employees
                            ?.full_name ??
                            "Unknown Employee"}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {record.employees
                        ?.position ??
                        "—"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatTime(
                        record.check_in
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatTime(
                        record.check_out
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <AEStatusBadge
                        status={
                          record.status
                        }
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <AERowActions
                          onView={() => {
                            setSelectedAttendance(
                              record
                            );

                            setDetailsOpen(
                              true
                            );
                          }}
                          onEdit={() => {
                            setSelectedAttendance(
                              record
                            );

                            setEditOpen(
                              true
                            );
                          }}
                          onDelete={() => {
                            setSelectedAttendance(
                              record
                            );

                            setDeleteOpen(
                              true
                            );
                          }}
                        />
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
          DETAILS
      ===================================================== */}

      <AEDetailsModal
        open={detailsOpen}
        title="Attendance Details"
        onClose={() => {
          setDetailsOpen(false);
          setSelectedAttendance(null);
        }}
      >
        {selectedAttendance && (
          <div className="grid gap-6">
            <div>
              <p className="text-sm text-slate-500">
                Employee
              </p>

              <p className="font-semibold text-slate-900">
                {
                  selectedAttendance
                    .employees
                    ?.full_name ??
                  "Unknown Employee"
                }
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Position
              </p>

              <p className="font-semibold text-slate-900">
                {
                  selectedAttendance
                    .employees
                    ?.position ??
                  "—"
                }
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Date
              </p>

              <p className="font-semibold text-slate-900">
                {
                  selectedAttendance
                    .attendance_date
                }
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">
                  Check In
                </p>

                <p className="font-semibold text-slate-900">
                  {formatTime(
                    selectedAttendance.check_in
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Check Out
                </p>

                <p className="font-semibold text-slate-900">
                  {formatTime(
                    selectedAttendance.check_out
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Status
              </p>

              <div className="mt-1">
                <AEStatusBadge
                  status={
                    selectedAttendance.status
                  }
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Notes
              </p>

              <p className="font-medium text-slate-700">
                {
                  selectedAttendance.notes ??
                  "No notes."
                }
              </p>
            </div>
          </div>
        )}
      </AEDetailsModal>

      {/* =====================================================
          EDIT
      ===================================================== */}

      <AttendanceModal
        employees={employees}
        mode="edit"
        attendance={
          selectedAttendance ??
          undefined
        }
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedAttendance(null);
        }}
      />

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      <AEConfirmDialog
        open={deleteOpen}
        title="Delete Attendance"
        message={`Are you sure you want to delete the attendance record for "${selectedAttendance?.employees?.full_name ?? "this employee"}"? This action cannot be undone.`}
        loading={deleting}
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedAttendance(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}