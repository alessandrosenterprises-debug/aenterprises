import { createClient } from "@/lib/supabase/server";
import { Product } from "../types/product";


export async function getProducts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      businesses(name)
    `)
    .order("created_at", { ascending: false });

  console.log("Server Products:", data);
  console.log("Server Product Error:", error);

  return (data ?? []) as Product[];
}