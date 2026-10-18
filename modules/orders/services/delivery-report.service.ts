import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface DeliveryReportOrder {
  id: string;
  business_id: string;
  customer_id: string | null;
  status: string;
  payment_status: string;
  fulfillment_method: string;
  total_amount: number | string | null;
  created_at: string;
  delivery_status: string | null;
  rider_employee_id: string | null;
  delivery_proof_received_by: string | null;
  delivery_proof_note: string | null;
  delivery_proof_at: string | null;
  delivery_rating: number | null;
  delivery_review: string | null;
  delivery_rated_at: string | null;
  businesses: { id: string; name: string; slug: string | null } | null;
  customers: { id: string; full_name: string | null; phone: string | null } | null;
  rider: { id: string; full_name: string | null; phone: string | null; position: string | null } | null;
}

export async function getDeliveryReportOrders(): Promise<DeliveryReportOrder[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: canViewOrders, error: permissionError } = await supabase.rpc("has_permission", { required_permission: "orders.view" });
  if (permissionError || !canViewOrders) redirect("/dashboard/access-denied");

  const result: DeliveryReportOrder[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, business_id, customer_id, status, payment_status, fulfillment_method,
        total_amount, created_at, delivery_status, rider_employee_id,
        delivery_proof_received_by, delivery_proof_note, delivery_proof_at,
        delivery_rating, delivery_review, delivery_rated_at,
        businesses(id, name, slug), customers(id, full_name, phone),
        rider:employees!orders_rider_employee_id_fkey(id, full_name, phone, position)
      `)
      .eq("fulfillment_method", "Delivery")
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error("Delivery report data could not be loaded. Please try again.");
    const page = (data ?? []) as unknown as DeliveryReportOrder[];
    result.push(...page);
    if (page.length < pageSize) break;
  }

  return result;
}
