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
    console.error("Dashboard businesses error:", {
      message: businessesResult.error.message,
      details: businessesResult.error.details,
      hint: businessesResult.error.hint,
      code: businessesResult.error.code,
    });
  }

  if (employeesResult.error) {
    console.error("Dashboard employees error:", {
      message: employeesResult.error.message,
      details: employeesResult.error.details,
      hint: employeesResult.error.hint,
      code: employeesResult.error.code,
    });
  }

  if (customersResult.error) {
    console.error("Dashboard customers error:", {
      message: customersResult.error.message,
      details: customersResult.error.details,
      hint: customersResult.error.hint,
      code: customersResult.error.code,
    });
  }

  if (bookingsResult.error) {
    console.error("Dashboard bookings error:", {
      message: bookingsResult.error.message,
      details: bookingsResult.error.details,
      hint: bookingsResult.error.hint,
      code: bookingsResult.error.code,
    });
  }

  if (revenueResult.error) {
    console.error("Dashboard revenue error:", {
      message: revenueResult.error.message,
      details: revenueResult.error.details,
      hint: revenueResult.error.hint,
      code: revenueResult.error.code,
    });
  }

  const revenue = (revenueResult.data ?? []).reduce(
    (total, booking) => total + Number(booking.amount ?? 0),
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