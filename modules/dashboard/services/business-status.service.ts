import { createClient } from "@/lib/supabase/server";

export async function getBusinessStatus() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, active")
    .order("name");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}