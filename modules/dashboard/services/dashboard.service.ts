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
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("employees")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("customers")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("bookings")
      .select("*", {
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
    businesses: businessesResult.count ?? 0,
    employees: employeesResult.count ?? 0,
    customers: customersResult.count ?? 0,
    bookings: bookingsResult.count ?? 0,
    revenue,
  };
}