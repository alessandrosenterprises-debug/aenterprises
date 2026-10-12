import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, ShoppingBag, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrders } from "@/modules/orders/services/order.service";
import OrdersManager from "@/modules/orders/components/OrdersManager";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("roles(name)").eq("auth_user_id", user.id).eq("active", true).maybeSingle();
  const role = Array.isArray(profile?.roles) ? profile.roles[0] : profile?.roles;
  if (role?.name !== "Super Administrator" && role?.name !== "Enterprise Manager") redirect("/dashboard");

  const orders = await getManagedOrders();
  const stats = [
    { label: "All Orders", value: orders.length, icon: ShoppingBag, color: "bg-slate-50 text-[#03162F]" },
    { label: "Pending", value: orders.filter((order) => order.status === "Pending").length, icon: Clock3, color: "bg-amber-50 text-amber-800" },
    { label: "Completed", value: orders.filter((order) => order.status === "Completed").length, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-800" },
    { label: "Paid Revenue", value: `ZMW ${orders.filter((order) => order.payment_status === "Paid").reduce((total, order) => total + Number(order.total_amount || 0), 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wallet, color: "bg-blue-50 text-blue-800" },
  ];

  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold text-[#03162F]">Customer Orders</h1><p className="mt-1 text-slate-500">Manage orders placed from the customer interface across active businesses.</p></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => { const Icon = stat.icon; return <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-slate-500">{stat.label}</p><p className="mt-2 text-2xl font-bold text-[#03162F]">{stat.value}</p></div><span className={`rounded-xl p-3 ${stat.color}`}><Icon className="h-5 w-5" /></span></div></article>; })}</div>
    <OrdersManager orders={orders} />
  </div>;
}
