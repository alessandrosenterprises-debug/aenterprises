import { supabase } from "@/lib/supabase/client";

export interface CreateCustomerInput {
  business_id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  notes?: string;
  is_active?: boolean;
}

export async function createCustomer(
  customer: CreateCustomerInput
) {
  const { error } = await supabase
    .from("customers")
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
    throw error;
  }
}

export async function updateCustomer(
  id: string,
  customer: CreateCustomerInput
) {
  const { data, error } = await supabase
    .from("customers")
    .update({
      business_id: customer.business_id,
      full_name: customer.full_name,
      phone: customer.phone,
      email: customer.email || null,
      address: customer.address || null,
      gender: customer.gender || null,
      date_of_birth: customer.date_of_birth || null,
      notes: customer.notes || null,
      is_active: customer.is_active ?? true,
    })
    .eq("id", id)
    .select();


  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      "No customer was updated. This usually means the UPDATE policy blocked the request."
    );
  }
}

export async function deleteCustomer(id: string) {
  const { data, error } = await supabase
    .from("customers")
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
      "No customer was deleted. Check the DELETE policy or matching row."
    );
  }
}