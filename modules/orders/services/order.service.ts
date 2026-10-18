import { createClient } from "@/lib/supabase/server";

export interface DeliveryPricingSettings {
  pricing_mode: "per_km" | "per_area";
  base_fee: number;
  rate_per_km: number;
  minimum_fee: number;
  road_distance_factor: number;
  area_rates: Record<string, number>;
}

export async function getDeliveryPricingSettings(): Promise<DeliveryPricingSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("delivery_pricing_settings")
    .select("pricing_mode, base_fee, rate_per_km, minimum_fee, road_distance_factor, area_rates")
    .eq("id", "default").maybeSingle();
  const rawRates = data?.area_rates;
  const areaRates = rawRates && typeof rawRates === "object" && !Array.isArray(rawRates)
    ? Object.fromEntries(Object.entries(rawRates).map(([area, rate]) => [area, Number(rate)]).filter(([, rate]) => Number.isFinite(rate)))
    : {};
  return {
    pricing_mode: data?.pricing_mode === "per_area" ? "per_area" : "per_km",
    base_fee: Number(data?.base_fee ?? 0),
    rate_per_km: Number(data?.rate_per_km ?? 0),
    minimum_fee: Number(data?.minimum_fee ?? 0),
    road_distance_factor: Number(data?.road_distance_factor ?? 1.25),
    area_rates: areaRates,
  };
}

export interface ManagedOrder {
  id: string;
  business_id: string;
  store_branch_id: string | null;
  customer_id: string;
  status: string;
  payment_status: string;
  fulfillment_method: string;
  pickup_address: string | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  pickup_contact_name: string | null;
  pickup_contact_phone: string | null;
  delivery_contact_name: string | null;
  delivery_contact_phone: string | null;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_status: string;
  rider_employee_id: string | null;
  rider_latitude: number | null;
  rider_longitude: number | null;
  rider_location_updated_at: string | null;
  notes: string | null;
  subtotal: number;
  total_amount: number;
  created_at: string;
  businesses: { id: string; name: string; slug?: string | null } | null;
  store: { id: string; name: string; address: string | null; city: string | null; latitude: number | null; longitude: number | null } | null;
  customers: { id: string; full_name: string; phone: string | null; email: string | null } | null;
  rider: { id: string; full_name: string; phone: string | null; position: string } | null;
  order_items: Array<{
    id: string;
    catalog_item_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    enterprise_catalog: { id: string; name: string } | null;
  }>;
}

export interface DeliveryRider {
  id: string;
  full_name: string;
  phone: string | null;
  position: string;
  business_id: string | null;
  user_id: string | null;
}

export interface RiderDeliveryOrder {
  id: string;
  business_id: string;
  status: string;
  fulfillment_method: string;
  pickup_address: string | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  pickup_contact_name: string | null;
  pickup_contact_phone: string | null;
  delivery_address: string | null;
  delivery_contact_name: string | null;
  delivery_contact_phone: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_status: string;
  rider_latitude: number | null;
  rider_longitude: number | null;
  rider_location_updated_at: string | null;
  notes: string | null;
  total_amount: number;
  created_at: string;
  businesses: { name: string } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    enterprise_catalog: { name: string } | null;
  }>;
}

export interface RiderAccountOption {
  auth_user_id: string;
  display_name: string;
  email: string;
}

export async function getRiderAccountOptions(): Promise<RiderAccountOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_rider_account_options");
  if (error) {
    console.error("Unable to load available rider accounts:", error.message);
    return [];
  }
  return (data ?? []) as RiderAccountOption[];
}

export async function getRiderDeliveryOrders(userId: string): Promise<RiderDeliveryOrder[]> {
  const supabase = await createClient();
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, position, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (employeeError || !employee || !/rider|driver|delivery/i.test(employee.position ?? "")) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, business_id, status, fulfillment_method, pickup_address, pickup_latitude, pickup_longitude,
      pickup_contact_name, pickup_contact_phone, delivery_address, delivery_contact_name, delivery_contact_phone,
      delivery_latitude, delivery_longitude, delivery_status,
      rider_latitude, rider_longitude, rider_location_updated_at, notes,
      total_amount, created_at, businesses(name),
      order_items(id, quantity, enterprise_catalog(name))
    `)
    .eq("rider_employee_id", employee.id)
    .eq("fulfillment_method", "Delivery")
    .not("delivery_status", "in", '("Delivered","Delivery Failed")')
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to load your deliveries: ${error.message}`);
  return (data ?? []) as unknown as RiderDeliveryOrder[];
}

export async function getDeliveryRiders(): Promise<DeliveryRider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, full_name, phone, position, business_id, user_id, is_active")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw new Error(`Unable to load delivery riders: ${error.message}`);
  return (data ?? [])
    .filter((employee) => /rider|driver|delivery/i.test(employee.position ?? ""))
    .map((employee) => ({
      id: employee.id,
      full_name: employee.full_name,
      phone: employee.phone ?? null,
      position: employee.position ?? "Delivery Rider",
      business_id: employee.business_id ?? null,
      user_id: employee.user_id ?? null,
    }));
}

export async function isOrdersAdministrator(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  void userId;
  const { data } = await supabase.rpc("has_permission", { required_permission: "orders.view" });
  return data === true;
}

export async function canManageOrders(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.rpc("has_permission", { required_permission: "orders.manage" });
  return data === true;
}

export async function canManageDeliveryPricing(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.rpc("has_permission", { required_permission: "deliveries.manage" });
  return data === true;
}

export async function canManageDeliveryRiders(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  void userId;
  const { data } = await supabase.rpc("has_permission", { required_permission: "deliveries.manage" });
  if (data === true) return true;
  const { data: employeeManagement } = await supabase.rpc("has_permission", { required_permission: "employees.manage" });
  if (employeeManagement === true) return true;
  const { data: hrManagement } = await supabase.rpc("has_permission", { required_permission: "hr.manage" });
  return hrManagement === true;
}

export async function getManagedOrders(): Promise<ManagedOrder[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isOrdersAdministrator(supabase, user.id))) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, business_id, customer_id, status, payment_status, fulfillment_method,
      pickup_address, pickup_latitude, pickup_longitude, pickup_contact_name, pickup_contact_phone,
      delivery_contact_name, delivery_contact_phone,
      delivery_address, delivery_latitude, delivery_longitude, delivery_status, rider_employee_id,
      rider_latitude, rider_longitude, rider_location_updated_at, notes, subtotal, total_amount, created_at,
      businesses(id, name, slug),
      customers(id, full_name, phone, email),
      rider:employees!orders_rider_employee_id_fkey(id, full_name, phone, position),
      order_items(id, catalog_item_id, quantity, unit_price, total_price,
        enterprise_catalog(id, name))
    `)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load customer orders: ${error.message}`);

  const orders = (data ?? []).map((order) => ({ ...order, store_branch_id: null, store: null })) as unknown as ManagedOrder[];
  const businessIds = [...new Set(orders.map((order) => order.business_id).filter(Boolean))];
  if (businessIds.length === 0) return orders;

  const { data: stores, error: storesError } = await supabase
    .from("branches")
    .select("id, name, business_id")
    .in("business_id", businessIds)
    .order("name");
  if (storesError) throw new Error(`Unable to load order stores: ${storesError.message}`);

  const storesByBusiness = new Map<string, NonNullable<ManagedOrder["store"]>>();
  for (const store of stores ?? []) {
    if (!storesByBusiness.has(store.business_id)) {
      storesByBusiness.set(store.business_id, {
        id: store.id,
        name: store.name,
        address: null,
        city: null,
        latitude: null,
        longitude: null,
      });
    }
  }
  return orders.map((order) => ({ ...order, store: storesByBusiness.get(order.business_id) ?? null }));
}
