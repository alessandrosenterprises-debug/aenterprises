import { createClient } from "@/lib/supabase/server";

export interface BusinessCatalogBusiness {
  id: string;
  name: string;
  slug: string;
}

export interface BusinessCatalogRecord {
  id: string;
  business_id: string;
  item_type: string;
  category: string | null;
  name: string;
  description: string | null;
  base_price: number | null;
  quantity: number | null;
  status: string;
  image_url: string | null;
  attributes: Record<string, unknown> | null;
  created_at: string;
}

export async function getBusinessForCatalog(slug: string): Promise<BusinessCatalogBusiness | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("businesses")
    .select("id, name, slug").eq("slug", slug).eq("active", true).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBusinessCatalogItems(
  slug: string,
  itemType: string
): Promise<{ business: BusinessCatalogBusiness; items: BusinessCatalogRecord[] } | null> {
  const business = await getBusinessForCatalog(slug);
  if (!business) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("enterprise_catalog")
    .select("id, business_id, item_type, category, name, description, base_price, quantity, status, image_url, attributes, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const items = ((data ?? []) as BusinessCatalogRecord[]).filter((item) =>
    (item.item_type ?? "").toLowerCase() === itemType ||
    (slug === "elite-fashion" && itemType === "product" && !item.item_type.trim())
  );
  return { business, items };
}

export async function getBusinessCatalogItem(
  slug: string,
  itemId: string,
  itemType: string
): Promise<{ business: BusinessCatalogBusiness; item: BusinessCatalogRecord } | null> {
  const business = await getBusinessForCatalog(slug);
  if (!business) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("enterprise_catalog")
    .select("id, business_id, item_type, category, name, description, base_price, quantity, status, image_url, attributes, created_at")
    .eq("business_id", business.id).eq("id", itemId).maybeSingle();
  if (error) throw error;
  if (!data || ((data.item_type ?? "").toLowerCase() !== itemType && !(slug === "elite-fashion" && itemType === "product" && !(data.item_type ?? "").trim()))) return null;
  return { business, item: data as BusinessCatalogRecord };
}
