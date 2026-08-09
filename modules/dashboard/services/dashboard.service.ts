import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  const [
    businesses,
    employees,
    customers,
    bookings,
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
  ]);

  return {
    businesses: businesses.count ?? 0,
    employees: employees.count ?? 0,
    customers: customers.count ?? 0,
    bookings: bookings.count ?? 0,
    revenue: 0,
  };
}