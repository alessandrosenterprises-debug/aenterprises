"use server";

import { createClient } from "@/lib/supabase/server";
import { isOrdersAdministrator, type DeliveryPricingSettings } from "./order.service";

export async function saveDeliveryPricingAction(input: DeliveryPricingSettings): Promise<{ success: boolean; error?: string }> {
  if (!Number.isFinite(input.base_fee) || input.base_fee < 0
    || !Number.isFinite(input.rate_per_km) || input.rate_per_km < 0
    || !Number.isFinite(input.minimum_fee) || input.minimum_fee < 0
    || !Number.isFinite(input.road_distance_factor) || input.road_distance_factor < 1 || input.road_distance_factor > 5
    || !["per_km", "per_area"].includes(input.pricing_mode)) {
    return { success: false, error: "Check the delivery pricing values." };
  }
  const areaRates = Object.fromEntries(Object.entries(input.area_rates)
    .map(([area, amount]) => [area.trim(), Number(amount)])
    .filter(([area, amount]) => typeof area === "string" && area.length > 0 && typeof amount === "number" && Number.isFinite(amount) && amount >= 0));
  if (input.pricing_mode === "per_area" && (Object.keys(areaRates).length === 0 || Object.keys(areaRates).length !== Object.keys(input.area_rates).length)) {
    return { success: false, error: "Add a valid price for each delivery area." };
  }
  if (input.pricing_mode === "per_km" && input.rate_per_km <= 0) return { success: false, error: "Set a per-kilometre rate greater than zero." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isOrdersAdministrator(supabase, user.id))) return { success: false, error: "You do not have permission to change delivery rates." };
  const { error } = await supabase.rpc("save_delivery_pricing_settings", {
    p_pricing_mode: input.pricing_mode,
    p_base_fee: input.base_fee,
    p_rate_per_km: input.rate_per_km,
    p_minimum_fee: input.minimum_fee,
    p_road_distance_factor: input.road_distance_factor,
    p_area_rates: areaRates,
  });
  if (error) return { success: false, error: "Delivery rates could not be saved. Check the settings and try again." };
  return { success: true };
}

export async function updateOrderAction(
  orderId: string,
  updates: {
    status?: string;
    payment_status?: string;
    rider_employee_id?: string | null;
    delivery_status?: string;
    delivery_fee?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  const validStatuses = ["Pending", "Confirmed", "Processing", "Ready", "Completed", "Cancelled"];
  const validPaymentStatuses = ["Pending", "Partial", "Paid", "Refunded"];
  const validDeliveryStatuses = ["Not Started", "Preparing", "Rider Assigned", "Picked Up", "Out for Delivery", "Delivered", "Delivery Failed"];
  if (!orderId || !Object.keys(updates).length) return { success: false, error: "Select a valid order update." };
  if (updates.status && !validStatuses.includes(updates.status)) return { success: false, error: "Invalid order status." };
  if (updates.payment_status && !validPaymentStatuses.includes(updates.payment_status)) return { success: false, error: "Invalid payment status." };
  if (updates.delivery_status && !validDeliveryStatuses.includes(updates.delivery_status)) return { success: false, error: "Invalid delivery status." };
  if (Object.hasOwn(updates, "delivery_fee") && (updates.delivery_fee === undefined || !Number.isFinite(updates.delivery_fee) || updates.delivery_fee < 0 || updates.delivery_fee > 10000000)) return { success: false, error: "Enter a valid delivery fee." };

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
  if (Object.hasOwn(updates, "delivery_fee")) {
    if (!isDelivery) return { success: false, error: "A delivery fee can only be set on a delivery request." };
    const { error: feeError } = await supabase.rpc("set_delivery_request_fee", { p_order_id: orderId, p_fee: updates.delivery_fee ?? -1 });
    if (feeError) return { success: false, error: "The delivery fee could not be saved." };
    return { success: true };
  }
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

export async function createCustomerDeliveryRequestAction(input: {
  pickupAddress: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  pickupContactName: string;
  pickupContactPhone: string;
  deliveryAddress: string;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  deliveryContactName: string;
  deliveryContactPhone: string;
  packageDescription: string;
  deliveryArea?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string; orderId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sign in to request a delivery." };

  const requiredText = [input.pickupAddress, input.pickupContactName, input.pickupContactPhone, input.deliveryAddress, input.deliveryContactName, input.deliveryContactPhone, input.packageDescription];
  if (requiredText.some((value) => !value.trim())) return { success: false, error: "Complete the collection, delivery, contact, and parcel details." };
  const validPin = (latitude: number | null, longitude: number | null) =>
    (latitude === null && longitude === null)
    || (latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180);
  if (!validPin(input.pickupLatitude, input.pickupLongitude) || !validPin(input.deliveryLatitude, input.deliveryLongitude)) {
    return { success: false, error: "Check both map pins and try again." };
  }

  const { data: orderId, error: requestError } = await supabase.rpc("create_customer_delivery_request", {
    p_pickup_address: input.pickupAddress.trim(),
    p_pickup_latitude: input.pickupLatitude,
    p_pickup_longitude: input.pickupLongitude,
    p_pickup_contact_name: input.pickupContactName.trim(),
    p_pickup_contact_phone: input.pickupContactPhone.trim(),
    p_delivery_address: input.deliveryAddress.trim(),
    p_delivery_latitude: input.deliveryLatitude,
    p_delivery_longitude: input.deliveryLongitude,
    p_delivery_contact_name: input.deliveryContactName.trim(),
    p_delivery_contact_phone: input.deliveryContactPhone.trim(),
    p_package_description: input.packageDescription.trim(),
    p_notes: input.notes?.trim() || null,
    p_delivery_area: input.deliveryArea?.trim() || null,
  });
  if (requestError || !orderId) {
    console.error("Delivery request submission failed:", requestError?.message);
    return { success: false, error: "Your delivery request couldn’t be submitted. Please try again." };
  }
  return { success: true, orderId };
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

export async function completeAssignedDeliveryWithProofAction(input: {
  orderId: string;
  receivedBy: string;
  proofNote?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!input.orderId || !input.receivedBy.trim() || (input.proofNote?.length ?? 0) > 500) {
    return { success: false, error: "Enter who received the delivery and keep the proof note under 500 characters." };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Please sign in to complete this delivery." };
  const { error } = await supabase.rpc("complete_assigned_delivery_with_proof", {
    p_order_id: input.orderId,
    p_received_by: input.receivedBy.trim(),
    p_proof_note: input.proofNote?.trim() || null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function rateCustomerDeliveryAction(input: {
  orderId: string;
  rating: number;
  review?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!input.orderId || !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5 || (input.review?.length ?? 0) > 1000) {
    return { success: false, error: "Choose a rating from one to five stars." };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sign in to rate this delivery." };
  const { error } = await supabase.rpc("rate_customer_delivery", {
    p_order_id: input.orderId,
    p_rating: input.rating,
    p_review: input.review?.trim() || null,
  });
  if (error) return { success: false, error: "Your rating could not be saved. Please try again." };
  return { success: true };
}
