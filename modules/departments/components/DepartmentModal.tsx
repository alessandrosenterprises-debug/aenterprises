"use client";

import { useState } from "react";

import Modal from "@/components/ui/modal/Modal";
import DepartmentForm from "./DepartmentForm";

interface Department {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

interface DepartmentModalProps {
  mode?: "create" | "edit";
  department?: Department;
  open?: boolean;
  onClose?: () => void;
}

export default function DepartmentModal({
  mode = "create",
  department,
  open,
  onClose,
}: DepartmentModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = open ?? internalOpen;

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
          onClick={() => {
  console.log("ADD DEPARTMENT CLICKED");
  setInternalOpen(true);
}}
          className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
        >
          + Add Department
        </button>
      )}

      <Modal
        open={isOpen}
        title={
          mode === "create"
            ? "New Department"
            : "Edit Department"
        }
        onClose={handleClose}
      >
        <DepartmentForm
          mode={mode}
          department={department}
          onSuccess={handleClose}
        />
      </Modal>
    </>
  );
}