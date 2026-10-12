import { createClient } from "@/lib/supabase/server";
import type { BusinessCatalogRecord } from "./business-catalog-admin.service";

export async function getActiveCustomerBusinessCatalog(
  slug: string,
  itemType: "product" | "service"
): Promise<BusinessCatalogRecord[]> {
  const supabase = await createClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (businessError) throw businessError;
  if (!business) return [];

  const { data, error } = await supabase.from("enterprise_catalog")
    .select("id, business_id, item_type, category, name, description, base_price, quantity, status, image_url, attributes, created_at")
    .eq("business_id", business.id)
    .ilike("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as BusinessCatalogRecord[]).filter((item) =>
    (item.item_type ?? "").toLowerCase() === itemType ||
    (slug === "elite-fashion" && itemType === "product" && !item.item_type.trim())
  );
}
