import { createClient } from "@/lib/supabase/server";

export interface Employee {
  id: string;

  business_id: string | null;

  full_name: string;

  phone: string;

  email: string | null;

  gender: string | null;

  date_of_birth: string | null;

  national_id: string | null;

  address: string | null;

  position: string;

  employment_type: string | null;

  salary: number | null;

  date_joined: string | null;

  notes: string | null;

  is_active: boolean;

  status: string;

  created_at: string;

  updated_at: string;

  branch_id: string | null;

  user_id: string | null;

  department_id: string | null;

  businesses?: {
    id: string;
    name: string;
  } | null;

  departments?: {
    id: string;
    name: string;
  } | null;
}

export async function getEmployees(): Promise<Employee[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select(`
  *,
  businesses (
    id,
    name
  ),
  departments (
    id,
    name
  )
`)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Employees loading error:",
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  return (data ?? []) as unknown as Employee[];
}