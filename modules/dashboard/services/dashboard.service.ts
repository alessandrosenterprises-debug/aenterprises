import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  const [
    businesses,
    profiles,
    customers,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("profiles")
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
  ]);

  return {
    businesses: businesses.count ?? 0,
    employees: profiles.count ?? 0,
    customers: customers.count ?? 0,
    bookings: 0,
    revenue: 0,
  };
}