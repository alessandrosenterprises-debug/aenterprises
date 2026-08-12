"use client";

import { useState } from "react";

import Modal from "@/components/ui/modal/Modal";
import EnterpriseCatalogForm from "./EnterpriseCatalogForm";

interface Business {
  id: string;
  name: string;
}

interface CatalogModalProps {
  businesses: Business[];

  mode?: "create" | "edit";

  item?: any;

  open?: boolean;

  onClose?: () => void;
}

export default function CatalogModal({
  businesses,
  mode = "create",
  item,
  open,
  onClose,
}: CatalogModalProps) {
  const [internalOpen, setInternalOpen] =
    useState(false);

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
          onClick={() => setInternalOpen(true)}
          className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
        >
          + Add Catalog Item
        </button>
      )}

      <Modal
        open={isOpen}
        title={
          mode === "create"
            ? "New Catalog Item"
            : "Edit Catalog Item"
        }
        onClose={handleClose}
      >
        <EnterpriseCatalogForm
          businesses={businesses}
          mode={mode}
          item={item}
          onSuccess={handleClose}
        />
      </Modal>
    </>
  );
}