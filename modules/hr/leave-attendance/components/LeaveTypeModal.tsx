"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import Modal from "@/components/ui/modal/Modal";

import type {
  LeaveType,
} from "../services/leave-types.service";

import {
  createLeaveType,
  updateLeaveType,
  type LeaveTypeInput,
} from "../services/leave-types.client";

interface LeaveTypeModalProps {
  open?: boolean;
  mode?: "create" | "edit";
  leaveType?: LeaveType | null;
  onClose?: () => void;
  onSaved?: () => void;
}

export default function LeaveTypeModal({
  open = false,
  mode = "create",
  leaveType = null,
  onClose,
  onSaved,
}: LeaveTypeModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [defaultDays, setDefaultDays] =
    useState("0");
  const [isPaid, setIsPaid] =
    useState(true);
  const [isActive, setIsActive] =
    useState(true);
  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && leaveType) {
      setName(leaveType.name);
      setDescription(
        leaveType.description ?? ""
      );
      setDefaultDays(
        String(leaveType.default_days ?? 0)
      );
      setIsPaid(leaveType.is_paid);
      setIsActive(leaveType.is_active);
    } else {
      setName("");
      setDescription("");
      setDefaultDays("0");
      setIsPaid(true);
      setIsActive(true);
    }
  }, [open, mode, leaveType]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error(
        "Please enter a leave type name."
      );
      return;
    }

    const days = Number(defaultDays);

    if (!Number.isFinite(days) || days < 0) {
      toast.error(
        "Default days must be zero or greater."
      );
      return;
    }

    const data: LeaveTypeInput = {
      name: name.trim(),
      description:
        description.trim() || null,
      default_days: days,
      is_paid: isPaid,
      is_active: isActive,
    };

    try {
      setSaving(true);

      if (
        mode === "edit" &&
        leaveType
      ) {
        await updateLeaveType(
          leaveType.id,
          data
        );

        toast.success(
          "Leave type updated successfully."
        );
      } else {
        await createLeaveType(data);

        toast.success(
          "Leave type created successfully."
        );
      }

      onSaved?.();
      onClose?.();
    } catch (error) {
      console.error(
        "Leave type save error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save leave type."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={
        mode === "edit"
          ? "Edit Leave Type"
          : "Add Leave Type"
      }
      onClose={() => {
        if (!saving) {
          onClose?.();
        }
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* NAME */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Leave Type Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="e.g. Annual Leave"
            disabled={saving}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:bg-slate-100"
          />
        </div>

        {/* DESCRIPTION */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Describe this type of leave..."
            rows={3}
            disabled={saving}
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:bg-slate-100"
          />
        </div>

        {/* DEFAULT DAYS */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Default Days
          </label>

          <input
            type="number"
            min="0"
            step="0.5"
            value={defaultDays}
            onChange={(event) =>
              setDefaultDays(
                event.target.value
              )
            }
            disabled={saving}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:bg-slate-100"
          />
        </div>

        {/* PAID */}

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
          <div>
            <p className="font-semibold text-slate-800">
              Paid Leave
            </p>

            <p className="text-sm text-slate-500">
              Employee continues receiving
              normal pay.
            </p>
          </div>

          <input
            type="checkbox"
            checked={isPaid}
            onChange={(event) =>
              setIsPaid(
                event.target.checked
              )
            }
            disabled={saving}
            className="h-5 w-5 accent-[#D4AF37]"
          />
        </label>

        {/* ACTIVE */}

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
          <div>
            <p className="font-semibold text-slate-800">
              Active
            </p>

            <p className="text-sm text-slate-500">
              Active leave types appear in
              new leave requests.
            </p>
          </div>

          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) =>
              setIsActive(
                event.target.checked
              )
            }
            disabled={saving}
            className="h-5 w-5 accent-[#D4AF37]"
          />
        </label>

        {/* ACTIONS */}

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#03162F] px-5 py-2.5 font-semibold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : "Create Leave Type"}
          </button>
        </div>
      </form>
    </Modal>
  );
}