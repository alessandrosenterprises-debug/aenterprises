"use client";

import {
  CheckCircle2,
  CheckCheck,
  XCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type ConsultationActionsProps = {
  consultationId: string;
  status: string;
};

export default function ConsultationActions({
  consultationId,
  status,
}: ConsultationActionsProps) {
  const router = useRouter();

  const [loadingStatus, setLoadingStatus] = useState<string | null>(
    null
  );

  const updateStatus = async (nextStatus: string) => {
    if (loadingStatus) return;

    const confirmationMessage =
      nextStatus === "Confirmed"
        ? "Confirm this technology consultation request?"
        : nextStatus === "Completed"
          ? "Mark this consultation as completed?"
          : "Cancel this consultation request?";

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    try {
      setLoadingStatus(nextStatus);

      const response = await fetch(
        `/api/dashboard/technology-consultations/${consultationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Unable to update consultation."
        );
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Consultation status update failed:",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to update consultation."
      );
    } finally {
      setLoadingStatus(null);
    }
  };

  const isLoading = loadingStatus !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "Pending" && (
        <button
          type="button"
          onClick={() => updateStatus("Confirmed")}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingStatus === "Confirmed" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}

          Confirm
        </button>
      )}

      {status === "Confirmed" && (
        <button
          type="button"
          onClick={() => updateStatus("Completed")}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingStatus === "Completed" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}

          Complete
        </button>
      )}

      {(status === "Pending" || status === "Confirmed") && (
        <button
          type="button"
          onClick={() => updateStatus("Cancelled")}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingStatus === "Cancelled" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}

          Cancel
        </button>
      )}
    </div>
  );
}