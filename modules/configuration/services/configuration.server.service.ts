import { createClient } from "@/lib/supabase/server";

export async function getConfiguration(
  table: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      `Failed to load configuration table "${table}":`,
      error
    );

    throw error;
  }

  return data ?? [];
}