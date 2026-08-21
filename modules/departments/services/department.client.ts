import { supabase } from "@/lib/supabase/client";

export interface DepartmentInput {
  name: string;
  description?: string | null;
  status?: string;
}

export async function createDepartment(
  data: DepartmentInput
) {
  const { data: department, error } = await supabase
    .from("departments")
    .insert({
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? "Active",
    })
    .select()
    .single();

  if (error) {
    console.error("Department create error:", error);
    throw new Error(error.message);
  }

  return department;
}

export async function updateDepartment(
  id: string,
  data: DepartmentInput
) {
  const { data: department, error } = await supabase
    .from("departments")
    .update({
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? "Active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Department update error:", error);
    throw new Error(error.message);
  }

  return department;
}

export async function deleteDepartment(id: string) {
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Department delete error:", error);
    throw new Error(error.message);
  }

  return true;
}