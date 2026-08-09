"use client";

import Modal from "@/components/ui/modal/Modal";

interface AEConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AEConfirmDialog({
  open,
  title,
  message,
  loading = false,
  onCancel,
  onConfirm,
}: AEConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
    >
      <div className="space-y-6">
        <p className="text-slate-600">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-5 py-2 font-medium hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}