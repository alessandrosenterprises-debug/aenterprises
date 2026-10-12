"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Truck } from "lucide-react";
import type { ManagedOrder } from "../services/order.service";
import { updateOrderAction } from "../services/order.actions";

const ORDER_STATUSES = ["Pending", "Confirmed", "Processing", "Ready", "Completed", "Cancelled"];
const PAYMENT_STATUSES = ["Pending", "Partial", "Paid", "Refunded"];
const money = (amount: number) => `ZMW ${Number(amount || 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrdersManager({ orders }: { orders: ManagedOrder[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "All statuses" || order.status === statusFilter;
      const matchesSearch = !query || [order.id, order.customers?.full_name, order.customers?.phone, order.businesses?.name, ...order.order_items.map((item) => item.enterprise_catalog?.name)].some((value) => value?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  function update(orderId: string, updates: { status?: string; payment_status?: string }) {
    setMessage("");
    startTransition(async () => {
      const result = await updateOrderAction(orderId, updates);
      if (!result.success) {
        setMessage(result.error || "Could not update this order.");
        return;
      }
      setMessage("Order updated.");
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, business, item or order ID" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#D4AF37]" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
          <option>All statuses</option>{ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>
      {message && <p role="status" className="border-b border-slate-100 px-4 py-2 text-sm text-[#03162F]">{message}</p>}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center"><ShoppingBag className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 font-bold text-[#03162F]">No customer orders found</h2><p className="mt-1 text-sm text-slate-500">Orders placed through the customer interface will appear here.</p></div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredOrders.map((order) => (
            <article key={order.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(220px,1fr)] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-[#03162F]">{order.customers?.full_name || "Customer"}</h2><span className="font-mono text-[11px] text-slate-400">{order.id.slice(0, 8).toUpperCase()}</span></div>
                <p className="mt-1 text-xs text-slate-500">{order.businesses?.name || "Business"} · {new Date(order.created_at).toLocaleString("en-ZM")}</p>
                <p className="mt-2 text-sm text-slate-600">{order.order_items.map((item) => `${item.quantity} × ${item.enterprise_catalog?.name || "Item"}`).join(", ")}</p>
                {order.customers?.phone && <p className="mt-1 text-xs text-slate-500">{order.customers.phone}</p>}
              </div>
              <div><p className="font-bold text-[#03162F]">{money(order.total_amount)}</p><p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500"><Truck className="h-3.5 w-3.5" />{order.fulfillment_method}{order.delivery_address ? ` · ${order.delivery_address}` : ""}</p></div>
              <label className="text-xs font-semibold text-slate-500">Order status<select disabled={isPending} value={order.status} onChange={(event) => update(order.id, { status: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-semibold text-[#03162F] disabled:opacity-60">{ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="text-xs font-semibold text-slate-500">Payment<select disabled={isPending} value={order.payment_status} onChange={(event) => update(order.id, { payment_status: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-semibold text-[#03162F] disabled:opacity-60">{PAYMENT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
