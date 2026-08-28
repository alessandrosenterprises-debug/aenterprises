import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  const [
    businessesResult,
    employeesResult,
    customersResult,
    bookingsResult,
    revenueResult,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("employees")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("customers")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("bookings")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("bookings")
      .select("amount")
      .eq("status", "Completed")
      .eq("payment_status", "Paid"),
  ]);

  if (businessesResult.error) {
    console.error(
      "Dashboard businesses error:",
      businessesResult.error
    );
  }

  if (employeesResult.error) {
    console.error(
      "Dashboard employees error:",
      employeesResult.error
    );
  }

  if (customersResult.error) {
    console.error(
      "Dashboard customers error:",
      customersResult.error
    );
  }

  if (bookingsResult.error) {
    console.error(
      "Dashboard bookings error:",
      bookingsResult.error
    );
  }

  if (revenueResult.error) {
    console.error(
      "Dashboard revenue error:",
      revenueResult.error
    );
  }

  const revenue = (revenueResult.data ?? []).reduce(
    (total, booking) =>
      total + Number(booking.amount ?? 0),
    0
  );

  return {
    businesses:
      businessesResult.error
        ? 0
        : businessesResult.count ?? 0,

    employees:
      employeesResult.error
        ? 0
        : employeesResult.count ?? 0,

    customers:
      customersResult.error
        ? 0
        : customersResult.count ?? 0,

    bookings:
      bookingsResult.error
        ? 0
        : bookingsResult.count ?? 0,

    revenue:
      revenueResult.error
        ? 0
        : revenue,
  };
}