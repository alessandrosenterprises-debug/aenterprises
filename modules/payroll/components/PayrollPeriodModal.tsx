"use client";

import { useState } from "react";

import Modal from "@/components/ui/modal/Modal";

import PayrollPeriodForm from "./PayrollPeriodForm";

import type {
  PayrollPeriod,
} from "@/modules/payroll/types/payroll.types";

interface PayrollPeriodModalProps {
  mode?: "create" | "edit";

  period?: PayrollPeriod;

  open?: boolean;

  onClose?: () => void;
}

export default function PayrollPeriodModal({
  mode = "create",
  period,
  open,
  onClose,
}: PayrollPeriodModalProps) {
  const [internalOpen, setInternalOpen] =
    useState(false);

  const isOpen =
    open ?? internalOpen;

  function handleClose() {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  }

  return (
    <>
      {mode === "create" && (
        <button
          type="button"
          onClick={() =>
            setInternalOpen(true)
          }
          className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
        >
          + Add Payroll Period
        </button>
      )}

      <Modal
        open={isOpen}
        title={
          mode === "create"
            ? "New Payroll Period"
            : "Edit Payroll Period"
        }
        onClose={handleClose}
      >
        <PayrollPeriodForm
          mode={mode}
          period={period}
          onSuccess={handleClose}
        />
      </Modal>
    </>
  );
}