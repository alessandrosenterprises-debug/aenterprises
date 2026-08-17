import { supabase } from "@/lib/supabase/client";

export interface BookingPayload {
  business_id: string;
  customer_id?: string | null;
  employee_id?: string | null;
  branch_id?: string | null;
  catalog_item_id?: string | null;
  booking_date: string;
  booking_time?: string | null;
  status:
    | "Pending"
    | "Confirmed"
    | "Completed"
    | "Cancelled";
  payment_status:
    | "Pending"
    | "Partial"
    | "Paid"
    | "Refunded";
  amount: number;
  notes?: string | null;
}

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