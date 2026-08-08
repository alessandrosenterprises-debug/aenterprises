import { createClient } from "@/lib/supabase/server";

export async function getCustomers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

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
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .insert({
      ...customer,
      status: "Active",
    });

  if (error) throw error;
}