"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, MessageSquareText, Search, Star } from "lucide-react";
import type { DeliveryReportOrder } from "@/modules/orders/services/delivery-report.service";

type ReviewFilter = "all" | "reviewed" | "awaiting";

function dateText(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-ZM", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DeliveryReviewsPage({ orders }: { orders: DeliveryReportOrder[] }) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [search, setSearch] = useState("");
  const delivered = useMemo(() => orders.filter((order) => order.delivery_status === "Delivered" || order.status === "Completed"), [orders]);
  const visible = useMemo(() => delivered.filter((order) => {
    const hasReview = order.delivery_rating !== null || Boolean(order.delivery_review?.trim());
    if (filter === "reviewed" && !hasReview) return false;
    if (filter === "awaiting" && hasReview) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [order.id, order.customers?.full_name, order.customers?.phone, order.businesses?.name, order.rider?.full_name, order.delivery_review]
      .some((value) => value?.toLowerCase().includes(query));
  }), [delivered, filter, search]);

  const reviewCount = delivered.filter((order) => order.delivery_rating !== null || Boolean(order.delivery_review?.trim())).length;

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 rounded-2xl bg-[#03162F] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Customer experience · Courier orders</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Delivery reviews &amp; comments</h1><p className="mt-1 text-sm text-slate-300">Read customer feedback against each completed delivery and its assigned rider.</p></div>
      <Link href="/dashboard/orders/delivery-reports" className="inline-flex items-center gap-2 self-start rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10"><ArrowLeft className="h-4 w-4" />Delivery performance</Link>
    </header>

    <section className="grid gap-3 sm:grid-cols-3">
      <Summary label="Completed deliveries" value={delivered.length} />
      <Summary label="Reviews received" value={reviewCount} />
      <Summary label="Awaiting customer review" value={delivered.length - reviewCount} />
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">{(["all", "reviewed", "awaiting"] as ReviewFilter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold capitalize ${filter === value ? "bg-[#03162F] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{value === "all" ? `All orders (${delivered.length})` : value === "reviewed" ? `Reviewed (${reviewCount})` : `Awaiting review (${delivered.length - reviewCount})`}</button>)}</div>
        <label className="relative block lg:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, rider…" className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#D4AF37]" /></label>
      </div>
      {visible.length === 0 ? <div className="p-12 text-center"><MessageSquareText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No delivery reviews in this view</p><p className="mt-1 text-sm text-slate-500">Try another filter or wait for customers to rate a completed delivery.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Order / dates", "Customer", "Business", "Rider", "Rating", "Customer comment", "Proof of delivery"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{visible.map((order) => <tr key={order.id} className="border-t border-slate-100 align-top hover:bg-slate-50/70"><td className="px-4 py-4"><span className="font-mono font-semibold text-[#03162F]">#{order.id.slice(0, 8).toUpperCase()}</span><span className="mt-1 block text-xs text-slate-500">Delivered {dateText(order.delivery_proof_at || order.created_at)}</span>{order.delivery_rated_at && <span className="block text-xs text-slate-400">Reviewed {dateText(order.delivery_rated_at)}</span>}</td><td className="px-4 py-4 font-semibold">{order.customers?.full_name || "Walk-in"}{order.customers?.phone && <span className="mt-1 block text-xs font-normal text-slate-500">{order.customers.phone}</span>}</td><td className="px-4 py-4">{order.businesses?.name ?? "—"}</td><td className="px-4 py-4">{order.rider?.full_name ?? <span className="text-slate-400">No rider recorded</span>}{order.rider?.phone && <span className="mt-1 block text-xs text-slate-500">{order.rider.phone}</span>}</td><td className="px-4 py-4">{order.delivery_rating ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-800"><Star className="h-4 w-4 fill-amber-400 text-amber-500" />{order.delivery_rating}/5</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Not rated</span>}</td><td className="max-w-[320px] whitespace-pre-wrap px-4 py-4 text-slate-700">{order.delivery_review?.trim() || <span className="text-slate-400">No written comment</span>}</td><td className="px-4 py-4">{order.delivery_proof_received_by ? <><span className="block font-medium">{order.delivery_proof_received_by}</span>{order.delivery_proof_note && <span className="mt-1 block max-w-[200px] text-xs text-slate-500">{order.delivery_proof_note}</span>}</> : <span className="text-slate-400">No proof recorded</span>}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black tabular-nums text-[#03162F]">{value}</p></article>;
}
