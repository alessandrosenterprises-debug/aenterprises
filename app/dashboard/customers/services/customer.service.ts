import { createClient } from "@/lib/supabase/server";

export async function getCustomers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select(`
      *,
      businesses (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}