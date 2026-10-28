import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, BarChart3, Bike, CheckCircle2, Clock3, MapPin, MessageSquareText, PackageCheck, ShoppingBag, Wallet, WalletCards } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDeliveryRiders, getManagedOrders } from "@/modules/orders/services/order.service";
import OrdersManager from "@/modules/orders/components/OrdersManager";

export const dynamic = "force-dynamic";

async function getAllOrderCustomers(supabase: Awaited<ReturnType<typeof createClient>>) {
  const pageSize = 1000;
  const customers = [] as { id: string; full_name: string | null; phone: string | null; address: string | null }[];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("customers").select("id, full_name, phone, address").order("full_name").range(offset, offset + pageSize - 1);
    if (error) {
      console.error("Unable to load customers for admin order creation:", error.message);
      break;
    }
    customers.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return customers;
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: canViewOrders } = await supabase.rpc("has_permission", { required_permission: "orders.view" });
  if (!canViewOrders) redirect("/dashboard/access-denied");

  const [orders, riders, customers, businessesResult, catalogResult, storesResult] = await Promise.all([
    getManagedOrders(), getDeliveryRiders(), getAllOrderCustomers(supabase),
    supabase.from("businesses").select("id, name").eq("active", true).order("name"),
    supabase.from("enterprise_catalog").select("id, name, business_id, item_type, base_price, status").order("name"),
    supabase.from("branches").select("id, name, business_id, address, city, latitude, longitude").eq("active", true).order("name"),
  ]);
  const businesses = businessesResult.data ?? [];
  const stores = storesResult.data ?? [];
  const catalog = (catalogResult.data ?? []).filter((item) => {
    const type = (item.item_type ?? "").trim().toLowerCase();
    return ["", "product", "goods", "item", "order", "retail"].includes(type)
      && !["inactive", "disabled", "ended", "archived", "deleted"].includes((item.status ?? "").trim().toLowerCase());
  });
  const stats = [
    { label: "New orders", value: orders.filter((order) => order.status === "Pending" && (order.fulfillment_method !== "Delivery" || !order.rider_employee_id)).length, hint: "Awaiting assignment", icon: ShoppingBag, color: "border-amber-200 bg-amber-50 text-amber-800" },
    { label: "Assigned", value: orders.filter((order) => order.fulfillment_method === "Delivery" && Boolean(order.rider_employee_id) && !["Processing", "Ready", "Completed", "Cancelled"].includes(order.status) && !["Picked Up", "Out for Delivery", "Delivered", "Delivery Failed"].includes(order.delivery_status || "")).length, hint: "With a rider", icon: Bike, color: "border-blue-200 bg-blue-50 text-blue-800" },
    { label: "Preparing", value: orders.filter((order) => order.status === "Processing" || (order.fulfillment_method === "Delivery" && ["Ready", "Preparing"].includes(order.delivery_status || ""))).length, hint: "Being prepared", icon: Clock3, color: "border-violet-200 bg-violet-50 text-violet-800" },
    { label: "En route", value: orders.filter((order) => ["Picked Up", "Out for Delivery"].includes(order.delivery_status || "")).length, hint: "Live deliveries", icon: MapPin, color: "border-cyan-200 bg-cyan-50 text-cyan-800" },
    { label: "Delivered", value: orders.filter((order) => order.fulfillment_method === "Delivery" && (order.delivery_status === "Delivered" || order.status === "Completed")).length, hint: "Delivery complete", icon: CheckCircle2, color: "border-emerald-200 bg-emerald-50 text-emerald-800" },
    { label: "Pickup complete", value: orders.filter((order) => order.fulfillment_method !== "Delivery" && order.status === "Completed").length, hint: "Collected in store", icon: PackageCheck, color: "border-slate-200 bg-slate-50 text-slate-700" },
  ];
  const paidRevenue = orders.filter((order) => order.payment_status === "Paid").reduce((total, order) => total + Number(order.total_amount || 0), 0);

  return <div className="space-y-5">
    <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 isolate overflow-hidden rounded-none bg-[#03162F] p-5 text-white shadow-lg sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border-[28px] border-white/[0.04]" />
      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200"><Activity className="h-3.5 w-3.5" />Live dispatch · {orders.length} orders</div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Customer Orders</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">One view for incoming orders, rider assignments, preparation, live delivery and customer locations.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/dashboard/orders/my-deliveries" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"><MapPin className="h-4 w-4" />Rider deliveries</Link><Link href="/dashboard/orders/delivery-reports" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"><BarChart3 className="h-4 w-4" />Delivery reports</Link><Link href="/dashboard/orders/reviews" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"><MessageSquareText className="h-4 w-4" />Customer reviews</Link><Link href="/dashboard/orders/delivery-pricing" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"><WalletCards className="h-4 w-4" />Delivery pricing</Link><Link href="/dashboard/hr/riders" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-extrabold text-[#03162F] transition hover:bg-[#e4c75c]"><Bike className="h-4 w-4" />Rider management</Link></div>
      </div>
      <div className="relative mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs text-slate-300"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Queue updates automatically</span><span className="inline-flex items-center gap-2"><Wallet className="h-3.5 w-3.5 text-[#D4AF37]" />Paid revenue <strong className="text-white">ZMW {paidRevenue.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span></div>
    </header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">{stats.map((stat) => { const Icon = stat.icon; return <article key={stat.label} className={`rounded-2xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${stat.color}`}><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold opacity-80">{stat.label}</p><p className="mt-2 text-3xl font-black tabular-nums">{stat.value}</p><p className="mt-1 text-[11px] opacity-70">{stat.hint}</p></div><span className="rounded-xl bg-white/75 p-2.5 shadow-sm"><Icon className="h-4 w-4" /></span></div></article>; })}</div>
    <OrdersManager orders={orders} riders={riders} customers={customers} businesses={businesses} catalog={catalog} stores={stores} />
  </div>;
}
