"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bike, CheckCircle2, Clock3, MapPin, PackageCheck, Phone, Radio, RefreshCw, Truck, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { RiderDeliveryOrder } from "../services/order.service";
import { completeAssignedDeliveryWithProofAction, updateAssignedRiderOrderAction } from "../services/order.actions";

const formatMoney = (amount: number) => `ZMW ${Number(amount || 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function RiderDeliveriesManager({ orders, rider }: { orders: RiderDeliveryOrder[]; rider: { userId: string; employeeId: string; name: string; isRider: boolean } }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [receivedBy, setReceivedBy] = useState<Record<string, string>>({});
  const [proofNote, setProofNote] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [isLive, setIsLive] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const lastLocationSent = useRef<Record<string, number>>({});
  const currentOrders = useRef(orders);

  useEffect(() => {
    currentOrders.current = orders;
  }, [orders]);

  useEffect(() => {
    if (!rider.employeeId) return;
    const channel = supabase.channel(`aeos-rider-orders-${rider.employeeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `rider_employee_id=eq.${rider.employeeId}` }, (payload) => {
        const changed = payload.new as { id?: string; status?: string; delivery_status?: string };
        const previous = currentOrders.current.find((order) => order.id === changed.id);
        const orderProgressChanged = payload.eventType === "INSERT"
          || !previous
          || previous.status !== changed.status
          || previous.delivery_status !== changed.delivery_status;
        if (!orderProgressChanged) return;
        setLastSync(new Date());
        toast("Your delivery queue has been updated", { description: "Review the latest order and delivery details." });
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(120);
        router.refresh();
      })
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") setLastSync(new Date());
      });

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        setLastSync(new Date());
      }
    };
    const poll = window.setInterval(refreshWhenVisible, 20000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, [rider.employeeId, router]);

  useEffect(() => {
    if (!rider.employeeId) return;
    const channel = supabase.channel("aeos-rider-presence", { config: { presence: { key: rider.userId } } });
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    const publishPresence = () => {
      const currentOrder = orders.find((order) => !["Delivered", "Delivery Failed"].includes(order.delivery_status));
      void channel.track({
        userId: rider.userId,
        employeeId: rider.employeeId,
        name: rider.name,
        activity: currentOrder?.delivery_status || "Available",
        orderId: currentOrder?.id || null,
        lastSeen: new Date().toISOString(),
      });
    };
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        publishPresence();
        heartbeat = setInterval(publishPresence, 15000);
      }
    });
    return () => {
      if (heartbeat) clearInterval(heartbeat);
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [orders, rider.employeeId, rider.name, rider.userId]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const active = orders.filter((order) => order.delivery_status === "Out for Delivery");
    if (active.length === 0) return;

    const watches = active.map((order) => navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - (lastLocationSent.current[order.id] ?? 0) < 15000) return;
        lastLocationSent.current[order.id] = now;
        void updateAssignedRiderOrderAction(order.id, null, position.coords.latitude, position.coords.longitude)
          .then((result) => setLocationMessage(result.success ? "Live location is being shared with customers." : result.error || "Could not share your location."));
      },
      () => setLocationMessage("Allow location access to share live delivery tracking."),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    ));

    return () => watches.forEach((watchId) => navigator.geolocation.clearWatch(watchId));
  }, [orders]);

  function update(orderId: string, status: "Preparing" | "Ready" | "Out for Delivery" | "Delivered") {
    setMessage("");
    startTransition(async () => {
      const result = status === "Delivered"
        ? await completeAssignedDeliveryWithProofAction({ orderId, receivedBy: receivedBy[orderId] || "", proofNote: proofNote[orderId] || "" })
        : await updateAssignedRiderOrderAction(orderId, status);
      if (!result.success) {
        setMessage(result.error || "Could not update delivery progress.");
        return;
      }
      const label = status === "Out for Delivery" ? "Delivery started. Live tracking is now on." : status === "Delivered" ? "Delivery completed and proof saved." : `Order marked ${status.toLowerCase()}.`;
      setMessage(label);
      router.refresh();
    });
  }

  const preparing = orders.filter((order) => order.delivery_status === "Preparing" || order.status === "Processing").length;
  const ready = orders.filter((order) => order.status === "Ready").length;
  const enRoute = orders.filter((order) => order.delivery_status === "Out for Delivery").length;

  if (orders.length === 0) return <div className="space-y-4">
    <LiveQueueStatus isLive={isLive} lastSync={lastSync} onRefresh={() => { router.refresh(); setLastSync(new Date()); }} />
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm"><Bike className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 font-bold text-[#03162F]">{rider.isRider ? "No active deliveries" : "Rider account not linked"}</h2><p className="mt-1 text-sm text-slate-500">{rider.isRider ? "New orders assigned to your rider account will appear automatically." : "Ask an administrator to link your staff account to an active rider profile."}</p></section>
  </div>;

  return <div className="space-y-4">
    <LiveQueueStatus isLive={isLive} lastSync={lastSync} onRefresh={() => { router.refresh(); setLastSync(new Date()); }} />
    <section className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Delivery workload summary">
      <QueueStat label="Preparing" count={preparing} icon={Clock3} />
      <QueueStat label="Ready to go" count={ready} icon={PackageCheck} />
      <QueueStat label="On the way" count={enRoute} icon={Truck} />
    </section>
    {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p>}
    {locationMessage && <p role="status" className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-800"><Radio className="h-4 w-4 shrink-0" />{locationMessage}</p>}
    {orders.map((order) => {
      const isCompleted = order.status === "Completed" || order.delivery_status === "Delivered";
      const next = order.delivery_status === "Out for Delivery" ? "Delivered"
        : order.status === "Ready" ? "Out for Delivery"
        : order.status === "Processing" || order.delivery_status === "Preparing" ? "Ready"
        : "Preparing";
      const buttonLabel = next === "Delivered" ? "Mark delivered"
        : next === "Out for Delivery" ? "Start delivery · share live location"
        : next === "Ready" ? "Mark order ready"
        : "Start preparing";
      const ButtonIcon = next === "Delivered" ? CheckCircle2 : next === "Out for Delivery" ? Truck : next === "Ready" ? PackageCheck : Clock3;
      const hasPin = order.delivery_latitude !== null && order.delivery_longitude !== null;
      const mapSrc = hasPin
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${order.delivery_longitude! - 0.006}%2C${order.delivery_latitude! - 0.004}%2C${order.delivery_longitude! + 0.006}%2C${order.delivery_latitude! + 0.004}&layer=mapnik&marker=${order.delivery_latitude}%2C${order.delivery_longitude}`
        : "";

      return <article key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-[#9A7412]">{order.businesses?.name || "AEOS delivery"}</p><h2 className="mt-1 text-lg font-black text-[#03162F]">Order #{order.id.slice(0, 8).toUpperCase()}</h2><p className="mt-1 text-xs text-slate-500">Assigned {new Date(order.created_at).toLocaleString("en-ZM")}</p></div><div className="text-right"><p className="font-black text-[#03162F]">{formatMoney(order.total_amount)}</p><span className="mt-1 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{order.status === "Ready" ? "Ready" : order.delivery_status}</span></div></header>
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Items</p><ul className="mt-2 space-y-1.5">{order.order_items.map((item) => <li key={item.id} className="text-sm text-slate-700">{item.quantity} × {item.enterprise_catalog?.name || "Item"}</li>)}</ul>{order.notes && <p className="mt-2 whitespace-pre-line rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">{order.notes}</p>}</div>{order.pickup_address && <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3"><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#80600A]"><MapPin className="h-3.5 w-3.5" />Collection point</p><p className="mt-2 break-words text-sm text-slate-700">{order.pickup_address}</p>{order.pickup_contact_name && <p className="mt-1 text-xs text-slate-500">{order.pickup_contact_name}{order.pickup_contact_phone ? ` · ${order.pickup_contact_phone}` : ""}</p>}{order.pickup_latitude !== null && order.pickup_longitude !== null && <a className="mt-2 inline-flex text-xs font-semibold text-blue-700 hover:underline" href={`https://www.openstreetmap.org/?mlat=${order.pickup_latitude}&mlon=${order.pickup_longitude}#map=17/${order.pickup_latitude}/${order.pickup_longitude}`} target="_blank" rel="noreferrer">Open collection directions</a>}</div>}<div className="rounded-xl bg-slate-50 p-3"><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><MapPin className="h-3.5 w-3.5" />Customer delivery location</p><p className="mt-2 break-words text-sm text-slate-700">{order.delivery_address || "No address provided"}</p>{order.delivery_contact_name && <p className="mt-2 text-xs text-slate-600">Recipient: {order.delivery_contact_name}</p>}{order.delivery_contact_phone && <a className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#03162F] hover:border-[#D4AF37]" href={`tel:${order.delivery_contact_phone}`}><Phone className="h-3.5 w-3.5" />Call customer · {order.delivery_contact_phone}</a>}{hasPin && <a className="mt-2 flex text-xs font-semibold text-blue-700 hover:underline" href={`https://www.openstreetmap.org/?mlat=${order.delivery_latitude}&mlon=${order.delivery_longitude}#map=17/${order.delivery_latitude}/${order.delivery_longitude}`} target="_blank" rel="noreferrer">Open directions</a>}</div>{!isCompleted && next === "Delivered" && <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3"><p className="text-xs font-black uppercase tracking-wide text-emerald-800">Proof of delivery</p><label className="block text-xs font-bold text-slate-600">Received by<input value={receivedBy[order.id] || ""} onChange={(event) => setReceivedBy((current) => ({ ...current, [order.id]: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="Recipient name" /></label><label className="block text-xs font-bold text-slate-600">Delivery note <span className="font-normal text-slate-400">(optional)</span><input value={proofNote[order.id] || ""} maxLength={500} onChange={(event) => setProofNote((current) => ({ ...current, [order.id]: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="Handover details" /></label></div>}{isCompleted ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-800">Completed delivery · view only</p> : <button type="button" disabled={isPending || (next === "Delivered" && !receivedBy[order.id]?.trim())} onClick={() => update(order.id, next)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0A2852] disabled:opacity-60"><ButtonIcon className="h-4 w-4" />{isPending ? "Updating…" : buttonLabel}</button>}</div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">{mapSrc ? <><iframe title={`Customer pinned map for order ${order.id.slice(0, 8)}`} src={mapSrc} loading="lazy" className="h-52 w-full border-0" /><p className="flex items-center gap-1.5 bg-white px-3 py-2 text-[11px] text-slate-500"><MapPin className="h-3.5 w-3.5 text-rose-600" />Customer pinned location</p></> : <div className="flex h-52 flex-col items-center justify-center p-5 text-center"><MapPin className="h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-600">No pinned map for this order</p></div>}</div>
        </div>
      </article>;
    })}
  </div>;
}

function LiveQueueStatus({ isLive, lastSync, onRefresh }: { isLive: boolean; lastSync: Date | null; onRefresh: () => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-sm"><span className={`inline-flex items-center gap-1.5 font-semibold ${isLive ? "text-emerald-700" : "text-amber-700"}`}>{isLive ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{isLive ? "Live assignment updates" : "Auto-checking for assignments"}{lastSync && <span className="font-normal text-slate-500">· checked {lastSync.toLocaleTimeString("en-ZM", { hour: "2-digit", minute: "2-digit" })}</span>}</span><button type="button" onClick={onRefresh} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-bold text-[#03162F] hover:bg-slate-100"><RefreshCw className="h-3.5 w-3.5" />Refresh</button></div>;
}

function QueueStat({ label, count, icon: Icon }: { label: string; count: number; icon: typeof Clock3 }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-3 sm:p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F2DF] text-[#8B6A0B]"><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-lg font-black leading-5 tabular-nums text-[#03162F]">{count}</span><span className="block truncate text-[10px] font-semibold text-slate-500 sm:text-xs">{label}</span></span></div>;
}
