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
}

export default function CustomerModal({
  businesses,
  mode = "create",
  customer,
}: CustomerModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
      >
        + Add Customer
      </button>

      <Modal
        open={open}
        title={
  mode === "create"
    ? "New Customer"
    : "Edit Customer"
}
        onClose={() => setOpen(false)}
      >
        <CustomerForm
  businesses={businesses}
  mode={mode}
  customer={customer}
  onSuccess={() => setOpen(false)}
/>
      </Modal>
    </>
  );
}