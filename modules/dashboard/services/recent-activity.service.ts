import { createClient } from "@/lib/supabase/server";

export async function getRecentActivity() {
  const supabase = await createClient();

  const [customers, employees] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("employees")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const activity = [
    ...(customers.data ?? []).map((item) => ({
      id: item.id,
      type: "customer",
      title: `${item.full_name} was added as a customer`,
      created_at: item.created_at,
    })),

    ...(employees.data ?? []).map((item) => ({
      id: item.id,
      type: "employee",
      title: `${item.full_name} was added as an employee`,
      created_at: item.created_at,
    })),
  ];

  return activity
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 8);
}