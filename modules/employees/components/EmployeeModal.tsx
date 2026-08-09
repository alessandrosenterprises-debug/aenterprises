"use client";

import { useState } from "react";

import Modal from "@/components/ui/modal/Modal";
import EmployeeForm from "./EmployeeForm";

interface Business {
  id: string;
  name: string;
}

interface EmployeeModalProps {
  businesses: Business[];

  mode?: "create" | "edit";

  employee?: any;
  open?: boolean;
  onClose?: () => void;
}

export default function EmployeeModal({
  businesses,
  mode = "create",
  employee,
  open,
  onClose,
}: EmployeeModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = open ?? internalOpen;

  return (
    <>
      {mode === "create" && (
        <button
          onClick={() => setInternalOpen(true)}
          className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
        >
          + Add Employee
        </button>
      )}

      <Modal
        open={isOpen}
        title={
          mode === "create"
            ? "New Employee"
            : "Edit Employee"
        }
        onClose={() => {
          if (onClose) {
            onClose();
          } else {
            setInternalOpen(false);
          }
        }}
      >
        <EmployeeForm
          businesses={businesses}
          mode={mode}
          employee={employee}
          onSuccess={() => {
            if (onClose) {
              onClose();
            } else {
              setInternalOpen(false);
            }
          }}
        />
      </Modal>
    </>
  );
}