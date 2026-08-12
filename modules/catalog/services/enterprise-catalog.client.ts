import { supabase } from "@/lib/supabase/client";

export interface EnterpriseCatalogPayload {
  business_id: string;
  item_type: string;
  category?: string | null;
  name: string;
  description?: string | null;
  base_price: number;
  quantity: number;
  status: string;
  image_url?: string | null;
  attributes?: Record<string, any>;
}

export async function createEnterpriseCatalogItem(
  item: EnterpriseCatalogPayload
) {
  const { data, error } = await supabase
    .from("enterprise_catalog")
    .insert(item)
    .select()
    .single();

  if (error) {
    console.error(
      "Create Enterprise Catalog Item Error:",
      error
    );

    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${
        error.message
      }`
    );
  }

  return data;
}

export async function updateEnterpriseCatalogItem(
  id: string,
  item: Partial<EnterpriseCatalogPayload>
) {
  const { data, error } = await supabase
    .from("enterprise_catalog")
    .update(item)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Update Enterprise Catalog Item Error:",
      error
    );

    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${
        error.message
      }`
    );
  }

  return data;
}

export async function deleteEnterpriseCatalogItem(
  id: string
) {
  const { error } = await supabase
    .from("enterprise_catalog")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Delete Enterprise Catalog Item Error:",
      error
    );

    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${
        error.message
      }`
    );
  }

  return true;
}