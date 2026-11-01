"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Bell, Bike, CalendarDays, ClipboardList, FileText, MessageCircle, Package, Plus, RefreshCw, Users, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { cancelBooking, completeBooking, confirmBooking } from "@/modules/bookings/services/booking.client";
import { updateOrderAction } from "@/modules/orders/services/order.actions";
import type { DashboardQueuePreview, DashboardQueuePreviews, StoreStaffDashboardSummary } from "@/modules/dashboard/services/workspace.service";
import StoreManualOrderForm from "@/modules/dashboard/components/StoreManualOrderForm";

const labels: Record<string, string> = {
  orders: "Orders", bookings: "Bookings", deliveries: "Deliveries", messages: "Messages", consultations: "Consultations",
  notifications: "Notifications", customers: "Customers", reminders: "Reminders", reports: "Store reports", attendance: "Attendance",
  "staff-management": "Staff management", "cash-up": "Cash-up", stock: "Stock management", "report-submission": "Report submission",
  "leave-requests": "Leave requests", "advances-shortages": "Advances and shortages", "customer-reviews": "Customer reviews",
  "delivery-report": "Delivery and rider report", "cash-reconciliation": "Daily cash reconciliation", "invoices-quotations": "Invoices and quotations",
};
const queueFor: Record<string, keyof DashboardQueuePreviews> = {
  orders: "orders", bookings: "bookings", deliveries: "courier", messages: "messages", consultations: "consultations",
  notifications: "notifications", customers: "customers", reminders: "bookings", reports: "activity", "customer-reviews": "reviews", "delivery-report": "courier",
};
const iconFor: Record<string, typeof Package> = { orders: Package, bookings: CalendarDays, deliveries: Bike, messages: MessageCircle, consultations: MessageCircle, notifications: Bell, customers: Users, reminders: CalendarDays, stock: Package, "cash-up": Wallet, "cash-reconciliation": Wallet, "report-submission": ClipboardList, "invoices-quotations": FileText };

export default function StoreWorkspacePage({ workspace, section, previews, stats, storeName, canManage, canManageDeliveries = false, orderFormData, storeSummary }: {
  workspace: "staff" | "manager"; section: string; previews: DashboardQueuePreviews;
  stats: { incomingOrders: number; pendingBookings: number; activeDeliveries: number; pendingConsultations: number };
  storeName: string; canManage: boolean; canManageDeliveries?: boolean;
  orderFormData?: { businessId: string; branchId: string; customers: Array<{ id: string; fullName: string; phone: string; email: string | null }>; catalog: Array<{ id: string; name: string; price: number }> };
  storeSummary?: StoreStaffDashboardSummary;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(section === "orders" ? "New" : "All");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<DashboardQueuePreview | null>(null);
  const [createForm, setCreateForm] = useState<"order" | "delivery" | null>(null);
  useEffect(() => setStatus(section === "orders" ? "New" : "All"), [section]);
  const rows = useMemo(() => {
    const sourceItems = previews[queueFor[section] ?? "activity"] ?? [];
    // Delivery fulfilments are managed from the dedicated Deliveries page so
    // store orders remain a clean pickup / in-store order queue.
    const items = section === "orders"
      ? sourceItems.filter((item) => item.fulfillmentMethod?.toLowerCase() !== "delivery")
      : sourceItems;
    if (status === "All") return items;
    if (section === "orders" && status === "New") return items.filter((item) => item.status === "Pending");
    if (section === "orders" && status === "Preparing") return items.filter((item) => ["Processing", "Ready"].includes(item.status));
    return items.filter((item) => item.status.toLowerCase().includes(status.toLowerCase()));
  }, [previews, section, status]);
  const Icon = iconFor[section] ?? Activity;
  const isManager = workspace === "manager";
  const statuses = section === "deliveries" || section === "delivery-report"
    ? ["All", "New", "Assigned", "Order Preparing", "En Route", "Delivered"]
    : section === "orders" ? ["All", "New", "Accepted", "Confirmed", "Preparing", "Completed", "Cancelled", "Rejected"]
      : section === "bookings" || section === "reminders" ? ["All", "Pending", "Confirmed", "Completed", "Cancelled"] : [];

  const isTerminal = (row: DashboardQueuePreview) => ["Completed", "Cancelled", "Rejected"].includes(row.status)
    || (section === "deliveries" && row.deliveryStatus === "Delivered");

  async function updateOrder(row: DashboardQueuePreview, nextStatus: string) {
    setBusyId(row.id);
    try {
      const result = await updateOrderAction(row.id, { status: nextStatus });
      if (!result.success) throw new Error(result.error || "Order update failed.");
      toast.success(`Order ${nextStatus.toLowerCase()}.`);
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update this order."); }
    finally { setBusyId(null); }
  }

  async function updateBooking(row: DashboardQueuePreview, nextStatus: "Confirmed" | "Completed" | "Cancelled") {
    setBusyId(row.id);
    try {
      if (nextStatus === "Confirmed") await confirmBooking(row.id);
      else if (nextStatus === "Completed") await completeBooking(row.id);
      else await cancelBooking(row.id);
      toast.success(`Booking ${nextStatus.toLowerCase()}.`);
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update this booking."); }
    finally { setBusyId(null); }
  }

  return <div data-store-workspace className="min-h-full space-y-0">
    <header className="sticky top-0 z-30 -mx-6 flex min-h-[120px] items-center justify-between gap-5 bg-[#03162f] px-6 py-5 text-white shadow-md">
      <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d4af37]">{isManager ? "Manager Workspace" : "Staff Workspace"} · {storeName}</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{labels[section] ?? "Dashboard"}</h1><p className="mt-1 text-sm text-slate-300">{isManager ? "Manage this store’s " : "Work on this store’s "}{(labels[section] ?? "operations").toLowerCase()}.</p></div>
      <div className="hidden shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 sm:flex"><Icon className="h-5 w-5 text-[#e0bd39]"/><span className="text-xs font-semibold text-slate-200">Store operations</span></div>
    </header>
    {statuses.length > 0 && <div className="sticky top-[120px] z-20 -mx-6 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 shadow-sm [scrollbar-width:thin]" role="tablist" aria-label={`${labels[section]} status filters`}>
      {statuses.map((item) => {
        const allRows = previews[queueFor[section] ?? "activity"] ?? [];
        const source = section === "orders"
          ? allRows.filter((row) => row.fulfillmentMethod?.toLowerCase() !== "delivery")
          : allRows;
        const count = item === "All" ? source.length
          : section === "orders" && item === "New" ? source.filter((row) => row.status === "Pending").length
            : section === "orders" && item === "Preparing" ? source.filter((row) => ["Processing", "Ready"].includes(row.status)).length
              : source.filter((row) => row.status.toLowerCase().includes(item.toLowerCase())).length;
        return <button key={item} type="button" role="tab" aria-selected={status === item} onClick={() => setStatus(item)} className={`shrink-0 px-2.5 py-1.5 text-xs font-bold ${status === item ? "border-b-2 border-[#d4af37] text-[#03162f]" : "text-slate-600 hover:text-[#03162f]"}`}>{item}<span className="ml-1 text-[10px] text-slate-500">({count})</span></button>;
      })}
    </div>}
    <section className="space-y-4 px-0 pb-5 pt-5">
      {section === "dashboard" && <>
        <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a77d06]">{storeSummary ? "Today at your store" : "Today across operations"}</p><h2 className="mt-1 text-lg font-bold text-[#03162f]">Operational overview</h2></div><p className="text-xs text-slate-500">{new Date(`${stats.date}T12:00:00+02:00`).toLocaleDateString("en-ZM", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "New orders", value: storeSummary?.newOrders ?? stats.incomingOrders, note: "Waiting for staff action", href: "/dashboard/store/staff/orders", tone: "border-amber-200 bg-amber-50 text-amber-950", badge: "Action" },
            { label: "Orders received", value: storeSummary?.ordersToday ?? 0, note: "Pickup and in-store today", href: "/dashboard/store/staff/orders", tone: "border-blue-200 bg-blue-50 text-blue-950", badge: "Orders" },
            { label: "Successful orders", value: storeSummary?.successfulOrdersToday ?? 0, note: "Completed today", href: "/dashboard/store/staff/orders", tone: "border-emerald-200 bg-emerald-50 text-emerald-950", badge: "Done" },
            { label: "Cancelled / rejected", value: storeSummary?.cancelledOrdersToday ?? 0, note: "Closed without completion", href: "/dashboard/store/staff/orders", tone: "border-rose-200 bg-rose-50 text-rose-950", badge: "Review" },
            { label: "Order value", value: `ZMW ${(storeSummary?.orderValueToday ?? 0).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}`, note: "Requested value, including cancellations", href: "/dashboard/store/staff/orders", tone: "border-amber-200 bg-amber-50 text-amber-950", badge: "Today" },
            { label: "Bookings today", value: storeSummary?.bookingsToday ?? stats.bookingsToday, note: `${storeSummary?.pendingBookings ?? stats.pendingBookings} awaiting confirmation`, href: "/dashboard/store/staff/bookings", tone: "border-violet-200 bg-violet-50 text-violet-950", badge: "Bookings" },
            { label: "Completed bookings", value: storeSummary?.successfulBookingsToday ?? 0, note: "Appointments completed today", href: "/dashboard/store/staff/bookings", tone: "border-teal-200 bg-teal-50 text-teal-950", badge: "Done" },
            { label: "Cancelled bookings", value: storeSummary?.cancelledBookingsToday ?? 0, note: "Cancelled today", href: "/dashboard/store/staff/bookings", tone: "border-red-200 bg-red-50 text-red-950", badge: "Review" },
            { label: "Booking value", value: `ZMW ${(storeSummary?.bookingValueToday ?? 0).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}`, note: "Scheduled value today", href: "/dashboard/store/staff/bookings", tone: "border-indigo-200 bg-indigo-50 text-indigo-950", badge: "Today" },
            { label: "Active deliveries", value: storeSummary?.activeDeliveries ?? stats.activeDeliveries, note: `${storeSummary?.deliveriesToday ?? 0} received today`, href: "/dashboard/store/staff/deliveries", tone: "border-cyan-200 bg-cyan-50 text-cyan-950", badge: "Live" },
            { label: "Deliveries completed", value: storeSummary?.completedDeliveriesToday ?? 0, note: "Handed to customers today", href: "/dashboard/store/staff/deliveries", tone: "border-green-200 bg-green-50 text-green-950", badge: "Done" },
            { label: "Consultations to follow up", value: storeSummary?.pendingConsultations ?? stats.pendingConsultations, note: `${storeSummary?.consultationsToday ?? 0} received today`, href: "/dashboard/store/staff/consultations", tone: "border-orange-200 bg-orange-50 text-orange-950", badge: "Action" },
            { label: "Messages to reply", value: storeSummary?.messagesNeedingReply ?? 0, note: `${storeSummary?.messagesToday ?? 0} received · ${storeSummary?.repliedMessagesToday ?? 0} replied today`, href: "/dashboard/store/staff/messages", tone: "border-pink-200 bg-pink-50 text-pink-950", badge: "Inbox" },
            { label: "Unread notifications", value: storeSummary?.unreadNotifications ?? 0, note: "Updates for your account", href: "/dashboard/store/staff/notifications", tone: "border-sky-200 bg-sky-50 text-sky-950", badge: "New" },
          ].map((card) => <Link key={card.label} href={card.href} className={`group rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.tone}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold opacity-75">{card.label}</p><p className="mt-1 truncate text-2xl font-black tabular-nums">{card.value}</p><p className="mt-1 text-xs opacity-75">{card.note}</p></div><span className="rounded-lg border border-current/15 bg-white/65 px-2 py-1 text-[10px] font-bold uppercase">{card.badge}</span></div></Link>)}
        </div>
        {workspace === "staff" && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a77d06]">Cash collected · Today</p><h2 className="mt-1 font-bold text-[#03162f]">Cash to hand in</h2><p className="mt-1 text-xs text-slate-500">Your recorded physical cash received, less till payouts. The manager handles the cash-up.</p></div>
          {!storeSummary?.cash ? <div className="p-5 text-sm text-slate-500">Cash collected is available to staff assigned cash-handling access.</div> : !storeSummary.cash.available ? <div role="status" className="p-5 text-sm text-amber-800">Your till cash total could not be loaded.</div> : <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5"><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:col-span-3"><p className="text-xs font-semibold text-emerald-800">Cash to hand in</p><p className="mt-1 text-3xl font-black tabular-nums text-emerald-950">ZMW {storeSummary.cash.cashToHandIn.toLocaleString("en-ZM", { minimumFractionDigits: 2 })}</p><p className="mt-1 text-xs text-emerald-800">Based on {storeSummary.cash.entries} recorded physical cash transaction{storeSummary.cash.entries === 1 ? "" : "s"} today.</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Cash received</p><p className="mt-1 font-bold tabular-nums text-[#03162f]">ZMW {storeSummary.cash.received.toLocaleString("en-ZM", { minimumFractionDigits: 2 })}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Till payouts</p><p className="mt-1 font-bold tabular-nums text-[#03162f]">ZMW {storeSummary.cash.paidOut.toLocaleString("en-ZM", { minimumFractionDigits: 2 })}</p></div></div>}
        </section>}
      </>}
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#03162f]">{labels[section] ?? "Store activity"}</h2><p className="mt-1 text-sm text-slate-500">Records are limited to this store and shared with enterprise reporting.</p></div><div className="flex flex-wrap gap-2">{section === "orders" && canManage && orderFormData && <button type="button" onClick={() => setCreateForm("order")} className="inline-flex items-center gap-2 rounded-lg bg-[#03162f] px-3.5 py-2 text-sm font-bold text-white hover:bg-[#0a2b52]"><Plus className="size-4"/>New order</button>}{section === "deliveries" && canManageDeliveries && orderFormData && <button type="button" onClick={() => setCreateForm("delivery")} className="inline-flex items-center gap-2 rounded-lg bg-[#03162f] px-3.5 py-2 text-sm font-bold text-white hover:bg-[#0a2b52]"><Plus className="size-4"/>New delivery</button>}<button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#03162f] hover:bg-slate-50"><RefreshCw className="size-4"/>Refresh</button></div></div>
      {rows.length ? <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-100 text-xs font-bold text-slate-600"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">{labels[section] ?? "Activity"}</th><th className="px-4 py-3">Customer / details</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Value</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row,index)=><tr key={`${section}-${row.id}-${index}`}><td className="px-4 py-3 text-slate-500">{index+1}</td><td className="px-4 py-3"><p className="font-semibold text-[#03162f]">{row.title}</p><p className="text-[11px] text-slate-500">{new Date(row.createdAt).toLocaleDateString("en-ZM")}</p></td><td className="max-w-[320px] truncate px-4 py-3 text-slate-700">{row.detail}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{row.status}</span>{section === "deliveries" && row.deliveryStatus && <p className="mt-1 text-[11px] text-slate-500">{row.deliveryStatus}</p>}</td><td className="px-4 py-3">{row.amount === undefined ? "—" : `ZMW ${row.amount.toLocaleString("en-ZM",{minimumFractionDigits:2})}`}</td><td className="px-4 py-3 text-right"><div className="inline-flex flex-wrap justify-end gap-1.5">
        {canManage && section === "orders" && !isTerminal(row) && <>
          {row.status === "Pending" && <><button disabled={busyId === row.id} onClick={()=>void updateOrder(row,"Accepted")} className="rounded-lg bg-[#03162f] px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">Accept</button><button disabled={busyId === row.id} onClick={()=>void updateOrder(row,"Confirmed")} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">Confirm</button></>}
          {row.status === "Accepted" && <button disabled={busyId === row.id} onClick={()=>void updateOrder(row,"Confirmed")} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">Confirm</button>}
          {row.status === "Confirmed" && <button disabled={busyId === row.id} onClick={()=>void updateOrder(row,"Processing")} className="rounded-lg bg-[#03162f] px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">Start preparing</button>}
          {(["Processing","Ready"].includes(row.status) && row.fulfillmentMethod !== "Delivery") && <button disabled={busyId === row.id} onClick={()=>void updateOrder(row,"Completed")} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">Complete</button>}
          {["Pending","Accepted"].includes(row.status) && <button disabled={busyId === row.id} onClick={()=>void updateOrder(row,"Rejected")} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50">Reject</button>}
          <button disabled={busyId === row.id} onClick={()=>void updateOrder(row,"Cancelled")} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50">Cancel</button>
        </>}
        {canManage && (section === "bookings" || section === "reminders") && !isTerminal(row) && <>
          {row.status === "Pending" && <button disabled={busyId === row.id} onClick={()=>void updateBooking(row,"Confirmed")} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">Confirm</button>}
          {row.status === "Confirmed" && <button disabled={busyId === row.id} onClick={()=>void updateBooking(row,"Completed")} className="rounded-lg bg-[#03162f] px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">Complete</button>}
          {["Pending","Confirmed"].includes(row.status) && <button disabled={busyId === row.id} onClick={()=>void updateBooking(row,"Cancelled")} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50">Cancel</button>}
        </>}
        <button type="button" onClick={()=>setViewing(row)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#03162f] hover:border-[#d4af37]">View</button>
      </div></td></tr>)}</tbody></table></div></div> : <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-slate-300 bg-white px-5 text-center"><div><ClipboardList className="mx-auto size-8 text-slate-300"/><p className="mt-3 font-semibold text-[#03162f]">No {labels[section]?.toLowerCase() ?? "new activity"} yet</p><p className="mt-1 text-sm text-slate-500">New items for {storeName} will appear here.</p></div></div>}
      {isManager && ["attendance","staff-management","cash-up","stock","report-submission","leave-requests","advances-shortages","cash-reconciliation","invoices-quotations"].includes(section) && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">This workspace is store scoped. Entries made through this page use the same enterprise records and appear in the relevant central reports.</p>}
    </section>
    {viewing && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)setViewing(null);}}><section role="dialog" aria-modal="true" aria-labelledby="store-record-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#03162f] px-5 py-4 text-white sm:px-7"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e0bd39]">{labels[section] ?? "Store record"} · {storeName}</p><h2 id="store-record-title" className="mt-1 truncate text-xl font-bold">{viewing.title}</h2><p className="mt-1 text-xs text-slate-300">Received {new Date(viewing.createdAt).toLocaleString("en-ZM")}</p></div><button type="button" onClick={()=>setViewing(null)} className="shrink-0 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">Close</button></header><div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">{section === "orders" ? <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Order status</p><p className="mt-1 font-bold text-[#03162f]">{viewing.status}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Fulfillment</p><p className="mt-1 font-bold text-[#03162f]">{viewing.fulfillmentMethod || "—"}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Payment status</p><p className="mt-1 font-bold text-[#03162f]">{viewing.paymentStatus || "Pending"}</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-xs text-amber-800">Order total</p><p className="mt-1 font-black text-[#03162f]">ZMW {(viewing.amount ?? 0).toLocaleString("en-ZM",{minimumFractionDigits:2})}</p></div></div>
        <section className="rounded-xl border border-slate-200 p-4 sm:p-5"><h3 className="font-bold text-[#03162f]">Customer</h3><p className="mt-3 text-sm font-semibold text-slate-800">{viewing.customerName || "Customer"}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">{viewing.customerPhone ? <a className="text-blue-700 hover:underline" href={`tel:${viewing.customerPhone}`}>{viewing.customerPhone}</a> : <span className="text-slate-500">No phone number recorded</span>}{viewing.customerEmail && <a className="text-blue-700 hover:underline" href={`mailto:${viewing.customerEmail}`}>{viewing.customerEmail}</a>}</div></section>
        <section className="overflow-hidden rounded-xl border border-slate-200"><div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3"><div><h3 className="font-bold text-[#03162f]">Items ordered</h3><p className="mt-0.5 text-xs text-slate-500">{viewing.items?.length ?? 0} line item{viewing.items?.length === 1 ? "" : "s"}</p></div>{viewing.subtotal !== undefined && <span className="text-sm font-semibold text-slate-700">Subtotal · ZMW {viewing.subtotal.toLocaleString("en-ZM",{minimumFractionDigits:2})}</span>}</div>{viewing.items?.length ? <div className="divide-y divide-slate-100">{viewing.items.map((item)=><div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{item.quantity} × ZMW {item.unitPrice.toLocaleString("en-ZM",{minimumFractionDigits:2})}</p></div><p className="shrink-0 text-sm font-bold text-[#03162f]">ZMW {item.totalPrice.toLocaleString("en-ZM",{minimumFractionDigits:2})}</p></div>)}</div> : <p className="px-4 py-5 text-sm text-slate-500">No item breakdown was recorded for this order.</p>}</section>
        <section className="rounded-xl border border-slate-200 p-4 sm:p-5"><h3 className="font-bold text-[#03162f]">Order notes</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{viewing.notes?.trim() || "No special instructions provided."}</p></section>
      </> : <dl className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Details</dt><dd className="mt-1 text-sm font-medium text-slate-900">{viewing.detail}</dd></div><div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Status</dt><dd className="mt-1 text-sm font-medium text-slate-900">{viewing.status}</dd></div><div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Received</dt><dd className="mt-1 text-sm font-medium text-slate-900">{new Date(viewing.createdAt).toLocaleString("en-ZM")}</dd></div>{viewing.amount !== undefined && <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Value</dt><dd className="mt-1 text-sm font-medium text-slate-900">ZMW {viewing.amount.toLocaleString("en-ZM",{minimumFractionDigits:2})}</dd></div>}</dl>}</div></section></div>}
    {createForm && orderFormData && <StoreManualOrderForm {...orderFormData} initialFulfillment={createForm === "delivery" ? "Delivery" : "Pickup"} lockFulfillment={createForm === "delivery"} onClose={() => setCreateForm(null)} />}
  </div>;
}
