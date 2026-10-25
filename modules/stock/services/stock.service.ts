import { createOperationsAwareServerClient } from "@/lib/supabase/operations-aware-server";

export type StockTab = "inventory" | "movements" | "purchases" | "counts" | "reports";
export type StockRecord = Record<string, unknown>;
export interface StockWorkspaceData {
  businesses: StockRecord[];
  locations: StockRecord[];
  items: StockRecord[];
  balances: StockRecord[];
  movements: StockRecord[];
  suppliers: StockRecord[];
  purchaseOrders: StockRecord[];
  purchaseLines: StockRecord[];
  counts: StockRecord[];
  countLines: StockRecord[];
  permissions: { manage: boolean; purchase: boolean; count: boolean };
}

export async function getStockWorkspaceData(): Promise<StockWorkspaceData> {
  const supabase = await createOperationsAwareServerClient();
  const [{ data: effectiveProfiles, error: profileError }, { data: canView }, { data: canManage }, { data: canPurchase }, { data: canCount }] = await Promise.all([
    supabase.rpc("get_effective_profile"),
    supabase.rpc("has_permission", { required_permission: "stock.view" }),
    supabase.rpc("has_permission", { required_permission: "stock.manage" }),
    supabase.rpc("has_permission", { required_permission: "stock.purchase" }),
    supabase.rpc("has_permission", { required_permission: "stock.count" }),
  ]);
  if (profileError || !effectiveProfiles?.length) throw new Error("Sign in through an active AEOS manager session to open Stock Management.");
  if (!canView && !canManage && !canPurchase && !canCount) throw new Error("Your staff role does not have permission to open Stock Management.");

  const [businessesResult, locationsResult, settingsResult, catalogResult, balancesResult, movementsResult, suppliersResult, purchaseOrdersResult, purchaseLinesResult, countsResult, countLinesResult] = await Promise.all([
    supabase.from("businesses").select("id,name,slug,active").order("name"),
    supabase.from("stock_locations").select("id,business_id,branch_id,name,location_type,active").eq("active", true).order("name"),
    supabase.from("stock_item_settings").select("id,catalog_item_id,business_id,sku,barcode,unit_cost,reorder_level,warranty_months,tracks_serial_numbers,tracking_enabled,notes"),
    supabase.from("enterprise_catalog").select("id,business_id,name,item_type,category,base_price,quantity,status,attributes").order("name"),
    supabase.from("stock_balances").select("id,business_id,location_id,catalog_item_id,quantity_on_hand,quantity_reserved,updated_at"),
    supabase.from("stock_movements").select("id,business_id,catalog_item_id,movement_type,quantity,from_location_id,to_location_id,unit_cost,reference_number,source_type,source_id,reason,notes,created_by,created_at").order("created_at", { ascending: false }).limit(250),
    supabase.from("stock_suppliers").select("id,business_id,name,contact_name,phone,email,active,created_at").order("name"),
    supabase.from("stock_purchase_orders").select("id,business_id,supplier_id,destination_location_id,purchase_order_number,status,expected_at,subtotal,notes,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("stock_purchase_order_lines").select("id,purchase_order_id,catalog_item_id,quantity_ordered,quantity_received,unit_cost").order("created_at"),
    supabase.from("stock_counts").select("id,business_id,location_id,count_number,status,notes,created_by,submitted_at,approved_at,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("stock_count_lines").select("id,stock_count_id,catalog_item_id,system_quantity,counted_quantity,variance,notes").order("id"),
  ]);
  const failure = [businessesResult, locationsResult, settingsResult, catalogResult, balancesResult, movementsResult, suppliersResult, purchaseOrdersResult, purchaseLinesResult, countsResult, countLinesResult].find((result) => result.error);
  if (failure?.error) {
    if (["42P01", "PGRST200", "PGRST204", "42703"].includes(failure.error.code ?? "")) throw new Error("Stock Management needs database migration 052. Apply supabase/migrations/052_branch_stock_management.sql and refresh.");
    throw new Error(`Stock data could not be loaded: ${failure.error.message}`);
  }
  const settings = (settingsResult.data ?? []) as StockRecord[];
  const itemSettings = new Map(settings.map((row) => [String(row.catalog_item_id), row]));
  const productTypes = new Set(["product", "goods", "item", "retail"]);
  const items = ((catalogResult.data ?? []) as StockRecord[])
    .filter((row) => productTypes.has(String(row.item_type ?? "").trim().toLowerCase()))
    .map((row) => ({ ...row, stock: itemSettings.get(String(row.id)) ?? null }));

  return {
    businesses: (businessesResult.data ?? []) as StockRecord[],
    locations: (locationsResult.data ?? []) as StockRecord[],
    items,
    balances: (balancesResult.data ?? []) as StockRecord[],
    movements: (movementsResult.data ?? []) as StockRecord[],
    suppliers: (suppliersResult.data ?? []) as StockRecord[],
    purchaseOrders: (purchaseOrdersResult.data ?? []) as StockRecord[],
    purchaseLines: (purchaseLinesResult.data ?? []) as StockRecord[],
    counts: (countsResult.data ?? []) as StockRecord[],
    countLines: (countLinesResult.data ?? []) as StockRecord[],
    permissions: { manage: Boolean(canManage), purchase: Boolean(canPurchase), count: Boolean(canCount) },
  };
}
