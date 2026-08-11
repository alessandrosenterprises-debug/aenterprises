import { createClient } from "@/lib/supabase/server";

export async function getEnterpriseCatalog() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("enterprise_catalog")
    .select(`
      *,
      businesses (
        id,
        name
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  console.log(
    "Enterprise Catalog:",
    data
  );

  console.log(
    "Enterprise Catalog Error:",
    error
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}