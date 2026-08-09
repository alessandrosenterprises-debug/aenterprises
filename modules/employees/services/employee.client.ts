import { supabase } from "@/lib/supabase/client";

export interface CreateEmployeeInput {
  business_id: string;
  full_name: string;
  phone: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  national_id?: string;
  address?: string;
  position: string;
  employment_type?: string;
  salary?: number;
  date_joined?: string;
  notes?: string;
  is_active?: boolean;
}

export async function createEmployee(
  employee: CreateEmployeeInput
) {
  const { error } = await supabase
    .from("employees")
    .insert({
      business_id: employee.business_id,
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
        employee.date_joined || new Date().toISOString().split("T")[0],
      notes: employee.notes || null,
      is_active: employee.is_active ?? true,
      status: "Active",
    });

  if (error) {
    throw error;
  }
}

export async function updateEmployee(
  id: string,
  employee: CreateEmployeeInput
) {
  const { data, error } = await supabase
    .from("employees")
    .update({
      business_id: employee.business_id,
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
        employee.date_joined || new Date().toISOString().split("T")[0],
      notes: employee.notes || null,
      is_active: employee.is_active ?? true,
    })
    .eq("id", id)
    .select();

  console.log("UPDATE DATA:", data);
  console.log("UPDATE ERROR:", error);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      "No employee was updated. Check the UPDATE policy or matching row."
    );
  }
}

export async function deleteEmployee(id: string) {
  const { data, error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .select();

  console.log("DELETE DATA:", data);
  console.log("DELETE ERROR:", error);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      "No employee was deleted. Check the DELETE policy or matching row."
    );
  }
}