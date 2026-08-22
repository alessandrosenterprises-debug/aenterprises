"use client";

import Modal from "@/components/ui/modal/Modal";

interface AEConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;

  loading?: boolean;

  /*
   * Support both naming styles.
   * Existing HR components use:
   * confirmLabel / loadingLabel
   *
   * Newer components may use:
   * confirmText / loadingText
   */
  confirmLabel?: string;
  loadingLabel?: string;

  confirmText?: string;
  loadingText?: string;

  variant?: "danger" | "success" | "primary";

  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function AEConfirmDialog({
  open,
  title,
  message,

  loading = false,

  confirmLabel,
  loadingLabel,

  confirmText,
  loadingText,

  variant = "primary",

  onCancel,
  onConfirm,
}: AEConfirmDialogProps) {
  const finalConfirmLabel =
    confirmLabel ??
    confirmText ??
    "Confirm";

  const finalLoadingLabel =
    loadingLabel ??
    loadingText ??
    "Processing...";

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : variant === "success"
        ? "bg-emerald-600 hover:bg-emerald-700"
        : "bg-[#03162F] hover:bg-[#0A2852]";

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
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {loading
              ? finalLoadingLabel
              : finalConfirmLabel}
          </button>

        </div>

      </div>
    </Modal>
  );
}