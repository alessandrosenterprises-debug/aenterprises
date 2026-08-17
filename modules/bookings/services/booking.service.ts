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

export interface BookingFormData {
  businesses: {
    id: string;
    name: string;
  }[];

  customers: {
    id: string;
    full_name: string;
    phone: string;
    business_id: string;
  }[];

  employees: {
    id: string;
    full_name: string;
    business_id: string;
    branch_id: string | null;
  }[];

  branches: {
    id: string;
    name: string;
    business_id: string;
  }[];

  catalogItems: {
    id: string;
    name: string;
    item_type: string;
    business_id: string;
    base_price: number;
  }[];
}

export async function getBookings(): Promise<Booking[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      business_id,
      customer_id,
      employee_id,
      branch_id,
      catalog_item_id,
      booking_date,
      booking_time,
      status,
      payment_status,
      amount,
      notes,
      created_at,
      updated_at,
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
      "Bookings query error:",
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  const rows = (data ?? []) as unknown[];

  return rows.map((item) => {
    const row = item as Record<string, any>;

    return {
      ...row,
      amount: Number(row.amount ?? 0),
    } as Booking;
  });
}

export async function getBookingFormData(): Promise<BookingFormData> {
  const supabase = await createClient();

  const [
    businessesResult,
    customersResult,
    employeesResult,
    branchesResult,
    catalogResult,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name")
      .order("name"),

    supabase
      .from("customers")
      .select("id, full_name, phone, business_id")
      .order("full_name"),

    supabase
      .from("employees")
      .select("id, full_name, business_id, branch_id")
      .eq("is_active", true)
      .order("full_name"),

    supabase
      .from("branches")
      .select("id, name, business_id")
      .order("name"),

    supabase
      .from("enterprise_catalog")
      .select(
        "id, name, item_type, business_id, base_price"
      )
      .eq("status", "Active")
      .order("name"),
  ]);

  if (businessesResult.error) {
    throw businessesResult.error;
  }

  if (customersResult.error) {
    throw customersResult.error;
  }

  if (employeesResult.error) {
    throw employeesResult.error;
  }

  if (branchesResult.error) {
    throw branchesResult.error;
  }

  if (catalogResult.error) {
    throw catalogResult.error;
  }

  return {
    businesses: businessesResult.data ?? [],
    customers: customersResult.data ?? [],
    employees: employeesResult.data ?? [],
    branches: branchesResult.data ?? [],
    catalogItems: (catalogResult.data ?? []).map(
      (item) => ({
        ...item,
        base_price: Number(item.base_price ?? 0),
      })
    ),
  };
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
      JSON.stringify(error, null, 2)
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
      (booking) => booking.status === "Pending"
    ).length,

    confirmed: bookings.filter(
      (booking) => booking.status === "Confirmed"
    ).length,

    completed: bookings.filter(
      (booking) => booking.status === "Completed"
    ).length,

    cancelled: bookings.filter(
      (booking) => booking.status === "Cancelled"
    ).length,

    revenue,
  };
}

export async function getBookingsForReport({
  fromDate,
  toDate,
  businessId,
}: {
  fromDate?: string;
  toDate?: string;
  businessId?: string;
}): Promise<Booking[]> {
  const supabase = await createClient();

  let query = supabase
    .from("bookings")
    .select(`
      id,
      business_id,
      customer_id,
      employee_id,
      branch_id,
      catalog_item_id,
      booking_date,
      booking_time,
      status,
      payment_status,
      amount,
      notes,
      created_at,
      updated_at,
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
    `);

  if (fromDate) {
    query = query.gte(
      "booking_date",
      fromDate
    );
  }

  if (toDate) {
    query = query.lte(
      "booking_date",
      toDate
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
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  const rows = (data ?? []) as unknown[];

  return rows.map((item) => {
    const row = item as Record<string, any>;

    return {
      ...row,
      amount: Number(row.amount ?? 0),
    } as Booking;
  });
}