"use client";

import { useState } from "react";

import Modal from "@/components/ui/modal/Modal";
import EmployeeForm from "./EmployeeForm";
import type { Employee, EmployeeBranchOption, EmployeeManagerOption } from "@/modules/employees/services/employee.service";

interface Business {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface EmployeeModalProps {
  businesses: Business[];
  departments: Department[];
  branches: EmployeeBranchOption[];
  storeManagers: EmployeeManagerOption[];
  accountOptions?: { auth_user_id: string; display_name: string; email: string }[];

  mode?: "create" | "edit";
  buttonLabel?: string;
  initialPosition?: string;

  employee?: Partial<Employee> & { id?: string };
  open?: boolean;
  onClose?: () => void;
}

export default function EmployeeModal({
  businesses,
  departments,
  branches,
  storeManagers,
  accountOptions,
  mode = "create",
  buttonLabel = "+ Add Employee",
  initialPosition,
  employee,
  open,
  onClose,
}: EmployeeModalProps) {
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
          onClick={() => setInternalOpen(true)}
          className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
        >
          {buttonLabel}
        </button>
      )}

      <Modal
        open={isOpen}
        title={
          mode === "create"
            ? "New Employee"
            : "Edit Employee"
        }
        onClose={handleClose}
      >
        <EmployeeForm
          businesses={businesses}
          departments={departments}
          branches={branches}
          storeManagers={storeManagers}
          accountOptions={accountOptions}
          mode={mode}
          initialPosition={initialPosition}
          employee={employee}
          onSuccess={handleClose}
        />
      </Modal>
    </>
  );
}
