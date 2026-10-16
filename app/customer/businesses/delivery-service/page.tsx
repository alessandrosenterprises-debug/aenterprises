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

  return <DeliveryServiceRequestForm customerName={customer?.full_name ?? ""} customerPhone={customer?.phone ?? ""} pricing={pricing} />;
}
