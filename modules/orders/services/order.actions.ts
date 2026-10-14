"use server";

import { createClient } from "@/lib/supabase/server";
import { isOrdersAdministrator } from "./order.service";

export async function updateOrderAction(
  orderId: string,
  updates: {
    status?: string;
    payment_status?: string;
    rider_employee_id?: string | null;
    delivery_status?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const validStatuses = ["Pending", "Confirmed", "Processing", "Ready", "Completed", "Cancelled"];
  const validPaymentStatuses = ["Pending", "Partial", "Paid", "Refunded"];
  const validDeliveryStatuses = ["Not Started", "Preparing", "Rider Assigned", "Picked Up", "Out for Delivery", "Delivered", "Delivery Failed"];
  if (!orderId || !Object.keys(updates).length) return { success: false, error: "Select a valid order update." };
  if (updates.status && !validStatuses.includes(updates.status)) return { success: false, error: "Invalid order status." };
  if (updates.payment_status && !validPaymentStatuses.includes(updates.payment_status)) return { success: false, error: "Invalid payment status." };
  if (updates.delivery_status && !validDeliveryStatuses.includes(updates.delivery_status)) return { success: false, error: "Invalid delivery status." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isOrdersAdministrator(supabase, user.id))) return { success: false, error: "You do not have permission to manage orders." };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, business_id, fulfillment_method, rider_employee_id, delivery_status")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order) return { success: false, error: "Order not found." };

  const isDelivery = order.fulfillment_method?.toLowerCase() === "delivery";
  if ((updates.delivery_status || Object.hasOwn(updates, "rider_employee_id")) && !isDelivery) {
    return { success: false, error: "Delivery tracking is only available for delivery orders." };
  }

  const riderId = Object.hasOwn(updates, "rider_employee_id")
    ? updates.rider_employee_id
    : order.rider_employee_id;
  if (updates.delivery_status && ["Picked Up", "Out for Delivery", "Delivered", "Delivery Failed"].includes(updates.delivery_status) && !riderId) {
    return { success: false, error: "Assign a delivery rider before moving the delivery forward." };
  }

  if (updates.rider_employee_id) {
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, position, business_id, is_active")
      .eq("id", updates.rider_employee_id)
      .maybeSingle();
    if (employeeError || !employee || employee.is_active !== true
      || !/rider|driver|delivery/i.test(employee.position ?? "")) {
      return { success: false, error: "Choose an active delivery rider." };
    }
  }

  const updateData: {
    status?: string;
    payment_status?: string;
    rider_employee_id?: string | null;
    delivery_status?: string;
  } = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.payment_status) updateData.payment_status = updates.payment_status;
  if (Object.hasOwn(updates, "rider_employee_id")) {
    updateData.rider_employee_id = updates.rider_employee_id ?? null;
    if (updates.rider_employee_id && order.delivery_status === "Not Started") {
      updateData.delivery_status = "Rider Assigned";
    }
  }
  if (updates.delivery_status) {
    updateData.delivery_status = updates.delivery_status;
    if (updates.delivery_status === "Delivered") updateData.status = "Completed";
  }
  const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function createAdminOrderAction(input: {
  customerId?: string;
  newCustomer?: { fullName: string; phone: string; email?: string; address?: string };
  businessId: string;
  storeBranchId?: string;
  fulfillmentMethod: "Pickup" | "Delivery";
  deliveryAddress?: string;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  notes?: string;
  items: Array<{ catalogItemId: string; quantity: number }>;
}): Promise<{ success: boolean; error?: string; orderId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isOrdersAdministrator(supabase, user.id))) {
    return { success: false, error: "You do not have permission to create orders." };
  }
  if ((!input.customerId && !input.newCustomer) || !input.businessId || !["Pickup", "Delivery"].includes(input.fulfillmentMethod)) {
    return { success: false, error: "Choose or enter a customer, business, and fulfillment method." };
  }
  if (input.customerId && input.newCustomer) return { success: false, error: "Choose either an existing customer or a new customer." };
  if (input.newCustomer && (!input.newCustomer.fullName.trim() || !input.newCustomer.phone.trim())) return { success: false, error: "Enter the new customer’s name and phone number." };
  if (!Array.isArray(input.items) || input.items.length === 0) return { success: false, error: "Add at least one item." };
  const lat = input.deliveryLatitude;
  const lng = input.deliveryLongitude;
  const hasPin = typeof lat === "number" && Number.isFinite(lat) && typeof lng === "number" && Number.isFinite(lng);
  if ((lat != null || lng != null) && !hasPin) return { success: false, error: "The delivery pin needs both valid coordinates." };
  if (hasPin && (lat! < -90 || lat! > 90 || lng! < -180 || lng! > 180)) return { success: false, error: "The delivery pin is invalid." };
  if (input.fulfillmentMethod === "Delivery" && !input.deliveryAddress?.trim() && !hasPin) {
    return { success: false, error: "Enter a delivery address or pin the customer location." };
  }

  const quantities = new Map<string, number>();
  for (const item of input.items) {
    if (!item.catalogItemId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
      return { success: false, error: "Check the selected items and quantities." };
    }
    quantities.set(item.catalogItemId, (quantities.get(item.catalogItemId) ?? 0) + item.quantity);
  }
  const [{ data: existingCustomer, error: customerError }, { data: business, error: businessError }, { data: catalog, error: catalogError }] = await Promise.all([
    input.customerId ? supabase.from("customers").select("id").eq("id", input.customerId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabase.from("businesses").select("id, active").eq("id", input.businessId).maybeSingle(),
    supabase.from("enterprise_catalog").select("id, business_id, name, item_type, base_price, status").in("id", [...quantities.keys()]),
  ]);
  if (input.customerId && (customerError || !existingCustomer)) return { success: false, error: "The selected customer could not be found." };
  if (businessError || !business?.active) return { success: false, error: "The selected business is unavailable." };
  if (catalogError || !catalog || catalog.length !== quantities.size) return { success: false, error: "One or more selected items could not be found." };
  const orderableTypes = new Set(["", "product", "goods", "item", "order", "retail"]);
  if (catalog.some((item) => item.business_id !== input.businessId || !orderableTypes.has((item.item_type ?? "").trim().toLowerCase()) || ["inactive", "disabled", "ended", "archived", "deleted"].includes((item.status ?? "").trim().toLowerCase()))) {
    return { success: false, error: "Choose active orderable items from the selected business." };
  }
  const { data: store } = input.storeBranchId
    ? await supabase.from("branches").select("id, business_id").eq("id", input.storeBranchId).eq("active", true).maybeSingle()
    : await supabase.from("branches").select("id, business_id").eq("business_id", input.businessId).eq("active", true).order("name").limit(1).maybeSingle();
  if (input.storeBranchId && !store) return { success: false, error: "The selected store could not be found or is inactive." };
  if (store && store.business_id !== input.businessId) return { success: false, error: "Choose a store that belongs to the selected business." };
  const orderItems = catalog.map((item) => {
    const unitPrice = Number(item.base_price ?? 0);
    const quantity = quantities.get(item.id) ?? 0;
    return { catalog_item_id: item.id, quantity, unit_price: unitPrice, total_price: Number((unitPrice * quantity).toFixed(2)) };
  });
  if (orderItems.some((item) => !Number.isFinite(item.unit_price) || item.unit_price < 0)) return { success: false, error: "An item has an invalid price." };
  const subtotal = Number(orderItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2));
  let customerId = input.customerId;
  let createdCustomerId: string | null = null;
  if (input.newCustomer) {
    const { data: createdCustomer, error: createCustomerError } = await supabase.from("customers").insert({
      business_id: input.businessId,
      full_name: input.newCustomer.fullName.trim(),
      phone: input.newCustomer.phone.trim(),
      email: input.newCustomer.email?.trim() || null,
      address: input.newCustomer.address?.trim() || null,
      is_active: true,
      status: "Active",
    }).select("id").single();
    if (createCustomerError || !createdCustomer) return { success: false, error: createCustomerError?.message || "Could not create the customer." };
    customerId = createdCustomer.id;
    createdCustomerId = createdCustomer.id;
  }
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    business_id: input.businessId,
    store_branch_id: store?.id ?? null,
    customer_id: customerId,
    status: "Pending",
    payment_status: "Pending",
    fulfillment_method: input.fulfillmentMethod,
    delivery_address: input.fulfillmentMethod === "Delivery" ? input.deliveryAddress?.trim() || (hasPin ? `Pinned location: ${lat!.toFixed(6)}, ${lng!.toFixed(6)}` : null) : null,
    delivery_latitude: input.fulfillmentMethod === "Delivery" && hasPin ? lat : null,
    delivery_longitude: input.fulfillmentMethod === "Delivery" && hasPin ? lng : null,
    notes: input.notes?.trim() || null,
    subtotal,
    total_amount: subtotal,
  }).select("id").single();
  if (orderError || !order) {
    if (createdCustomerId) await supabase.from("customers").delete().eq("id", createdCustomerId);
    return { success: false, error: orderError?.message || "Could not create the order." };
  }
  const { error: itemsError } = await supabase.from("order_items").insert(orderItems.map((item) => ({ ...item, order_id: order.id })));
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    if (createdCustomerId) await supabase.from("customers").delete().eq("id", createdCustomerId);
    return { success: false, error: `Order items could not be saved: ${itemsError.message}` };
  }
  return { success: true, orderId: order.id };
}

export async function updateAssignedRiderOrderAction(
  orderId: string,
  status: "Preparing" | "Ready" | "Out for Delivery" | "Delivered" | null,
  latitude?: number,
  longitude?: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Please sign in to update this delivery." };

  const { error } = await supabase.rpc("update_assigned_order_delivery", {
    p_order_id: orderId,
    p_status: status,
    p_latitude: latitude ?? null,
    p_longitude: longitude ?? null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
