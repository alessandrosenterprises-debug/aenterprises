import { supabase } from "@/lib/supabase/client";

export type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

export type BookingPaymentStatus =
  | "Pending"
  | "Partial"
  | "Paid"
  | "Refunded";

export interface BookingPayload {
  business_id: string;
  customer_id?: string | null;
  employee_id?: string | null;
  branch_id?: string | null;
  catalog_item_id?: string | null;

  booking_date: string;
  booking_time?: string | null;

  status: BookingStatus;

  payment_status: BookingPaymentStatus;

  amount: number;

  notes?: string | null;
}

/*
 * ---------------------------------------------------------
 * CREATE
 * ---------------------------------------------------------
 */

export async function createBooking(
  booking: BookingPayload
) {
  const { data, error } = await supabase
    .from("bookings")
    .insert(booking)
    .select()
    .single();

  if (error) {
    console.error(
      "Create Booking Error:",
      error
    );

    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${error.message}`
    );
  }

  return data;
}

/*
 * ---------------------------------------------------------
 * UPDATE
 * ---------------------------------------------------------
 */

export async function updateBooking(
  id: string,
  booking: Partial<BookingPayload>
) {
  const { data, error } = await supabase
    .from("bookings")
    .update(booking)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Update Booking Error:",
      error
    );

    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${error.message}`
    );
  }

  return data;
}

/*
 * ---------------------------------------------------------
 * STATUS ACTIONS
 * ---------------------------------------------------------
 */

export async function confirmBooking(
  id: string
) {
  return updateBooking(id, {
    status: "Confirmed",
  });
}

export async function completeBooking(
  id: string
) {
  return updateBooking(id, {
    status: "Completed",
  });
}

export async function cancelBooking(
  id: string
) {
  return updateBooking(id, {
    status: "Cancelled",
  });
}

/*
 * ---------------------------------------------------------
 * PAYMENT
 * ---------------------------------------------------------
 */

export async function updateBookingPayment(
  id: string,
  paymentStatus: BookingPaymentStatus
) {
  return updateBooking(id, {
    payment_status: paymentStatus,
  });
}

/*
 * ---------------------------------------------------------
 * DELETE
 * ---------------------------------------------------------
 */

export async function deleteBooking(
  id: string
) {
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Delete Booking Error:",
      error
    );

    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${error.message}`
    );
  }

  return true;
}