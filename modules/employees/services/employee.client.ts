import { supabase } from "@/lib/supabase/client";

export interface CreateEmployeeInput {
  business_id: string | null;
  department_id: string | null;

  full_name: string;
  phone: string;

  email?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  national_id?: string | null;
  address?: string | null;

  position: string;
  employment_type?: string | null;

  salary?: number | null;
  date_joined?: string | null;

  notes?: string | null;
  is_active?: boolean;
}

export async function createEmployee(
  employee: CreateEmployeeInput
) {
  const { data, error } = await supabase
    .from("employees")
    .insert({
      business_id: employee.business_id,
      department_id: employee.department_id,

      full_name: employee.full_name,
      phone: employee.phone,

      email: employee.email || null,
      gender: employee.gender || null,
      date_of_birth: employee.date_of_birth || null,
      national_id: employee.national_id || null,
      address: employee.address || null,

      position: employee.position,

      employment_type:
        employee.employment_type || "Full Time",

      salary: employee.salary ?? null,

      date_joined:
        employee.date_joined ||
        new Date().toISOString().split("T")[0],

      notes: employee.notes || null,

      is_active: employee.is_active ?? true,

      status: "Active",
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Employee create error:",
      error
    );

    throw new Error(error.message);
  }

  return data;
}

export async function updateEmployee(
  id: string,
  employee: CreateEmployeeInput
) {
  const { data, error } = await supabase
    .from("employees")
    .update({
      business_id: employee.business_id,
      department_id: employee.department_id,

      full_name: employee.full_name,
      phone: employee.phone,

      email: employee.email || null,
      gender: employee.gender || null,
      date_of_birth: employee.date_of_birth || null,
      national_id: employee.national_id || null,
      address: employee.address || null,

      position: employee.position,

      employment_type:
        employee.employment_type || "Full Time",

      salary: employee.salary ?? null,

      date_joined:
        employee.date_joined ||
        new Date().toISOString().split("T")[0],

      notes: employee.notes || null,

      is_active: employee.is_active ?? true,

      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Employee update error:",
      error
    );

    throw new Error(error.message);
  }

  return data;
}

export async function deleteEmployee(id: string) {
  const { data, error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Employee delete error:",
      error
    );

    throw new Error(error.message);
  }

  return data;
}