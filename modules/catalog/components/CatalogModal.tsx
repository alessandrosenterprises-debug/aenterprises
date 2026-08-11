"use client";

import { useState } from "react";

import Modal from "@/components/ui/modal/Modal";

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
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = open ?? internalOpen;

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
        onClose={() => {
          if (onClose) {
            onClose();
          } else {
            setInternalOpen(false);
          }
        }}
      >
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Business
            </label>

            <select className="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option value="">
                Select Business
              </option>

              {businesses.map((business) => (
                <option
                  key={business.id}
                  value={business.id}
                >
                  {business.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            Dynamic Catalog Form coming next...
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (onClose) {
                  onClose();
                } else {
                  setInternalOpen(false);
                }
              }}
              className="rounded-xl border border-slate-300 px-6 py-3"
            >
              Cancel
            </button>

            <button
              type="button"
              className="rounded-xl bg-[#03162F] px-6 py-3 font-semibold text-white"
            >
              Save Item
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}