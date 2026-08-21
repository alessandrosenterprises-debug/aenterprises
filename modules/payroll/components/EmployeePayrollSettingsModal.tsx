"use client";

import { useState } from "react";

import Modal from "@/components/ui/modal/Modal";

import EmployeePayrollSettingsForm from "./EmployeePayrollSettingsForm";

import type {
  EmployeePayrollSettings,
} from "@/modules/payroll/types/payroll.types";

interface Employee {
  id: string;
  full_name: string;
  phone?: string | null;
  position?: string | null;
  salary?: number | null;
}

interface EmployeePayrollSettingsModalProps {
  employees: Employee[];

  mode?: "create" | "edit";

  settings?: EmployeePayrollSettings;

  open?: boolean;

  onClose?: () => void;
}

export default function EmployeePayrollSettingsModal({
  employees,
  mode = "create",
  settings,
  open,
  onClose,
}: EmployeePayrollSettingsModalProps) {
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
          + Add Payroll Settings
        </button>
      )}

      <Modal
        open={isOpen}
        title={
          mode === "create"
            ? "Employee Payroll Settings"
            : "Edit Payroll Settings"
        }
        onClose={handleClose}
      >
        <EmployeePayrollSettingsForm
          employees={employees}
          settings={settings}
          mode={mode}
          onSuccess={handleClose}
        />
      </Modal>
    </>
  );
}