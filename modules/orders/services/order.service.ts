import { createClient } from "@/lib/supabase/server";

export interface ManagedOrder {
  id: string;
  business_id: string;
  customer_id: string;
  status: string;
  payment_status: string;
  fulfillment_method: string;
  delivery_address: string | null;
  notes: string | null;
  subtotal: number;
  total_amount: number;
  created_at: string;
  businesses: { id: string; name: string } | null;
  customers: { id: string; full_name: string; phone: string | null; email: string | null } | null;
  order_items: Array<{
    id: string;
    catalog_item_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    enterprise_catalog: { id: string; name: string } | null;
  }>;
}

export async function isOrdersAdministrator(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("active, roles(name)")
    .eq("auth_user_id", userId)
    .eq("active", true)
    .maybeSingle();
  const role = Array.isArray(profile?.roles) ? profile.roles[0] : profile?.roles;
  return role?.name === "Super Administrator" || role?.name === "Enterprise Manager";
}

export async function getManagedOrders(): Promise<ManagedOrder[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isOrdersAdministrator(supabase, user.id))) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, business_id, customer_id, status, payment_status, fulfillment_method,
      delivery_address, notes, subtotal, total_amount, created_at,
      businesses(id, name),
      customers(id, full_name, phone, email),
      order_items(id, catalog_item_id, quantity, unit_price, total_price,
        enterprise_catalog(id, name))
    `)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load customer orders: ${error.message}`);
  return (data ?? []) as unknown as ManagedOrder[];
}
