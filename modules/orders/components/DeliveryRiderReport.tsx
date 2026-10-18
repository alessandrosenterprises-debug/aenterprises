"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Bike, CalendarDays, CheckCircle2, ChevronRight, Clock3, MessageSquareText, PackageCheck, Star, Truck, UserRound } from "lucide-react";
import type { DeliveryReportOrder } from "@/modules/orders/services/delivery-report.service";

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateText(value: string) {
  return new Date(value).toLocaleDateString("en-ZM", { day: "2-digit", month: "short", year: "numeric" });
}

function money(value: number | string | null) {
  return `ZMW ${Number(value ?? 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isDelivered(order: DeliveryReportOrder) {
  return order.delivery_status === "Delivered" || order.status === "Completed";
}

export default function DeliveryRiderReport({ orders }: { orders: DeliveryReportOrder[] }) {
  const today = localDate(new Date());
  const [fromDate, setFromDate] = useState(`${today.slice(0, 7)}-01`);
  const [toDate, setToDate] = useState(today);
  const filtered = useMemo(() => orders.filter((order) => {
    const date = order.created_at.slice(0, 10);
    return date >= fromDate && date <= toDate;
  }), [orders, fromDate, toDate]);
  const delivered = filtered.filter(isDelivered);
  const active = filtered.filter((order) => !isDelivered(order) && order.delivery_status !== "Delivery Failed" && order.status !== "Cancelled");
  const failed = filtered.filter((order) => order.delivery_status === "Delivery Failed" || order.status === "Cancelled");
  const ratings = delivered.filter((order) => order.delivery_rating !== null);
  const averageRating = ratings.length ? ratings.reduce((sum, order) => sum + Number(order.delivery_rating), 0) / ratings.length : 0;

  const riderRows = useMemo(() => {
    const riders = new Map<string, { id: string; name: string; phone: string | null; deliveries: number; delivered: number; failed: number; ratingsTotal: number; ratingsCount: number; paidRevenue: number }>();
    filtered.forEach((order) => {
      const key = order.rider_employee_id ?? "unassigned";
      const current = riders.get(key) ?? { id: key, name: order.rider?.full_name || (key === "unassigned" ? "Unassigned" : "Unknown rider"), phone: order.rider?.phone ?? null, deliveries: 0, delivered: 0, failed: 0, ratingsTotal: 0, ratingsCount: 0, paidRevenue: 0 };
      current.deliveries += 1;
      if (isDelivered(order)) current.delivered += 1;
      if (order.delivery_status === "Delivery Failed" || order.status === "Cancelled") current.failed += 1;
      if (order.delivery_rating !== null && isDelivered(order)) { current.ratingsTotal += Number(order.delivery_rating); current.ratingsCount += 1; }
      if (order.payment_status.toLowerCase() === "paid") current.paidRevenue += Number(order.total_amount ?? 0);
      riders.set(key, current);
    });
    return Array.from(riders.values()).sort((a, b) => b.delivered - a.delivered || a.name.localeCompare(b.name));
  }, [filtered]);

  const stats = [
    { title: "Delivery requests", value: filtered.length, icon: Truck, tone: "text-blue-700 bg-blue-50" },
    { title: "Delivered", value: delivered.length, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" },
    { title: "In progress", value: active.length, icon: Clock3, tone: "text-amber-700 bg-amber-50" },
    { title: "Failed / cancelled", value: failed.length, icon: PackageCheck, tone: "text-rose-700 bg-rose-50" },
    { title: "Customer rating", value: ratings.length ? `${averageRating.toFixed(1)} / 5` : "—", icon: Star, tone: "text-[#9A7412] bg-amber-50" },
  ];

  return <div className="space-y-5">
    <header className="flex flex-col gap-5 rounded-2xl bg-[#03162F] p-5 text-white shadow-sm lg:flex-row lg:items-center lg:justify-between sm:p-7">
      <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]"><BarChart3 className="h-4 w-4" />Delivery operations</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Delivery &amp; Rider Performance</h1><p className="mt-1 text-sm text-slate-300">Track delivery outcomes, rider workloads, customer ratings and paid delivery revenue.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/dashboard/orders" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10"><Truck className="h-4 w-4" />Orders</Link><Link href="/dashboard/orders/reviews" className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-3 py-2 text-sm font-bold text-[#03162F] hover:bg-[#e4c75c]"><MessageSquareText className="h-4 w-4" />Customer reviews</Link></div>
    </header>

    <section className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mr-auto flex items-center gap-2 text-sm font-semibold text-[#03162F]"><CalendarDays className="h-4 w-4 text-[#9A7412]" />Report date range</div>
      <label className="text-xs font-semibold text-slate-600">From<input type="date" value={fromDate} max={toDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800" /></label>
      <label className="text-xs font-semibold text-slate-600">To<input type="date" value={toDate} min={fromDate} max={today} onChange={(event) => setToDate(event.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800" /></label>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{stats.map((stat) => { const Icon = stat.icon; return <article key={stat.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{stat.title}</span><span className={`rounded-lg p-2 ${stat.tone}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-2xl font-black tabular-nums text-[#03162F]">{stat.value}</p></article>; })}</section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-[#03162F]">Rider performance</h2><p className="mt-1 text-sm text-slate-500">Completed jobs, failures, customer ratings and paid revenue by assigned rider.</p></div>
      {riderRows.length === 0 ? <Empty message="No delivery activity was recorded in this period." /> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Rider", "Assigned", "Delivered", "Failed", "Average rating", "Paid revenue"].map((label) => <th key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{riderRows.map((rider) => <tr key={rider.id} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="px-5 py-4"><span className="flex items-center gap-2 font-semibold text-[#03162F]"><span className="rounded-lg bg-slate-100 p-2"><UserRound className="h-4 w-4" /></span><span>{rider.name}{rider.phone && <span className="block text-xs font-normal text-slate-500">{rider.phone}</span>}</span></span></td><td className="px-5 py-4">{rider.deliveries}</td><td className="px-5 py-4 font-semibold text-emerald-700">{rider.delivered}</td><td className="px-5 py-4 text-rose-700">{rider.failed}</td><td className="px-5 py-4">{rider.ratingsCount ? <span className="inline-flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-amber-400 text-amber-500" />{(rider.ratingsTotal / rider.ratingsCount).toFixed(1)} <span className="font-normal text-slate-400">({rider.ratingsCount})</span></span> : <span className="text-slate-400">No ratings</span>}</td><td className="px-5 py-4 font-semibold">{money(rider.paidRevenue)}</td></tr>)}</tbody></table></div>}
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-[#03162F]">Delivery history</h2><p className="mt-1 text-sm text-slate-500">Order-level delivery details for the selected period.</p></div>
      {filtered.length === 0 ? <Empty message="No delivery orders match this date range." /> : <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Order", "Date", "Customer", "Business", "Rider", "Status", "Rating", "Amount"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{filtered.map((order) => <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="px-4 py-3 font-mono font-semibold">#{order.id.slice(0, 8).toUpperCase()}</td><td className="px-4 py-3">{dateText(order.created_at)}</td><td className="px-4 py-3">{order.customers?.full_name || "Walk-in"}</td><td className="px-4 py-3">{order.businesses?.name ?? "—"}</td><td className="px-4 py-3">{order.rider?.full_name ?? <span className="text-slate-400">Unassigned</span>}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{order.delivery_status || order.status}</span></td><td className="px-4 py-3">{order.delivery_rating ? <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />{order.delivery_rating}</span> : "—"}</td><td className="px-4 py-3 text-right font-semibold">{money(order.total_amount)}</td></tr>)}</tbody></table></div>}
      {filtered.length > 0 && <Link href="/dashboard/orders/reviews" className="flex items-center justify-end gap-1 border-t border-slate-100 px-5 py-3 text-sm font-semibold text-[#0A2852] hover:bg-slate-50">View order reviews <ChevronRight className="h-4 w-4" /></Link>}
    </section>
  </div>;
}

function Empty({ message }: { message: string }) { return <div className="px-6 py-12 text-center"><Bike className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm text-slate-500">{message}</p></div>; }
