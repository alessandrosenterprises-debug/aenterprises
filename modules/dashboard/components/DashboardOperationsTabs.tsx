"use client";

import { useMemo, useState } from "react";
import { Activity, Bike, CalendarDays, Check, ClipboardList, FileText, HandCoins, Headphones, Mail, Package, RefreshCw, UsersRound, Wallet, Bell, UserRound, Clock3, Boxes, ReceiptText, Star, Send, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { confirmBooking } from "@/modules/bookings/services/booking.client";
import { updateOrderAction } from "@/modules/orders/services/order.actions";
import type { DashboardQueuePreviews, DashboardQueuePreview } from "@/modules/dashboard/services/workspace.service";

type QueueStats = { requestsToday: number; bookingsToday: number; pendingBookings: number; incomingOrders: number; activeDeliveries: number; openLoans: number; pendingConsultations: number };
type IconType = typeof Package;
type WorkspaceTab = { key: string; label: string; icon: IconType; permissions: string[]; count: number; queue?: keyof DashboardQueuePreviews; summary: string; accent: string };

const theme: Record<string, { active: string; icon: string }> = {
  navy: { active: "border-[#03162F] bg-[#03162F] text-white", icon: "bg-[#03162F] text-[#D4AF37]" },
  blue: { active: "border-blue-700 bg-blue-700 text-white", icon: "bg-blue-50 text-blue-700" },
  cyan: { active: "border-cyan-700 bg-cyan-700 text-white", icon: "bg-cyan-50 text-cyan-700" },
  violet: { active: "border-violet-700 bg-violet-700 text-white", icon: "bg-violet-50 text-violet-700" },
  green: { active: "border-emerald-700 bg-emerald-700 text-white", icon: "bg-emerald-50 text-emerald-700" },
  amber: { active: "border-amber-500 bg-amber-400 text-[#03162F]", icon: "bg-amber-50 text-amber-800" },
  rose: { active: "border-rose-700 bg-rose-700 text-white", icon: "bg-rose-50 text-rose-700" },
};

export default function DashboardOperationsTabs({ previews, stats, permissionKeys, isSuperAdministrator, managerMode = false }: {
  previews: DashboardQueuePreviews;
  stats: QueueStats;
  permissionKeys: string[];
  isSuperAdministrator: boolean;
  managerMode?: boolean;
}) {
  const [activeKey, setActiveKey] = useState("dashboard");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const tabs = useMemo<WorkspaceTab[]>(() => {
    const staffTabs: WorkspaceTab[] = [
      { key: "dashboard", label: "Dashboard", icon: Activity, permissions: ["dashboard.view"], count: stats.incomingOrders + stats.pendingBookings + stats.activeDeliveries + stats.pendingConsultations, queue: "activity", summary: "A live overview of the work waiting across this store.", accent: "navy" },
      { key: "orders", label: "Orders", icon: Package, permissions: ["orders.view", "orders.manage"], count: stats.incomingOrders, queue: "orders", summary: "Accept and track customer orders for this store.", accent: "amber" },
      { key: "bookings", label: "Bookings", icon: CalendarDays, permissions: ["bookings.view", "bookings.manage"], count: stats.pendingBookings, queue: "bookings", summary: "Confirm appointments and follow the booking queue.", accent: "blue" },
      { key: "deliveries", label: "Deliveries", icon: Bike, permissions: ["deliveries.manage"], count: stats.activeDeliveries, queue: "courier", summary: "Monitor deliveries assigned to this store.", accent: "cyan" },
      { key: "messages", label: "Messages", icon: Mail, permissions: ["communications.manage"], count: previews.messages.length, queue: "messages", summary: "Customer conversations assigned to your store.", accent: "violet" },
      { key: "consultations", label: "Consultations", icon: Headphones, permissions: ["businesses.view", "communications.manage"], count: stats.pendingConsultations, queue: "consultations", summary: "Review new service consultation requests.", accent: "rose" },
      { key: "notifications", label: "Notifications", icon: Bell, permissions: ["dashboard.view"], count: previews.notifications.length, queue: "notifications", summary: "Recent incoming work and customer updates.", accent: "navy" },
      { key: "customers", label: "Customers", icon: UserRound, permissions: ["customers.view"], count: previews.customers.length, queue: "customers", summary: "Customer records connected to store activity.", accent: "green" },
      { key: "reminders", label: "Reminders", icon: CalendarClock, permissions: ["bookings.view", "bookings.manage"], count: stats.pendingBookings, queue: "bookings", summary: "Upcoming bookings and follow-ups.", accent: "amber" },
    ];
    const managerTabs: WorkspaceTab[] = [
      ...staffTabs.filter((tab) => tab.key !== "notifications"),
      { key: "reports", label: "Reports", icon: Activity, permissions: ["reports.view"], count: stats.requestsToday, queue: "activity", summary: "Store activity, service demand and daily performance.", accent: "blue" },
      { key: "attendance", label: "Attendance", icon: Clock3, permissions: ["hr.manage", "employees.view"], count: 0, summary: "Review today's attendance for assigned store staff.", accent: "violet" },
      { key: "staff", label: "Staff Management", icon: UsersRound, permissions: ["employees.view", "hr.manage"], count: 0, summary: "Store staff, assignments and active work sessions.", accent: "navy" },
      { key: "cashup", label: "Cash-up", icon: Wallet, permissions: ["cash.review", "cash.manage"], count: 0, summary: "Review cashier submissions and shift balances.", accent: "green" },
      { key: "stock", label: "Stock Management", icon: Boxes, permissions: ["stock.view", "stock.manage", "stock.count"], count: 0, summary: "Branch stock levels, movements and counts.", accent: "amber" },
      { key: "submissions", label: "Report Submission", icon: Send, permissions: ["reports.submit", "reports.review"], count: 0, summary: "Submit store reports to the department that needs them.", accent: "cyan" },
      { key: "leave", label: "Leave Requests", icon: CalendarClock, permissions: ["hr.manage", "employees.view"], count: 0, summary: "Review leave requests from assigned store staff.", accent: "rose" },
      { key: "advances", label: "Advance & Shortages", icon: HandCoins, permissions: ["hr.manage", "reports.view"], count: 0, summary: "Track staff advances and reported cash or stock shortages.", accent: "amber" },
      { key: "reviews", label: "Customer Reviews", icon: Star, permissions: ["orders.view"], count: previews.reviews.length, queue: "reviews", summary: "Read customer feedback linked to store orders.", accent: "violet" },
      { key: "rider-report", label: "Delivery & Rider Report", icon: Bike, permissions: ["deliveries.manage", "reports.view"], count: stats.activeDeliveries, queue: "courier", summary: "Review delivery outcomes and rider performance for this store.", accent: "cyan" },
      { key: "reconciliation", label: "Daily Cash Reconciliation", icon: ReceiptText, permissions: ["cash.reconcile", "cash.review"], count: 0, summary: "Compare recorded transactions with the store's cash position.", accent: "green" },
      { key: "documents", label: "Invoices & Quotations", icon: FileText, permissions: ["billing.view"], count: 0, summary: "Prepare and review store invoices and quotations.", accent: "blue" },
    ];
    return (managerMode ? managerTabs : staffTabs).filter((tab) => managerMode || isSuperAdministrator || tab.permissions.some((permission) => permissionKeys.includes(permission)));
  }, [isSuperAdministrator, managerMode, permissionKeys, previews.customers.length, previews.messages.length, previews.notifications.length, previews.reviews.length, stats]);

  const selected = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];
  if (!selected) return <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No store workspace sections are assigned to this account yet.</section>;
  const rows = selected.queue ? previews[selected.queue] : [];
  const hasAccess = isSuperAdministrator || selected.permissions.some((permission) => permissionKeys.includes(permission));
  const Icon = selected.icon;

  async function acceptBooking(item: DashboardQueuePreview) {
    setBusy(true);
    try { await confirmBooking(item.id); toast.success("Booking confirmed."); router.refresh(); }
    catch { toast.error("Could not confirm this booking. Refresh and try again."); }
    finally { setBusy(false); }
  }
  async function acceptOrder(item: DashboardQueuePreview) {
    setBusy(true);
    try { const result = await updateOrderAction(item.id, { status: "Confirmed" }); if (!result.success) { toast.error(result.error || "Could not update this order."); return; } toast.success("Order accepted."); router.refresh(); }
    catch { toast.error("Could not accept this order. Refresh and try again."); }
    finally { setBusy(false); }
  }

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label={managerMode ? "Store manager workspace" : "Store staff workspace"}>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
      <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9A7410]">{managerMode ? "Manager workspace" : "Staff workspace"} · Store operations</p><h2 className="mt-0.5 text-lg font-black text-[#03162F]">{managerMode ? "Manage your store" : "Your work queue"}</h2></div>
      <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#03162F] hover:border-[#D4AF37]"><RefreshCw className="h-3.5 w-3.5" />Refresh workspace</button>
    </header>
    <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 px-3 py-2 [scrollbar-width:thin]" role="tablist" aria-label="Store workspace sections">
      {tabs.map((tab) => { const TabIcon = tab.icon; const active = tab.key === selected.key; const colors = theme[tab.accent]; return <button key={tab.key} type="button" role="tab" aria-selected={active} onClick={() => setActiveKey(tab.key)} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition ${active ? colors.active : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50"}`}><TabIcon className="h-4 w-4" />{tab.label}<span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] tabular-nums ${active ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>{tab.count}</span></button>; })}
    </div>
    <div className="p-4 sm:p-5" role="tabpanel" aria-label={selected.label}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme[selected.accent].icon}`}><Icon className="h-5 w-5" /></span><div><h3 className="font-black text-[#03162F]">{selected.label}</h3><p className="text-xs text-slate-500">{selected.summary}</p></div></div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{rows.length ? `${rows.length} recent items` : `${selected.count} needing attention`}</span>
      </div>
      {selected.key === "dashboard" && <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <SummaryMetric label="Orders" value={stats.incomingOrders} tone="bg-amber-50 text-amber-800" />
        <SummaryMetric label="Bookings" value={stats.pendingBookings} tone="bg-blue-50 text-blue-800" />
        <SummaryMetric label="Deliveries" value={stats.activeDeliveries} tone="bg-cyan-50 text-cyan-800" />
        <SummaryMetric label="Consultations" value={stats.pendingConsultations} tone="bg-rose-50 text-rose-800" />
      </div>}
      {!hasAccess ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-8 text-center"><ClipboardList className="mx-auto h-8 w-8 text-amber-500" /><p className="mt-2 text-sm font-bold text-amber-950">This store function is not assigned to your role</p><p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-amber-900">Ask the system administrator to grant the required permission. This panel will only show information within your assigned store.</p></div>
        : rows.length ? <div className="grid gap-2 lg:grid-cols-2">{rows.map((item, index) => <QueueRow key={`${selected.key}-${item.id}-${index}`} item={item} kind={selected.key} busy={busy} onBooking={acceptBooking} onOrder={acceptOrder} />)}</div>
        : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"><ClipboardList className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-bold text-[#03162F]">No {selected.label.toLowerCase()} need attention</p><p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-slate-500">New work for your assigned store will appear in this panel. The workspace is scoped to the business and branch assigned to the active manager session.</p></div>}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500"><Activity className="h-3.5 w-3.5 text-emerald-600" />Showing items available to your role and assigned store.</div>
    </div>
  </section>;
}

function SummaryMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={`rounded-xl border border-slate-100 px-3 py-3 ${tone}`}><p className="text-[11px] font-semibold opacity-80">{label}</p><p className="mt-1 text-xl font-black tabular-nums">{value}</p></div>;
}

function QueueRow({ item, kind, busy, onBooking, onOrder }: { item: DashboardQueuePreview; kind: string; busy: boolean; onBooking: (item: DashboardQueuePreview) => void; onOrder: (item: DashboardQueuePreview) => void }) {
  const statusClass = /pending|review/i.test(item.status) ? "bg-amber-100 text-amber-800" : /completed|confirmed|contacted|scheduled/i.test(item.status) ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700";
  return <article className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#03162F]">{item.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.detail}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>{item.status}</span>{item.amount !== undefined && <span className="text-xs font-bold text-slate-700">ZMW {item.amount.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}</div></div>
    {kind === "bookings" && item.status === "Pending" ? <button type="button" disabled={busy} onClick={() => onBooking(item)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Check className="h-3.5 w-3.5" />Confirm</button> : kind === "orders" && item.status === "Pending" ? <button type="button" disabled={busy} onClick={() => onOrder(item)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#03162F] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Check className="h-3.5 w-3.5" />Accept</button> : <span className="shrink-0 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleDateString("en-ZM", { day: "numeric", month: "short" })}</span>}
  </article>;
}
