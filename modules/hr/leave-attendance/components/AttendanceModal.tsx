"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import Modal from "@/components/ui/modal/Modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  createAttendance,
  updateAttendance,
} from "@/modules/hr/leave-attendance/services/attendance.client";

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  notes: string | null;
}

interface AttendanceFormValues {
  employee_id: string;
  attendance_date: string;
  check_in: string;
  check_out: string;
  status: string;
  notes: string;
}

interface AttendanceModalProps {
  employees: Employee[];

  mode?: "create" | "edit";

  attendance?: AttendanceRecord;

  open?: boolean;

  onClose?: () => void;
}

function getToday() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function formatDateForInput(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function formatTimeForInput(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export default function AttendanceModal({
  employees,
  mode = "create",
  attendance,
  open,
  onClose,
}: AttendanceModalProps) {
  const router = useRouter();

  const [internalOpen, setInternalOpen] =
    useState(false);

  const isControlled =
    open !== undefined;

  const isOpen = isControlled
    ? open
    : internalOpen;

  function closeModal() {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  }

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AttendanceFormValues>({
    defaultValues: {
      employee_id:
        attendance?.employee_id ?? "",

      attendance_date:
        formatDateForInput(
          attendance?.attendance_date
        ) || getToday(),

      check_in:
        formatTimeForInput(
          attendance?.check_in
        ),

      check_out:
        formatTimeForInput(
          attendance?.check_out
        ),

      status:
        attendance?.status ?? "Present",

      notes:
        attendance?.notes ?? "",
    },
  });

  const employeeOptions =
    employees.map((employee) => ({
      label: employee.position
        ? `${employee.full_name} — ${employee.position}`
        : employee.full_name,

      value: employee.id,
    }));

  async function onSubmit(
    data: AttendanceFormValues
  ) {
    try {
      const checkIn =
        data.check_in
          ? `${data.attendance_date}T${data.check_in}:00`
          : null;

      const checkOut =
        data.check_out
          ? `${data.attendance_date}T${data.check_out}:00`
          : null;

      const payload = {
        employee_id:
          data.employee_id,

        attendance_date:
          data.attendance_date,

        check_in: checkIn,

        check_out: checkOut,

        status: data.status,

        notes:
          data.notes.trim() || null,
      };

      if (
        mode === "edit" &&
        attendance?.id
      ) {
        await updateAttendance(
          attendance.id,
          payload
        );

        toast.success(
          "Attendance updated successfully."
        );
      } else {
        await createAttendance(
          payload
        );

        toast.success(
          "Attendance recorded successfully."
        );
      }

      closeModal();

      router.refresh();
    } catch (error) {
      console.error(
        "Attendance save error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save attendance."
      );
    }
  }

  return (
    <>
      {/* =====================================================
          CREATE BUTTON
      ===================================================== */}

      {mode === "create" && (
        <button
          type="button"
          onClick={() =>
            setInternalOpen(true)
          }
          className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
        >
          + Mark Attendance
        </button>
      )}

      {/* =====================================================
          MODAL
      ===================================================== */}

      <Modal
        open={isOpen}
        title={
          mode === "create"
            ? "Mark Attendance"
            : "Edit Attendance"
        }
        onClose={closeModal}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="grid gap-6">
            <Select
              label="Employee *"
              placeholder="Select Employee"
              options={employeeOptions}
              {...register(
                "employee_id",
                {
                  required:
                    "Employee is required",
                }
              )}
            />

            <Input
              type="date"
              label="Attendance Date *"
              {...register(
                "attendance_date",
                {
                  required:
                    "Attendance date is required",
                }
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <Input
                type="time"
                label="Check In"
                {...register("check_in")}
              />

              <Input
                type="time"
                label="Check Out"
                {...register("check_out")}
              />
            </div>

            <Select
              label="Status *"
              placeholder="Select Status"
              options={[
                {
                  label: "Present",
                  value: "Present",
                },
                {
                  label: "Late",
                  value: "Late",
                },
                {
                  label: "Absent",
                  value: "Absent",
                },
                {
                  label: "Leave",
                  value: "Leave",
                },
                {
                  label: "Half Day",
                  value: "Half Day",
                },
              ]}
              {...register(
                "status",
                {
                  required:
                    "Status is required",
                }
              )}
            />

            <Textarea
              label="Notes"
              placeholder="Additional attendance notes..."
              {...register("notes")}
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <SubmitButton
                loading={isSubmitting}
              >
                {mode === "create"
                  ? "Record Attendance"
                  : "Update Attendance"}
              </SubmitButton>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}