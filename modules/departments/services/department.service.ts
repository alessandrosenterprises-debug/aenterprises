import { createClient } from "@/lib/supabase/server";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function getDepartments(): Promise<Department[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Departments loading error:",
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  return (data ?? []) as Department[];
}