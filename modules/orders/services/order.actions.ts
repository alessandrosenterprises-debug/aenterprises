"use server";

import { createClient } from "@/lib/supabase/server";
import { isOrdersAdministrator } from "./order.service";

export async function updateOrderAction(
  orderId: string,
  updates: { status?: string; payment_status?: string },
): Promise<{ success: boolean; error?: string }> {
  const validStatuses = ["Pending", "Confirmed", "Processing", "Ready", "Completed", "Cancelled"];
  const validPaymentStatuses = ["Pending", "Partial", "Paid", "Refunded"];
  if (!orderId || !Object.keys(updates).length) return { success: false, error: "Select a valid order update." };
  if (updates.status && !validStatuses.includes(updates.status)) return { success: false, error: "Invalid order status." };
  if (updates.payment_status && !validPaymentStatuses.includes(updates.payment_status)) return { success: false, error: "Invalid payment status." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isOrdersAdministrator(supabase, user.id))) return { success: false, error: "You do not have permission to manage orders." };

  const updateData: { status?: string; payment_status?: string } = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.payment_status) updateData.payment_status = updates.payment_status;
  const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
