"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, XCircle, Loader2 } from "lucide-react";

interface BookingActionsProps {
  bookingId: string;
  status: string;
}

export default function BookingActions({
  bookingId,
  status,
}: BookingActionsProps) {
  const [cancelling, setCancelling] = useState(false);

  const normalizedStatus = status?.toLowerCase();

  const canCancel =
    normalizedStatus === "pending" ||
    normalizedStatus === "confirmed";

  async function handleCancel() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    try {
      setCancelling(true);

      const response = await fetch("/api/customer/bookings/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Unable to cancel booking."
        );
      }

      window.location.reload();
    } catch (error) {
      console.error("Cancel booking error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to cancel booking."
      );

      setCancelling(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Link
        href={`/customer/bookings/${bookingId}`}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#03162F] bg-white px-5 text-sm font-bold text-[#03162F] transition hover:bg-[#03162F] hover:text-white"
      >
        View Details
        <ArrowRight className="h-4 w-4" />
      </Link>

      {canCancel && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelling}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-red-500 bg-white px-5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancelling ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Cancelling...
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              Cancel Booking
            </>
          )}
        </button>
      )}
    </div>
  );
}