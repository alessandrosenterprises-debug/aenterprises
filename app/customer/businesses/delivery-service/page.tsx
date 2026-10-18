import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeliveryServiceRequestForm from "./DeliveryServiceRequestForm";
import { getDeliveryPricingSettings } from "@/modules/orders/services/order.service";

export const dynamic = "force-dynamic";

export default async function CustomerDeliveryServicePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/customer/login");

  const [{ data: customer }, pricing] = await Promise.all([
    supabase.from("customers").select("full_name,phone").eq("auth_user_id", user.id).maybeSingle(),
    getDeliveryPricingSettings(),
  ]);

  const { data: catalog } = await supabase.from("enterprise_catalog").select(`
    id, name, description, item_type, base_price, business_id, status, image_url,
    businesses!inner (name, active)
  `).eq("businesses.active", true).order("name", { ascending: true });
  const orderableItems = (catalog ?? []).flatMap((item) => {
    const type = item.item_type?.trim().toLowerCase();
    const business = item.businesses as unknown as { name: string; active: boolean } | null;
    const itemName = item.name.trim().toLowerCase();
    const status = item.status?.trim().toLowerCase();
    if (!business?.active || !["product", "goods", "item", "order", "retail"].includes(type ?? "")
      || business.name.toLowerCase().includes("delivery service") || itemName === "point to point delivery"
      || ["inactive", "disabled", "ended", "archived", "deleted"].includes(status ?? "")) return [];
    return [{
      id: item.id, name: item.name, description: item.description, item_type: item.item_type,
      base_price: item.base_price, business_id: item.business_id, image_url: item.image_url, business_name: business.name,
    }];
  });

  return <DeliveryServiceRequestForm customerName={customer?.full_name ?? ""} customerPhone={customer?.phone ?? ""} pricing={pricing} catalogItems={orderableItems} />;
}
