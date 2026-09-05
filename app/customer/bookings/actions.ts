"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "You must be signed in.",
    };
  }

  /*
   * Find the customer connected to this account.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  let customerId: string | null = null;

  if (profile?.email) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", profile.email)
      .maybeSingle();

    customerId = customer?.id ?? null;
  }

  if (!customerId && user.email) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    customerId = customer?.id ?? null;
  }

  if (!customerId && profile?.phone) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", profile.phone)
      .maybeSingle();

    customerId = customer?.id ?? null;
  }

  if (!customerId) {
    return {
      success: false,
      message: "Customer account not found.",
    };
  }

  /*
   * Make sure the booking belongs to this customer.
   */
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, customer_id, status")
    .eq("id", bookingId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (bookingError || !booking) {
    return {
      success: false,
      message: "Booking not found.",
    };
  }

  const currentStatus = booking.status?.toLowerCase();

  /*
   * Completed and already cancelled bookings cannot be cancelled.
   */
  if (currentStatus === "completed") {
    return {
      success: false,
      message: "A completed booking cannot be cancelled.",
    };
  }

  if (currentStatus === "cancelled") {
    return {
      success: false,
      message: "This booking is already cancelled.",
    };
  }

  /*
   * Cancel the booking.
   */
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
    })
    .eq("id", bookingId)
    .eq("customer_id", customerId);

  if (error) {
    console.error("Cancel booking error:", error);

    return {
      success: false,
      message: "Unable to cancel booking.",
    };
  }

  /*
   * Refresh customer booking pages.
   */
  revalidatePath("/customer/bookings");
  revalidatePath(`/customer/bookings/${bookingId}`);

  return {
    success: true,
    message: "Booking cancelled successfully.",
  };
}