"use client";

import { useState } from "react";

import Modal from "@/components/ui/modal/Modal";

import ConfigurationForm from "./ConfigurationForm";
import { ConfigurationSchema } from "../types/configuration";

interface ConfigurationModalProps {
  schema: ConfigurationSchema;

  defaultValues?: Record<string, any>;

  mode?: "create" | "edit";

  open?: boolean;

  onClose?: () => void;

  onSubmit: (
    values: Record<string, any>
  ) => Promise<void>;
}

export default function ConfigurationModal({
  schema,
  defaultValues,
  mode = "create",
  open,
  onClose,
  onSubmit,
}: ConfigurationModalProps) {
  const [internalOpen, setInternalOpen] =
    useState(false);

  const isOpen = open ?? internalOpen;

  function close() {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  }

  return (
    <>
      {mode === "create" && open === undefined && (
  <button
    onClick={() => setInternalOpen(true)}
    className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
  >
    + New {schema.title}
  </button>
)}

      <Modal
        open={isOpen}
        title={
          mode === "create"
            ? `New ${schema.title}`
            : `Edit ${schema.title}`
        }
        onClose={close}
      >
        <ConfigurationForm
          schema={schema}
          defaultValues={defaultValues}
          onSubmit={async (values) => {
            await onSubmit(values);

            close();
          }}
        />
      </Modal>
    </>
  );
}