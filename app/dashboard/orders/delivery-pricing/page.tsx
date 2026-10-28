import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDeliveryPricingSettings } from "@/modules/orders/services/order.service";
import DeliveryPricingManager from "@/modules/orders/components/DeliveryPricingManager";

export const dynamic = "force-dynamic";

export default async function DeliveryPricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: canManagePricing } = await supabase.rpc("has_permission", { required_permission: "deliveries.manage" });
  if (!canManagePricing) redirect("/dashboard/access-denied");

  const settings = await getDeliveryPricingSettings();
  return <div className="space-y-5">
    <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-4 rounded-none bg-[#03162F] p-5 text-white shadow-lg sm:p-7">
      <div><Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" />Customer orders</Link><div className="mt-4 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37] text-[#03162F]"><Wallet className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">AEOS Dispatch</p><h1 className="text-2xl font-black">Delivery pricing</h1></div></div></div>
    </header>
    <DeliveryPricingManager initialSettings={settings} />
  </div>;
}
