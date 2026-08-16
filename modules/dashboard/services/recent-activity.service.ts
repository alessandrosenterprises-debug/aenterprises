import { createClient } from "@/lib/supabase/server";

export interface RecentActivityItem {
  id: string;
  type: "customer" | "employee" | "booking";
  title: string;
  created_at: string;
}

export async function getRecentActivity(): Promise<
  RecentActivityItem[]
> {
  const supabase = await createClient();

  const [
    customersResult,
    employeesResult,
    bookingsResult,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, created_at")
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    supabase
      .from("employees")
      .select("id, full_name, created_at")
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    supabase
      .from("bookings")
      .select(
        "id, booking_date, booking_time, status, created_at, customer_id, business_id, catalog_item_id"
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(5),
  ]);

  if (customersResult.error) {
    console.error(
      "Recent customer activity error:",
      customersResult.error
    );
  }

  if (employeesResult.error) {
    console.error(
      "Recent employee activity error:",
      employeesResult.error
    );
  }

  if (bookingsResult.error) {
    console.error(
      "Recent booking activity error:",
      bookingsResult.error
    );
  }

  const customerActivity: RecentActivityItem[] =
    (customersResult.data ?? []).map((item) => ({
      id: item.id,
      type: "customer",
      title: `${item.full_name} was added as a customer`,
      created_at: item.created_at,
    }));

  const employeeActivity: RecentActivityItem[] =
    (employeesResult.data ?? []).map((item) => ({
      id: item.id,
      type: "employee",
      title: `${item.full_name} was added as an employee`,
      created_at: item.created_at,
    }));

  const bookingActivity: RecentActivityItem[] =
    (bookingsResult.data ?? []).map((item) => ({
      id: item.id,
      type: "booking",
      title: `A booking was ${item.status.toLowerCase()}`,
      created_at: item.created_at,
    }));

  return [
    ...customerActivity,
    ...employeeActivity,
    ...bookingActivity,
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 8);
}