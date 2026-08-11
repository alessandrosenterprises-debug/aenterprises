import { createClient } from "@/lib/supabase/server";

export async function getBusinesses() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("id, name")
    .order("name");

  if (error) {
    throw error;
  }

  return data ?? [];
}