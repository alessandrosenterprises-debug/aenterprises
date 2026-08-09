"use client";

import { useState } from "react";

import Modal from "@/components/ui/modal/Modal";
import CustomerForm from "./CustomerForm";

interface Business {
  id: string;
  name: string;
}

interface CustomerModalProps {
  businesses: Business[];

  mode?: "create" | "edit";

  customer?: any;
  open?: boolean;
onClose?: () => void;
}

export default function CustomerModal({
  businesses,
  mode = "create",
  customer,
  open,
  onClose,
}: CustomerModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

const isOpen = open ?? internalOpen;

  return (
    <>
      {mode === "create" && (
  <button
    onClick={() => setInternalOpen(true)}
    className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
  >
    + Add Customer
  </button>
)}

      <Modal
        open={isOpen}
        title={
  mode === "create"
    ? "New Customer"
    : "Edit Customer"
}
        onClose={() => {
  if (onClose) {
    onClose();
  } else {
    setInternalOpen(false);
  }
}}
      >
        <CustomerForm
  businesses={businesses}
  mode={mode}
  customer={customer}
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