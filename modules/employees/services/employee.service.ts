import { createClient } from "@/lib/supabase/server";

export async function getEmployees() {
  const supabase = await createClient();

  const { data, error } = await supabase
  .from("employees")
  .select(`
    *,
    businesses (
      id,
      name
    )
  `)
  .order("created_at", { ascending: false });

  console.log("employees:", data);
  console.log("Customer Error:", error);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}
export async function createCustomer(customer: {
  business_id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  notes?: string;
  is_active?: boolean;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .insert({
      business_id: customer.business_id,
      full_name: customer.full_name,
      phone: customer.phone,
      email: customer.email || null,
      address: customer.address || null,
      gender: customer.gender || null,
      date_of_birth: customer.date_of_birth || null,
      notes: customer.notes || null,
      is_active: customer.is_active ?? true,
      status: "Active",
    });

  if (error) {
    console.error(error);
    throw error;
  }
}