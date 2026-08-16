import { createClient } from "@/lib/supabase/server";

export interface Booking {
  id: string;

  business_id: string;

  customer_id: string | null;

  employee_id: string | null;

  branch_id: string | null;

  catalog_item_id: string | null;

  booking_date: string;

  booking_time: string | null;

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

  notes: string | null;

  created_at: string;

  updated_at: string;

  businesses?: {
    id: string;
    name: string;
  } | null;

  customers?: {
    id: string;
    full_name: string;
    phone: string;
  } | null;

  employees?: {
    id: string;
    full_name: string;
  } | null;

  branches?: {
    id: string;
    name: string;
  } | null;

  enterprise_catalog?: {
    id: string;
    name: string;
    item_type: string;
  } | null;
}

export async function getBookings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      businesses (
        id,
        name
      ),
      customers (
        id,
        full_name,
        phone
      ),
      employees (
        id,
        full_name
      ),
      branches (
        id,
        name
      ),
      enterprise_catalog (
        id,
        name,
        item_type
      )
    `)
    .order("booking_date", {
      ascending: false,
    })
    .order("booking_time", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Bookings error:",
      error
    );

    return [];
  }

  return (data ?? []) as Booking[];
}

export async function getBookingStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "status, payment_status, amount"
    );

  if (error) {
    console.error(
      "Booking statistics error:",
      error
    );

    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      revenue: 0,
    };
  }

  const bookings = data ?? [];

  const revenue = bookings
    .filter(
      (booking) =>
        booking.status === "Completed" &&
        booking.payment_status === "Paid"
    )
    .reduce(
      (total, booking) =>
        total + Number(booking.amount ?? 0),
      0
    );

  return {
    total: bookings.length,

    pending: bookings.filter(
      (booking) =>
        booking.status === "Pending"
    ).length,

    confirmed: bookings.filter(
      (booking) =>
        booking.status === "Confirmed"
    ).length,

    completed: bookings.filter(
      (booking) =>
        booking.status === "Completed"
    ).length,

    cancelled: bookings.filter(
      (booking) =>
        booking.status === "Cancelled"
    ).length,

    revenue,
  };
}

export async function getBookingsForReport({
  date,
  businessId,
}: {
  date?: string;
  businessId?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("bookings")
    .select(`
      id,
      business_id,
      customer_id,
      employee_id,
      catalog_item_id,
      booking_date,
      booking_time,
      status,
      payment_status,
      amount,
      businesses (
        id,
        name
      ),
      customers (
        id,
        full_name
      ),
      enterprise_catalog (
        id,
        name,
        item_type
      )
    `);

  if (date) {
    query = query.eq(
      "booking_date",
      date
    );
  }

  if (businessId) {
    query = query.eq(
      "business_id",
      businessId
    );
  }

  const { data, error } = await query
    .order("booking_date", {
      ascending: false,
    })
    .order("booking_time", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Report bookings error:",
      error
    );

    return [];
  }

  return data ?? [];
}