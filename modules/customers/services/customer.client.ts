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