import { supabase } from "@/lib/supabase/client";

export async function createEnterpriseCatalogItem(item: any) {
  const { data, error } = await supabase
    .from("enterprise_catalog")
    .insert(item)
    .select();

  if (error) throw error;

  return data;
}

export async function updateEnterpriseCatalogItem(
  id: string,
  item: any
) {
  const { data, error } = await supabase
    .from("enterprise_catalog")
    .update(item)
    .eq("id", id)
    .select();

  if (error) throw error;

  return data;
}

export async function deleteEnterpriseCatalogItem(
  id: string
) {
  const { error } = await supabase
    .from("enterprise_catalog")
    .delete()
    .eq("id", id);

  if (error) throw error;
}