"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import Modal from "@/components/ui/modal/Modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  createLeaveRequest,
  updateLeaveRequest,
} from "@/modules/hr/leave-attendance/services/leave-requests.client";

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
  rejection_reason?: string | null;
  notes: string | null;
}

interface LeaveRequestFormValues {
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  notes: string;
}

interface LeaveRequestModalProps {
  employees: Employee[];
  leaveTypes: LeaveType[];

  mode?: "create" | "edit";

  request?: LeaveRequest;

  open?: boolean;

  onClose?: () => void;
}

/* ============================================================
   DATE HELPERS
============================================================ */

function calculateDays(
  startDate: string,
  endDate: string
) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(
    `${startDate}T00:00:00`
  );

  const end = new Date(
    `${endDate}T00:00:00`
  );

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  if (end < start) {
    return 0;
  }

  const difference =
    end.getTime() - start.getTime();

  return (
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

/* ============================================================
   EMPTY FORM
============================================================ */

const emptyFormValues: LeaveRequestFormValues =
  {
    employee_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    days: 0,
    reason: "",
    notes: "",
  };

/* ============================================================
   COMPONENT
============================================================ */

export default function LeaveRequestModal({
  employees,
  leaveTypes,
  mode = "create",
  request,
  open,
  onClose,
}: LeaveRequestModalProps) {
  const router = useRouter();

  const [internalOpen, setInternalOpen] =
    useState(false);

  const isOpen =
    open !== undefined
      ? open
      : internalOpen;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<LeaveRequestFormValues>({
    defaultValues: emptyFormValues,
  });

  /* ==========================================================
     WATCH FORM
  ========================================================== */

  const startDate =
    watch("start_date");

  const endDate =
    watch("end_date");

  const selectedLeaveType =
    watch("leave_type_id");

  /* ==========================================================
     CALCULATE DAYS
  ========================================================== */

  const calculatedDays = useMemo(
    () =>
      calculateDays(
        startDate,
        endDate
      ),
    [startDate, endDate]
  );

  /* ==========================================================
     KEEP DAYS IN SYNC
  ========================================================== */

  useEffect(() => {
    setValue(
      "days",
      calculatedDays
    );
  }, [
    calculatedDays,
    setValue,
  ]);

  /* ==========================================================
     RESET FORM WHEN MODAL OPENS
  ========================================================== */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (
      mode === "edit" &&
      request
    ) {
      reset({
        employee_id:
          request.employee_id,

        leave_type_id:
          request.leave_type_id,

        start_date:
          request.start_date,

        end_date:
          request.end_date,

        days:
          request.days ?? 0,

        reason:
          request.reason ?? "",

        notes:
          request.notes ?? "",
      });

      return;
    }

    /*
     * CREATE MODE
     *
     * Always start completely clean.
     * This prevents values from a previous
     * request/edit from appearing.
     */

    reset({
      ...emptyFormValues,
    });
  }, [
    isOpen,
    mode,
    request,
    reset,
  ]);

  /* ==========================================================
     CLOSE
  ========================================================== */

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }

    /*
     * Clear the form after closing as well.
     * This gives the next "New Leave Request"
     * a completely fresh form.
     */
    reset({
      ...emptyFormValues,
    });
  }

  /* ==========================================================
     OPTIONS
  ========================================================== */

  const employeeOptions =
    employees.map((employee) => ({
      label: employee.position
        ? `${employee.full_name} — ${employee.position}`
        : employee.full_name,

      value: employee.id,
    }));

  const leaveTypeOptions =
    leaveTypes
      .filter(
        (type) =>
          type.is_active !== false
      )
      .map((type) => ({
        label: type.name,
        value: type.id,
      }));

  /* ==========================================================
     SUBMIT
  ========================================================== */

  async function onSubmit(
    data: LeaveRequestFormValues
  ) {
    try {
      if (!data.employee_id) {
        toast.error(
          "Please select an employee."
        );

        return;
      }

      if (!data.leave_type_id) {
        toast.error(
          "Please select a leave type."
        );

        return;
      }

      if (
        !data.start_date ||
        !data.end_date
      ) {
        toast.error(
          "Please select both start and end dates."
        );

        return;
      }

      const days = calculateDays(
        data.start_date,
        data.end_date
      );

      if (days <= 0) {
        toast.error(
          "End date must be on or after the start date."
        );

        return;
      }

      const payload = {
        employee_id:
          data.employee_id,

        leave_type_id:
          data.leave_type_id,

        start_date:
          data.start_date,

        end_date:
          data.end_date,

        days,

        reason:
          data.reason.trim() || null,

        status:
          request?.status ?? "Pending",

        rejection_reason:
          request?.rejection_reason ??
          null,

        notes:
          data.notes.trim() || null,
      };

      if (
        mode === "edit" &&
        request?.id
      ) {
        await updateLeaveRequest(
          request.id,
          payload
        );

        toast.success(
          "Leave request updated successfully."
        );
      } else {
        await createLeaveRequest(
          payload
        );

        toast.success(
          "Leave request created successfully."
        );
      }

      closeModal();

      router.refresh();
    } catch (error) {
      console.error(
        "Leave request save error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save leave request."
      );
    }
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      {/* ======================================================
          NEW REQUEST BUTTON
      ====================================================== */}

      {mode === "create" && (
        <button
          type="button"
          onClick={() => {
            /*
             * Explicitly clear the form before opening.
             */
            reset({
              ...emptyFormValues,
            });

            setInternalOpen(true);
          }}
          className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
        >
          + New Leave Request
        </button>
      )}

      {/* ======================================================
          MODAL
      ====================================================== */}

      <Modal
        open={isOpen}
        title={
          mode === "create"
            ? "New Leave Request"
            : "Edit Leave Request"
        }
        onClose={closeModal}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* ==================================================
              EMPLOYEE
          ================================================== */}

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

            {/* ==================================================
                LEAVE TYPE
            ================================================== */}

            <Select
              label="Leave Type *"
              placeholder="Select Leave Type"
              options={leaveTypeOptions}
              {...register(
                "leave_type_id",
                {
                  required:
                    "Leave type is required",
                }
              )}
            />

            {/* ==================================================
                LEAVE TYPE INFORMATION
            ================================================== */}

            {selectedLeaveType && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                {(() => {
                  const type =
                    leaveTypes.find(
                      (item) =>
                        item.id ===
                        selectedLeaveType
                    );

                  if (!type) {
                    return null;
                  }

                  return (
                    <>
                      <p className="font-semibold text-blue-900">
                        {type.name}
                      </p>

                      {type.description && (
                        <p className="mt-1 text-sm text-blue-700">
                          {
                            type.description
                          }
                        </p>
                      )}

                      <p className="mt-2 text-sm text-blue-700">
                        Default days:{" "}
                        <span className="font-semibold">
                          {type.default_days ??
                            0}
                        </span>
                      </p>

                      <p className="text-sm text-blue-700">
                        {type.is_paid
                          ? "Paid Leave"
                          : "Unpaid Leave"}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ==================================================
                DATES
            ================================================== */}

            <div className="grid gap-6 md:grid-cols-2">
              <Input
                type="date"
                label="Start Date *"
                {...register(
                  "start_date",
                  {
                    required:
                      "Start date is required",
                  }
                )}
              />

              <Input
                type="date"
                label="End Date *"
                {...register(
                  "end_date",
                  {
                    required:
                      "End date is required",
                  }
                )}
              />
            </div>

            {/* ==================================================
                CALCULATED DURATION
            ================================================== */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Leave Duration
              </p>

              <p className="mt-1 text-2xl font-bold text-[#03162F]">
                {calculatedDays > 0
                  ? `${calculatedDays} ${
                      calculatedDays === 1
                        ? "day"
                        : "days"
                    }`
                  : "Select dates"}
              </p>
            </div>

            {/* ==================================================
                DAYS
            ================================================== */}

            <Input
              type="number"
              label="Days"
              min={1}
              value={
                calculatedDays > 0
                  ? calculatedDays
                  : ""
              }
              readOnly
              {...register("days", {
                valueAsNumber: true,
              })}
            />

            {/* ==================================================
                REASON
            ================================================== */}

            <Textarea
              label="Reason"
              placeholder="Reason for requesting leave..."
              {...register("reason")}
            />

            {/* ==================================================
                NOTES
            ================================================== */}

            <Textarea
              label="Notes"
              placeholder="Additional notes..."
              {...register("notes")}
            />

            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <SubmitButton
                loading={isSubmitting}
              >
                {mode === "create"
                  ? "Create Leave Request"
                  : "Update Leave Request"}
              </SubmitButton>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}