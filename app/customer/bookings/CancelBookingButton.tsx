"use client";

import { useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
import { cancelBooking } from "./actions";

interface CancelBookingButtonProps {
  bookingId: string;
}

export default function CancelBookingButton({
  bookingId,
}: CancelBookingButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const result = await cancelBooking(bookingId);

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error(error);

      window.alert(
        "Something went wrong while cancelling your booking."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={loading}
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-500 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
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
  );
}