"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Bike, CalendarDays, Check, HandCoins, MessageSquareText, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { confirmBooking } from "@/modules/bookings/services/booking.client";
import { updateOrderAction } from "@/modules/orders/services/order.actions";
import type { DashboardQueuePreviews, DashboardQueuePreview } from "@/modules/dashboard/services/workspace.service";

type TabKey = keyof DashboardQueuePreviews;
type QueueStats = { requestsToday: number; bookingsToday: number; pendingBookings: number; incomingOrders: number; activeDeliveries: number; openLoans: number; pendingConsultations: number };

const tabStyles: Record<TabKey, { label: string; href: string; icon: typeof Activity; theme: string; activeTheme: string; empty: string }> = {
  activity: { label: "New activity", href: "/dashboard/notifications", icon: Activity, theme: "border-violet-200 bg-violet-50 text-violet-800", activeTheme: "border-violet-500 bg-violet-600 text-white", empty: "No recent work activity." },
  bookings: { label: "Bookings", href: "/dashboard/bookings", icon: CalendarDays, theme: "border-sky-200 bg-sky-50 text-sky-800", activeTheme: "border-sky-500 bg-sky-600 text-white", empty: "No bookings are waiting for attention." },
  orders: { label: "Orders", href: "/dashboard/orders", icon: Package, theme: "border-amber-200 bg-amber-50 text-amber-900", activeTheme: "border-amber-500 bg-amber-500 text-[#03162F]", empty: "No open customer orders." },
  courier: { label: "Deliveries", href: "/dashboard/orders/my-deliveries", icon: Bike, theme: "border-cyan-200 bg-cyan-50 text-cyan-900", activeTheme: "border-cyan-600 bg-cyan-700 text-white", empty: "No active deliveries." },
  loans: { label: "Loans", href: "/dashboard/loans", icon: HandCoins, theme: "border-emerald-200 bg-emerald-50 text-emerald-900", activeTheme: "border-emerald-600 bg-emerald-700 text-white", empty: "No loan applications are waiting for review." },
  consultations: { label: "Consultations", href: "/dashboard/enterprise/tech-solutions/consultations", icon: MessageSquareText, theme: "border-rose-200 bg-rose-50 text-rose-900", activeTheme: "border-rose-500 bg-rose-600 text-white", empty: "No open consultations." },
};

export default function DashboardOperationsTabs({ previews, stats, permissionKeys, isSuperAdministrator }: {
  previews: DashboardQueuePreviews;
  stats: QueueStats;
  permissionKeys: string[];
  isSuperAdministrator: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("activity");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const tabs = useMemo(() => ([
    { key: "activity" as const, count: stats.requestsToday, hint: `${previews.activity.length} latest updates`, permissions: ["dashboard.view"] },
    { key: "bookings" as const, count: stats.pendingBookings, hint: "Need confirmation", permissions: ["bookings.view", "bookings.manage"] },
    { key: "orders" as const, count: stats.incomingOrders, hint: "Open customer orders", permissions: ["orders.view", "orders.manage"] },
    { key: "courier" as const, count: stats.activeDeliveries, hint: "Incoming and active", permissions: ["deliveries.manage"] },
    { key: "loans" as const, count: stats.openLoans, hint: "Awaiting review", permissions: ["loans.approve"] },
    { key: "consultations" as const, count: stats.pendingConsultations, hint: "Customer requests", permissions: ["businesses.view"] },
  ].filter((tab) => isSuperAdministrator || tab.permissions.some((permission) => permissionKeys.includes(permission)))), [isSuperAdministrator, permissionKeys, previews.activity.length, stats]);
  const selected = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
  const activeKey = selected?.key ?? "activity";
  const rows = selected ? previews[activeKey] : [];
  const canManageBookings = isSuperAdministrator || permissionKeys.includes("bookings.manage");
  const canManageOrders = isSuperAdministrator || permissionKeys.includes("orders.manage");

  function confirmAppointment(item: DashboardQueuePreview) {
    startTransition(async () => {
      try {
        await confirmBooking(item.id);
        toast.success("Booking confirmed.");
        router.refresh();
      } catch {
        toast.error("Could not confirm this booking. Refresh and try again.");
      }
    });
  }

  function confirmOrder(item: DashboardQueuePreview) {
    startTransition(async () => {
      const result = await updateOrderAction(item.id, { status: "Confirmed" });
      if (!result.success) {
        toast.error(result.error || "Could not update this order.");
        return;
      }
      toast.success("Order accepted.");
      router.refresh();
    });
  }

  if (!selected) return null;
  const Icon = tabStyles[activeKey].icon;
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Dashboard work preview">
    <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-6">
      {tabs.map((tab) => {
        const style = tabStyles[tab.key];
        const TabIcon = style.icon;
        const active = activeKey === tab.key;
        return <button key={tab.key} type="button" aria-pressed={active} onClick={() => setActiveTab(tab.key)} className={`relative flex min-h-[76px] min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${active ? style.activeTheme : style.theme}`}>
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/20" : "bg-white/80"}`}><TabIcon className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-black">{style.label}</span><span className={`mt-0.5 block truncate text-[9px] ${active ? "opacity-80" : "opacity-70"}`}>{tab.hint}</span></span>
          <span className="absolute right-2 top-1.5 text-xs font-black tabular-nums">{tab.count}</span>
        </button>;
      })}
    </div>

    <div className="border-t border-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#03162F] text-[#D4AF37]"><Icon className="h-4 w-4" /></span><div><h2 className="text-sm font-black text-[#03162F]">{tabStyles[activeKey].label} preview</h2><p className="text-[10px] text-slate-500">Review recent items and handle quick actions here.</p></div></div>
        <Link href={tabStyles[activeKey].href} className="inline-flex items-center gap-1.5 rounded-lg bg-[#03162F] px-3 py-2 text-[11px] font-bold text-white transition hover:bg-[#0A2852]">Open full page<ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
      {rows.length ? <div className="grid gap-2 px-3 pb-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((item, index) => <PreviewRow key={`${activeKey}-${item.id}-${index}`} item={item} kind={activeKey} canManageBookings={canManageBookings} canManageOrders={canManageOrders} isPending={isPending} onConfirmBooking={confirmAppointment} onConfirmOrder={confirmOrder} />)}
      </div> : <p className="px-5 pb-5 text-xs text-slate-500">{tabStyles[activeKey].empty}</p>}
    </div>
  </section>;
}

function PreviewRow({ item, kind, canManageBookings, canManageOrders, isPending, onConfirmBooking, onConfirmOrder }: {
  item: DashboardQueuePreview;
  kind: TabKey;
  canManageBookings: boolean;
  canManageOrders: boolean;
  isPending: boolean;
  onConfirmBooking: (item: DashboardQueuePreview) => void;
  onConfirmOrder: (item: DashboardQueuePreview) => void;
}) {
  const statusColor = /pending|under review/i.test(item.status) ? "bg-amber-100 text-amber-800" : /completed|confirmed|contacted/i.test(item.status) ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700";
  return <article className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-[#03162F]">{item.title}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{item.detail}</span><span className="mt-1.5 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${statusColor}`}>{item.status}</span>{item.amount !== undefined && <span className="text-[10px] font-bold text-slate-600">ZMW {item.amount.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}</span></span>
    {kind === "bookings" && canManageBookings && item.status === "Pending" ? <button type="button" disabled={isPending} onClick={() => onConfirmBooking(item)} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-2 text-[10px] font-bold text-white disabled:opacity-50"><Check className="h-3 w-3" />Confirm</button>
      : kind === "orders" && canManageOrders && item.status === "Pending" ? <button type="button" disabled={isPending} onClick={() => onConfirmOrder(item)} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#03162F] px-2.5 py-2 text-[10px] font-bold text-white disabled:opacity-50"><Check className="h-3 w-3" />Accept</button>
      : <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-slate-400"><RefreshCw className="h-3 w-3" />{new Date(item.createdAt).toLocaleDateString("en-ZM", { day: "numeric", month: "short" })}</span>}
  </article>;
}
