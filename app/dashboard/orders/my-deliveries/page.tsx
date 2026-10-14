import { redirect } from "next/navigation";
import { Bike, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getRiderDeliveryOrders } from "@/modules/orders/services/order.service";
import RiderDeliveriesManager from "@/modules/orders/components/RiderDeliveriesManager";

export const dynamic = "force-dynamic";

export default async function MyDeliveriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [orders, { data: rider }] = await Promise.all([
    getRiderDeliveryOrders(user.id),
    supabase.from("employees").select("id, full_name").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
  ]);
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-2xl bg-[#03162F] p-5 text-white shadow-sm sm:p-7">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]"><Bike className="h-4 w-4" />AEOS rider workspace</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-black sm:text-3xl">My Deliveries</h1><p className="mt-1 text-sm text-blue-100">Update preparation and delivery progress from your phone.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold"><Radio className="h-4 w-4 text-emerald-300" />Live customer updates</span></div>
    </header>
    <RiderDeliveriesManager orders={orders} rider={{ userId: user.id, employeeId: rider?.id ?? "", name: rider?.full_name ?? user.user_metadata?.full_name ?? "Delivery rider" }} />
  </div>;
}
