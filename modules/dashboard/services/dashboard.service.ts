import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  const [businesses, profiles] = await Promise.all([
    supabase.from("businesses").select("*", {
      count: "exact",
      head: true,
    }),
    supabase.from("profiles").select("*", {
      count: "exact",
      head: true,
    }),
  ]);

  return {
    businesses: businesses.count ?? 0,
    employees: profiles.count ?? 0,
    customers: 0,
    bookings: 0,
    revenue: 0,
  };
}