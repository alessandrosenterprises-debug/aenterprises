"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Activity, BellRing, CalendarDays, HandCoins, MessageSquare, Package, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type QueueStats = {
  incomingOrders: number;
  pendingBookings: number;
  openLoans: number;
  pendingConsultations: number;
};

type QueueItem = {
  label: string;
  description: string;
  href: string;
  count: number;
  permissions: string[];
  icon: typeof Package;
  table: string;
  incomingLabel: string;
};

export default function WorkQueueMonitor({ stats, permissionKeys, isSuperAdministrator, compact = false }: {
  stats: QueueStats;
  permissionKeys: string[];
  isSuperAdministrator: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isLive, setIsLive] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const items = useMemo<QueueItem[]>(() => [
    { label: "Customer orders", description: "New and unassigned", href: "/dashboard/orders", count: stats.incomingOrders, permissions: ["orders.view", "orders.manage"], icon: Package, table: "orders", incomingLabel: "A new customer order arrived" },
    { label: "Bookings", description: "Waiting for confirmation", href: "/dashboard/bookings", count: stats.pendingBookings, permissions: ["bookings.view", "bookings.manage"], icon: CalendarDays, table: "bookings", incomingLabel: "A new booking needs attention" },
    { label: "Loan applications", description: "Awaiting review", href: "/dashboard/loans", count: stats.openLoans, permissions: ["loans.approve"], icon: HandCoins, table: "customer_loan_applications", incomingLabel: "A new loan application arrived" },
    { label: "Consultations", description: "Customer requests to answer", href: "/dashboard/enterprise/tech-solutions/consultations", count: stats.pendingConsultations, permissions: ["businesses.view"], icon: MessageSquare, table: "technology_consultation_requests", incomingLabel: "A new consultation request arrived" },
  ].filter((item) => isSuperAdministrator || item.permissions.some((permission) => permissionKeys.includes(permission))), [isSuperAdministrator, permissionKeys, stats]);

  const refresh = useCallback((announce = false) => {
    if (document.visibilityState === "hidden") return;
    setIsRefreshing(true);
    router.refresh();
    setLastSync(new Date());
    if (announce) toast.success("Work queues are up to date.");
    window.setTimeout(() => setIsRefreshing(false), 700);
  }, [router]);

  useEffect(() => {
    const channel = supabase.channel(`staff-work-queue-${Math.random().toString(36).slice(2)}`);
    for (const item of items) {
      channel.on("postgres_changes", { event: "*", schema: "public", table: item.table }, (payload) => {
        if (payload.eventType === "INSERT") {
          toast(item.incomingLabel, { description: "Open your work queue to review it." });
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(120);
          if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState === "hidden") {
            new Notification("New work for your team", { body: item.incomingLabel, tag: `aeos-work-${item.table}` });
          }
        }
        refresh();
      });
    }
    channel.subscribe((status) => {
      setIsLive(status === "SUBSCRIBED");
      if (status === "SUBSCRIBED") setLastSync(new Date());
    });

    // Realtime may be delayed or unavailable on a weak connection, so refresh quietly every 25 seconds.
    const poll = window.setInterval(() => refresh(), 25000);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [items, refresh]);

  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (compact) return <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-sm" aria-label="Live updates status"><span className={`inline-flex items-center gap-1.5 font-semibold ${isLive ? "text-emerald-700" : "text-amber-700"}`}>{isLive ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{isLive ? "Live queue updates connected" : "Automatic queue refresh is active"}{lastSync && <span className="font-normal text-slate-500">· checked {lastSync.toLocaleTimeString("en-ZM", { hour: "2-digit", minute: "2-digit" })}</span>}</span><button type="button" onClick={() => refresh(true)} disabled={isRefreshing} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-bold text-[#03162F] hover:bg-slate-100 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />Refresh</button></div>;

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Live work queues">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]"><Activity className="h-4 w-4" /></span><div><h2 className="text-sm font-black text-[#03162F]">Live work queues</h2><p className="text-[11px] text-slate-500">{total} items currently need attention</p></div></div>
      <div className="flex items-center gap-3"><span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${isLive ? "text-emerald-700" : "text-amber-700"}`}>{isLive ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{isLive ? "Live updates on" : "Checking for updates"}</span><button type="button" onClick={() => refresh(true)} disabled={isRefreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#D4AF37] disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />Refresh</button></div>
    </div>
    {items.length ? <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
      {items.map((item) => { const Icon = item.icon; return <Link key={item.table} href={item.href} className="flex min-h-[88px] items-center gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-[#03162F]">{item.label}</span><span className="mt-1 block truncate text-[10px] text-slate-500">{item.description}</span></span><span className={`min-w-8 rounded-full px-2 py-1 text-center text-xs font-black tabular-nums ${item.count ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"}`}>{item.count}</span></Link>; })}
    </div> : <div className="px-5 py-6 text-sm text-slate-500">No work queues are assigned to this account yet.</div>}
    <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[10px] text-slate-500"><BellRing className="h-3 w-3" />Incoming work appears here automatically{lastSync ? ` · checked ${lastSync.toLocaleTimeString("en-ZM", { hour: "2-digit", minute: "2-digit" })}` : ""}</div>
  </section>;
}
