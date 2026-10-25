"use server";

import { revalidatePath } from "next/cache";
import { createOperationsAwareServerClient } from "@/lib/supabase/operations-aware-server";

async function requireStockPermission(permission: "stock.manage" | "stock.purchase" | "stock.count") {
  const supabase = await createOperationsAwareServerClient();
  const [{ data: profiles, error: profileError }, { data: allowed, error }] = await Promise.all([
    supabase.rpc("get_effective_profile"),
    supabase.rpc("has_permission", { required_permission: permission }),
  ]);
  if (profileError || !profiles?.length) throw new Error("Sign in through an active AEOS manager session first.");
  if (error || !allowed) throw new Error("Your staff role does not have permission for this stock action.");
  return supabase;
}

async function requireAnyStockPermission(permissions: Array<"stock.manage" | "stock.count">) {
  const supabase = await createOperationsAwareServerClient();
  const [{ data: profiles, error: profileError }, ...results] = await Promise.all([
    supabase.rpc("get_effective_profile"),
    ...permissions.map((permission) => supabase.rpc("has_permission", { required_permission: permission })),
  ]);
  if (profileError || !profiles?.length) throw new Error("Sign in through an active AEOS manager session first.");
  if (!results.some(({ data, error }) => !error && data)) throw new Error("Your staff role does not have permission for this stock action.");
  return supabase;
}

export async function postStockMovement(input: {
  businessId: string; itemId: string; type: string; quantity: number;
  fromLocationId?: string; toLocationId?: string; unitCost?: number;
  reference?: string; reason?: string; notes?: string;
}) {
  const supabase = await requireStockPermission("stock.manage");
  if (!input.businessId || !input.itemId || !Number.isFinite(input.quantity) || input.quantity <= 0 || input.quantity > 100000000) throw new Error("Choose a product and enter a valid quantity.");
  const { data, error } = await supabase.rpc("post_stock_movement", {
    p_business_id: input.businessId,
    p_catalog_item_id: input.itemId,
    p_movement_type: input.type,
    p_quantity: input.quantity,
    p_from_location_id: input.fromLocationId || null,
    p_to_location_id: input.toLocationId || null,
    p_unit_cost: input.unitCost ?? 0,
    p_reference_number: input.reference?.trim() || null,
    p_reason: input.reason?.trim() || null,
    p_notes: input.notes?.trim() || null,
    p_source_type: null,
    p_source_id: null,
  });
  if (error || !data) throw new Error(error?.message || "The stock movement could not be saved.");
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/catalog");
  revalidatePath("/dashboard/orders");
  return { success: true, movementId: data as string };
}

export async function updateStockItemSettings(input: {
  itemId: string; businessId: string; sku: string; barcode: string;
  unitCost: number; reorderLevel: number; warrantyMonths: number; trackingEnabled: boolean;
}) {
  const supabase = await requireStockPermission("stock.manage");
  if (!input.itemId || !input.businessId || !Number.isFinite(input.unitCost) || input.unitCost < 0 || !Number.isFinite(input.reorderLevel) || input.reorderLevel < 0 || !Number.isInteger(input.warrantyMonths) || input.warrantyMonths < 0 || input.warrantyMonths > 240) throw new Error("Check the SKU, cost, reorder level and warranty values.");
  const { error } = await supabase.from("stock_item_settings").upsert({
    catalog_item_id: input.itemId,
    business_id: input.businessId,
    sku: input.sku.trim() || null,
    barcode: input.barcode.trim() || null,
    unit_cost: input.unitCost,
    reorder_level: input.reorderLevel,
    warranty_months: input.warrantyMonths,
    tracking_enabled: input.trackingEnabled,
  }, { onConflict: "catalog_item_id" });
  if (error) throw new Error(error.code === "23505" ? "That SKU or barcode is already in use for this business." : `Product stock settings could not be saved: ${error.message}`);
  revalidatePath("/dashboard/stock");
  return { success: true };
}

export async function createStockSupplier(input: { businessId: string; name: string; contactName?: string; phone?: string; email?: string }) {
  const supabase = await requireStockPermission("stock.purchase");
  if (!input.businessId || input.name.trim().length < 2) throw new Error("Enter a valid supplier name.");
  const { error } = await supabase.from("stock_suppliers").insert({ business_id: input.businessId, name: input.name.trim(), contact_name: input.contactName?.trim() || null, phone: input.phone?.trim() || null, email: input.email?.trim() || null });
  if (error) throw new Error(`Supplier could not be saved: ${error.message}`);
  revalidatePath("/dashboard/stock");
  return { success: true };
}

export async function createStockPurchaseOrder(input: { businessId: string; supplierId: string; locationId: string; expectedAt?: string; notes?: string; lines: Array<{ itemId: string; quantity: number; unitCost: number }> }) {
  const supabase = await requireStockPermission("stock.purchase");
  if (!input.businessId || !input.supplierId || !input.locationId || input.lines.length === 0 || input.lines.some((line) => !line.itemId || !Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.unitCost) || line.unitCost < 0)) throw new Error("Complete the supplier, receiving location and valid product quantities.");
  if (new Set(input.lines.map((line) => line.itemId)).size !== input.lines.length) throw new Error("Each product can only appear once on a purchase order. Combine duplicate lines.");
  const { data, error } = await supabase.rpc("create_stock_purchase_order", {
    p_business_id: input.businessId,
    p_supplier_id: input.supplierId,
    p_destination_location_id: input.locationId,
    p_expected_at: input.expectedAt || null,
    p_notes: input.notes?.trim() || null,
    p_lines: input.lines.map((line) => ({ catalog_item_id: line.itemId, quantity_ordered: line.quantity, unit_cost: line.unitCost })),
  });
  if (error || !data) throw new Error(error?.message || "Purchase order could not be created.");
  revalidatePath("/dashboard/stock");
  return { success: true, purchaseOrderId: data as string };
}

export async function receiveStockPurchaseOrder(purchaseOrderId: string, receipts: Array<{ lineId: string; quantity: number }>) {
  const supabase = await requireStockPermission("stock.purchase");
  const validReceipts = receipts.filter((line) => line.quantity > 0);
  if (!purchaseOrderId || !validReceipts.length || validReceipts.some((line) => !Number.isFinite(line.quantity))) throw new Error("Enter at least one valid quantity received.");
  const { data, error } = await supabase.rpc("receive_stock_purchase_order", { p_purchase_order_id: purchaseOrderId, p_receipts: validReceipts.map((line) => ({ line_id: line.lineId, quantity: line.quantity })) });
  if (error || !data) throw new Error(error?.message || "The purchase receipt could not be posted.");
  revalidatePath("/dashboard/stock");
  return { success: true, status: data as string };
}

export async function startStockCount(locationId: string) {
  const supabase = await requireStockPermission("stock.count");
  const { data, error } = await supabase.rpc("start_stock_count", { p_location_id: locationId });
  if (error || !data) throw new Error(error?.message || "Stock count could not be started.");
  revalidatePath("/dashboard/stock");
  return { success: true, countId: data as string };
}

export async function saveStockCountLines(countId: string, lines: Array<{ lineId: string; countedQuantity: number; notes?: string }>) {
  const supabase = await requireStockPermission("stock.count");
  if (!countId || lines.some((line) => !Number.isFinite(line.countedQuantity) || line.countedQuantity < 0)) throw new Error("Counted quantities must be zero or greater.");
  const { error } = await supabase.rpc("save_stock_count_lines", { p_stock_count_id: countId, p_lines: lines.map((line) => ({ line_id: line.lineId, counted_quantity: line.countedQuantity, notes: line.notes?.trim() || null })) });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/stock");
  return { success: true };
}

export async function submitStockCount(countId: string) {
  const supabase = await requireStockPermission("stock.count");
  const { error } = await supabase.rpc("submit_stock_count", { p_stock_count_id: countId });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/stock");
  return { success: true };
}

export async function approveStockCount(countId: string) {
  const supabase = await requireStockPermission("stock.manage");
  const { error } = await supabase.rpc("approve_stock_count", { p_stock_count_id: countId });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/stock");
  return { success: true };
}

export async function cancelStockCount(countId: string) {
  const supabase = await requireAnyStockPermission(["stock.count", "stock.manage"]);
  const { error } = await supabase.rpc("cancel_stock_count", { p_stock_count_id: countId });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/stock");
  return { success: true };
}
