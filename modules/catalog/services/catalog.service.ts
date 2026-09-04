import { supabase } from "@/lib/supabase/client";

import type {
  CatalogItem,
  CatalogItemInsert,
  CatalogItemUpdate,
} from "../types/catalog";

const TABLE = "enterprise_catalog";

/**
 * Get all catalog items.
 */
export async function getCatalogItems(): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getCatalogItems error:", error);
    throw new Error(error.message);
  }

  return (data ?? []) as CatalogItem[];
}

/**
 * Get catalog items belonging to one business.
 */
export async function getCatalogItemsByBusiness(
  businessId: string,
): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getCatalogItemsByBusiness error:", error);
    throw new Error(error.message);
  }

  return (data ?? []) as CatalogItem[];
}

/**
 * Get active catalog items for customers.
 */
export async function getActiveCatalogItems(
  businessId?: string,
): Promise<CatalogItem[]> {
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getActiveCatalogItems error:", error);
    throw new Error(error.message);
  }

  return (data ?? []) as CatalogItem[];
}

/**
 * Get one catalog item.
 */
export async function getCatalogItem(
  id: string,
): Promise<CatalogItem | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getCatalogItem error:", error);
    throw new Error(error.message);
  }

  return data as CatalogItem | null;
}

/**
 * Create catalog item.
 */
export async function createCatalogItem(
  payload: CatalogItemInsert,
): Promise<CatalogItem> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      business_id: payload.business_id,
      item_type: payload.item_type,
      category: payload.category ?? null,
      name: payload.name,
      description: payload.description ?? null,
      base_price: payload.base_price ?? 0,
      quantity: payload.quantity ?? 0,
      status: payload.status ?? "Active",
      image_url: payload.image_url ?? null,
      attributes: payload.attributes ?? {},
    })
    .select("*")
    .single();

  if (error) {
    console.error("createCatalogItem error:", error);
    throw new Error(error.message);
  }

  return data as CatalogItem;
}

/**
 * Update catalog item.
 */
export async function updateCatalogItem(
  id: string,
  payload: CatalogItemUpdate,
): Promise<CatalogItem> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("updateCatalogItem error:", error);
    throw new Error(error.message);
  }

  return data as CatalogItem;
}

/**
 * Change active/inactive status.
 */
export async function setCatalogItemStatus(
  id: string,
  status: "Active" | "Inactive",
): Promise<CatalogItem> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("setCatalogItemStatus error:", error);
    throw new Error(error.message);
  }

  return data as CatalogItem;
}

/**
 * Delete catalog item.
 */
export async function deleteCatalogItem(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteCatalogItem error:", error);
    throw new Error(error.message);
  }
}