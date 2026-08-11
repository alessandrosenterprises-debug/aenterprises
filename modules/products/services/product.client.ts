import { supabase } from "@/lib/supabase/client";
import { Product } from "../types/product";

export async function createProduct(
  product: Omit<Product, "id" | "created_at" | "updated_at" | "businesses">
) {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select();

  if (error) throw error;

  return data;
}

export async function updateProduct(
  id: string,
  product: Partial<Product>
) {
  const { data, error } = await supabase
    .from("products")
    .update(product)
    .eq("id", id)
    .select();

  if (error) throw error;

  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;
}