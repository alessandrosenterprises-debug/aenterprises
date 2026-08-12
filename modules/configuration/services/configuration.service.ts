import { supabase } from "@/lib/supabase/client";

export async function getConfiguration(
  table: string
) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data ?? [];
}

export async function createConfiguration(
  table: string,
  values: Record<string, any>
) {
  const { data, error } = await supabase
    .from(table)
    .insert(values)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateConfiguration(
  table: string,
  id: string,
  values: Record<string, any>
) {
  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteConfiguration(
  table: string,
  id: string
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id);

  if (error) throw error;
}