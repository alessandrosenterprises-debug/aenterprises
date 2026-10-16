"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, Clock3, LocateFixed, MapPin, Minus, Navigation, Plus, Radio, ShoppingBag, Store } from "lucide-react";
import type { DeliveryRider, ManagedOrder } from "../services/order.service";

export interface RiderPresence {
  userId: string;
  employeeId: string;
  name: string;
  activity: string;
  orderId: string | null;
  lastSeen: string;
}

type GeoPoint = { lat: number; lon: number };
const TILE_SIZE = 256;
const FALLBACK_CENTER = { lat: -15.3875, lon: 28.3228 };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function project({ lat, lon }: GeoPoint, zoom: number) {
  const world = TILE_SIZE * 2 ** zoom;
  const safeLat = clamp(lat, -85.0511, 85.0511) * Math.PI / 180;
  return {
    x: ((lon + 180) / 360) * world,
    y: ((1 - Math.asinh(Math.tan(safeLat)) / Math.PI) / 2) * world,
  };
}

function unproject({ x, y }: { x: number; y: number }, zoom: number): GeoPoint {
  const world = TILE_SIZE * 2 ** zoom;
  const lon = x / world * 360 - 180;
  const n = Math.PI - 2 * Math.PI * y / world;
  const lat = 180 / Math.PI * Math.atan(Math.sinh(n));
  return { lat, lon };
}

function timeAgo(value: string | null, now: number) {
  if (!value) return "Waiting for GPS";
  if (!now) return "Connecting…";
  const seconds = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `Updated ${seconds}s ago`;
  if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)}m ago`;
  return `Updated ${Math.floor(seconds / 3600)}h ago`;
}

function statusFor(rider: DeliveryRider, orders: ManagedOrder[], presence: Record<string, RiderPresence>, now: number) {
  const live = rider.user_id ? presence[rider.user_id] : undefined;
  const online = Boolean(now && live && now - new Date(live.lastSeen).getTime() < 60000);
  const order = orders.find((item) => item.rider_employee_id === rider.id && !["Completed", "Cancelled"].includes(item.status) && !["Delivered", "Delivery Failed"].includes(item.delivery_status || ""));
  const activity = order?.delivery_status || (order?.status === "Processing" ? "Preparing" : live?.activity || (online ? "Available" : "Offline"));
  return { live, online, order, activity };
}

function LiveMap({ orders, center, zoom, onZoom, onSelectOrder, selectedOrderId, followRider, onToggleFollow, onManageOrder }: {
  orders: ManagedOrder[];
  center: GeoPoint;
  zoom: number;
  onZoom: (direction: number) => void;
  onSelectOrder: (order: ManagedOrder) => void;
  selectedOrderId: string | null;
  followRider: boolean;
  onToggleFollow: () => void;
  onManageOrder: (order: ManagedOrder) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; center: GeoPoint } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const baseKey = `${selectedOrderId ?? "all"}:${center.lat}:${center.lon}`;
  const [manualPan, setManualPan] = useState<{ key: string; center: GeoPoint } | null>(null);
  const mapCenter = manualPan?.key === baseKey ? manualPan.center : center;
  const selected = orders.find((order) => order.id === selectedOrderId) ?? null;

  useEffect(() => {
    if (!rootRef.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);
  const centerPixel = project(mapCenter, zoom);
  const topLeft = { x: centerPixel.x - size.width / 2, y: centerPixel.y - size.height / 2 };
  const firstTileX = Math.floor(topLeft.x / TILE_SIZE);
  const firstTileY = Math.floor(topLeft.y / TILE_SIZE);
  const columns = Math.ceil(size.width / TILE_SIZE) + 2;
  const rows = Math.ceil(size.height / TILE_SIZE) + 2;
  const tileCount = 2 ** zoom;
  const tiles = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const tileX = firstTileX + column;
      const tileY = firstTileY + row;
      if (tileY < 0 || tileY >= tileCount) continue;
      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
      tiles.push({ key: `${zoom}-${tileX}-${tileY}`, src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`, left: tileX * TILE_SIZE - topLeft.x, top: tileY * TILE_SIZE - topLeft.y });
    }
  }
  const markerPosition = (point: GeoPoint) => {
    const pixel = project(point, zoom);
    return { left: size.width / 2 + pixel.x - centerPixel.x, top: size.height / 2 + pixel.y - centerPixel.y };
  };

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, center: mapCenter };
  }
  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const start = project(dragRef.current.center, zoom);
    const next = unproject({ x: start.x - (event.clientX - dragRef.current.x), y: start.y - (event.clientY - dragRef.current.y) }, zoom);
    setManualPan({ key: baseKey, center: next });
  }

  return <div className="relative min-h-[440px] flex-1 overflow-hidden bg-[#e8edf0] sm:min-h-[560px]" ref={rootRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} onWheel={(event) => { event.preventDefault(); onZoom(event.deltaY < 0 ? 1 : -1); }}>
    <div className="absolute inset-0 select-none touch-none cursor-grab active:cursor-grabbing">
      {tiles.map((tile) => <div key={tile.key} aria-hidden="true" className="pointer-events-none absolute bg-cover" style={{ width: TILE_SIZE, height: TILE_SIZE, left: tile.left, top: tile.top, backgroundImage: `url("${tile.src}")` }} />)}
      {orders.map((order) => {
        const isSelected = order.id === selectedOrderId;
        const pickup = order.pickup_latitude !== null && order.pickup_longitude !== null
          ? markerPosition({ lat: order.pickup_latitude, lon: order.pickup_longitude })
          : order.store?.latitude != null && order.store.longitude != null ? markerPosition({ lat: order.store.latitude, lon: order.store.longitude }) : null;
        const customer = order.delivery_latitude !== null && order.delivery_longitude !== null ? markerPosition({ lat: order.delivery_latitude, lon: order.delivery_longitude }) : null;
        const rider = order.rider_latitude !== null && order.rider_longitude !== null ? markerPosition({ lat: order.rider_latitude, lon: order.rider_longitude }) : null;
        const route = [pickup, rider, customer].filter((point): point is { left: number; top: number } => point !== null);
        return <div key={order.id}>
          {route.length > 1 && <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full"><polyline points={route.map((point) => `${point.left},${point.top}`).join(" ")} fill="none" stroke={isSelected ? "#03162F" : "#64748b"} strokeWidth={isSelected ? 4 : 2} strokeDasharray="8 7" strokeLinecap="round" opacity={isSelected ? 0.8 : 0.55} /></svg>}
          {pickup && <button type="button" title={`${order.pickup_address ? "Collection point" : order.store?.name || "Store"} · route start`} onClick={() => onSelectOrder(order)} className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white p-1.5 text-[#03162F] shadow-lg transition ${isSelected ? "scale-125 bg-[#D4AF37] ring-4 ring-amber-300/60" : "bg-[#D4AF37] hover:scale-110"}`} style={{ left: pickup.left, top: pickup.top }}>{order.pickup_address ? <MapPin className="h-4 w-4" /> : <Store className="h-4 w-4" />}</button>}
          {customer && <button type="button" title={`${order.customers?.full_name || "Customer"} · destination`} onClick={() => onSelectOrder(order)} className={`absolute z-20 -translate-x-1/2 -translate-y-full rounded-full border-[3px] border-white p-1.5 text-white shadow-lg transition ${isSelected ? "scale-125 bg-rose-600 ring-4 ring-rose-300/60" : "bg-rose-600 hover:scale-110"}`} style={{ left: customer.left, top: customer.top }}><MapPin className="h-4 w-4" /></button>}
          {rider && <button type="button" title={`${order.rider?.full_name || "Rider"} · ${order.delivery_status}`} onClick={() => onSelectOrder(order)} className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white p-1.5 text-white shadow-lg transition ${isSelected ? "scale-125 bg-blue-700 ring-4 ring-blue-300/60" : "bg-blue-700 hover:scale-110"}`} style={{ left: rider.left, top: rider.top }}><Bike className="h-4 w-4" /></button>}
        </div>;
      })}
    </div>
    <div className="absolute right-3 top-3 z-30 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"><button type="button" aria-label="Zoom in" onClick={() => onZoom(1)} className="p-2.5 text-slate-700 hover:bg-slate-100"><Plus className="h-5 w-5" /></button><div className="h-px bg-slate-200" /><button type="button" aria-label="Zoom out" onClick={() => onZoom(-1)} className="p-2.5 text-slate-700 hover:bg-slate-100"><Minus className="h-5 w-5" /></button></div>
    <button type="button" onClick={onToggleFollow} className={`absolute right-3 top-[92px] z-30 inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold shadow-lg ${followRider ? "border-blue-800 bg-blue-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}><LocateFixed className="h-4 w-4" />{followRider ? "Following rider" : "Follow rider"}</button>
    {selected && <div className="absolute bottom-9 left-3 z-30 max-w-[calc(100%-24px)] rounded-xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-wide text-[#9A7412]">Selected delivery · {selected.delivery_status || selected.status}</p><p className="mt-1 truncate text-sm font-black text-[#03162F]">{selected.customers?.full_name || "Customer"} <span className="font-medium text-slate-500">· Rider: {selected.rider?.full_name || "Unassigned"}</span></p><p className="mt-1 max-w-lg truncate text-xs text-slate-600">{selected.delivery_address || "Customer pinned destination"}</p><button type="button" onClick={() => onManageOrder(selected)} className="mt-2 rounded-lg bg-[#03162F] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#0a2b52]">Manage delivery</button></div>}
    <div className="absolute bottom-2 right-2 z-30 rounded bg-white/90 px-2 py-1 text-[9px] text-slate-600 shadow">© OpenStreetMap contributors</div>
  </div>;
}

export default function LiveTrackingBoard({ orders, riders, presence, selectedOrderId, onSelectOrder, onManageOrder }: { orders: ManagedOrder[]; riders: DeliveryRider[]; presence: Record<string, RiderPresence>; selectedOrderId: string | null; onSelectOrder: (orderId: string) => void; onManageOrder: (order: ManagedOrder) => void }) {
  const [now, setNow] = useState(0);
  const [activeList, setActiveList] = useState<"Drivers" | "Orders">("Drivers");
  const [riderFilter, setRiderFilter] = useState<"All" | "Online" | "En Route">("All");
  const [zoom, setZoom] = useState(13);
  const [followRider, setFollowRider] = useState(true);
  const activeDeliveries = orders.filter((order) => order.fulfillment_method === "Delivery" && order.rider_employee_id && !["Completed", "Cancelled"].includes(order.status) && !["Delivered", "Delivery Failed"].includes(order.delivery_status || ""));
  const trackedOrders = orders.filter((order) => order.fulfillment_method === "Delivery" && order.delivery_latitude !== null && order.delivery_longitude !== null && (!['Completed', 'Cancelled'].includes(order.status) || order.id === selectedOrderId));
  const selectedOrder = trackedOrders.find((order) => order.id === selectedOrderId) ?? activeDeliveries[0] ?? trackedOrders[0] ?? null;
  const selectedPosition = followRider && selectedOrder?.rider_latitude !== null && selectedOrder?.rider_latitude !== undefined && selectedOrder.rider_longitude !== null
    ? { lat: selectedOrder.rider_latitude, lon: selectedOrder.rider_longitude }
    : selectedOrder?.pickup_latitude !== null && selectedOrder?.pickup_latitude !== undefined && selectedOrder.pickup_longitude !== null && selectedOrder.delivery_latitude !== null && selectedOrder.delivery_longitude !== null
      ? { lat: (selectedOrder.pickup_latitude + selectedOrder.delivery_latitude) / 2, lon: (selectedOrder.pickup_longitude + selectedOrder.delivery_longitude) / 2 }
    : selectedOrder?.delivery_latitude !== null && selectedOrder?.delivery_latitude !== undefined && selectedOrder.delivery_longitude !== null
      ? { lat: selectedOrder.delivery_latitude, lon: selectedOrder.delivery_longitude }
      : FALLBACK_CENTER;
  const center = selectedPosition;

  useEffect(() => {
    const ready = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => { clearTimeout(ready); clearInterval(timer); };
  }, []);
  const onlineCount = riders.filter((rider) => {
    const live = rider.user_id ? presence[rider.user_id] : undefined;
    return Boolean(now && live && now - new Date(live.lastSeen).getTime() < 60000);
  }).length;
  const visibleRiders = riders.filter((rider) => {
    const { online, activity } = statusFor(rider, orders, presence, now);
    if (riderFilter === "Online") return online;
    if (riderFilter === "En Route") return activity === "Out for Delivery" || activity === "Picked Up";
    return true;
  });

  function selectOrder(order: ManagedOrder) {
    onSelectOrder(order.id);
    setFollowRider(true);
  }

  return <div className="border-b border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#F7F9FC] px-4 py-3 sm:px-5"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-lg bg-[#03162F] px-3 py-2 text-xs font-bold text-white"><Radio className="h-3.5 w-3.5 animate-pulse text-emerald-300" />Dispatch map</span><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">{onlineCount} online</span><span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800">{activeDeliveries.length} active deliveries</span></div><p className="text-xs text-slate-500">GPS updates while riders are en route</p></div>
    <div className="grid min-h-[560px] lg:grid-cols-[310px_minmax(0,1fr)]">
      <aside className="flex min-h-[420px] flex-col border-b border-slate-200 bg-white lg:min-h-0 lg:border-b-0 lg:border-r">
        <div className="grid grid-cols-2 border-b border-slate-200"><button type="button" onClick={() => setActiveList("Drivers")} className={`inline-flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold ${activeList === "Drivers" ? "border-b-2 border-[#D4AF37] text-[#03162F]" : "text-slate-500 hover:bg-slate-50"}`}><Bike className="h-4 w-4" />Drivers <span className="text-xs text-slate-400">{riders.length}</span></button><button type="button" onClick={() => setActiveList("Orders")} className={`inline-flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold ${activeList === "Orders" ? "border-b-2 border-[#D4AF37] text-[#03162F]" : "text-slate-500 hover:bg-slate-50"}`}><ShoppingBag className="h-4 w-4" />Orders <span className="text-xs text-slate-400">{activeDeliveries.length}</span></button></div>
        {activeList === "Drivers" ? <><div className="flex gap-1 overflow-x-auto border-b border-slate-100 p-2">{(["All", "Online", "En Route"] as const).map((filter) => <button key={filter} type="button" onClick={() => setRiderFilter(filter)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${riderFilter === filter ? "bg-[#03162F] text-white" : "text-slate-500 hover:bg-slate-100"}`}>{filter}{filter === "Online" ? ` (${onlineCount})` : filter === "En Route" ? ` (${riders.filter((rider) => ["Out for Delivery", "Picked Up"].includes(statusFor(rider, orders, presence, now).activity)).length})` : ""}</button>)}</div><div className="flex-1 overflow-y-auto">{visibleRiders.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No riders in this view.</p> : visibleRiders.map((rider) => {
          const { online, order, activity } = statusFor(rider, orders, presence, now);
          const active = order?.id === selectedOrder?.id;
          return <button key={rider.id} type="button" onClick={() => order && selectOrder(order)} className={`flex w-full items-center gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left transition ${active ? "bg-amber-50" : "hover:bg-slate-50"}`}><span className={`min-w-[72px] rounded-md px-2 py-1 text-center text-[10px] font-black uppercase text-white ${!online ? "bg-slate-400" : activity === "Out for Delivery" ? "bg-blue-700" : activity === "Preparing" || activity === "Ready" ? "bg-amber-500" : "bg-teal-600"}`}>{!online ? "Offline" : activity === "Out for Delivery" ? "En route" : activity}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#03162F]">{rider.full_name}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{order ? `${order.customers?.full_name || "Customer"} · #${order.id.slice(0, 6).toUpperCase()}` : online ? "No active delivery" : "Last seen offline"}</span></span><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${online ? "border-teal-500 text-teal-700" : "border-slate-200 text-slate-400"}`}>{order ? "1" : "·"}</span></button>;
        })}</div></> : <div className="flex-1 overflow-y-auto">{activeDeliveries.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No active deliveries.</p> : activeDeliveries.map((order) => <button key={order.id} type="button" onClick={() => selectOrder(order)} className={`w-full border-b border-slate-100 p-3 text-left transition ${selectedOrder?.id === order.id ? "bg-amber-50" : "hover:bg-slate-50"}`}><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold text-[#03162F]">{order.customers?.full_name || "Customer"}</span><span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-800">{order.delivery_status || order.status}</span></span><span className="mt-1 block truncate text-xs text-slate-500">{order.rider?.full_name || "Unassigned rider"} · #{order.id.slice(0, 8).toUpperCase()}</span><span className="mt-1 block truncate text-[10px] text-slate-400">{order.delivery_address || "No delivery address"}</span></button>)}</div>}
        <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />Updates refresh automatically</span></div>
      </aside>
      <div className="relative flex min-h-[440px] flex-col lg:min-h-[560px]"><div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4"><div className="min-w-0"><p className="truncate text-sm font-bold text-[#03162F]">{selectedOrder ? `${selectedOrder.customers?.full_name || "Customer"} · ${selectedOrder.rider?.full_name || "Rider"}` : "All rider locations"}</p><p className="mt-0.5 text-[10px] text-slate-500">{selectedOrder?.rider_location_updated_at ? timeAgo(selectedOrder.rider_location_updated_at, now) : "Select a driver or order to follow its location"}</p></div><span className="hidden items-center gap-3 sm:flex"><span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700"><Store className="h-3.5 w-3.5" />Store / collection</span><span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-800"><Bike className="h-3.5 w-3.5" />Rider</span><span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700"><MapPin className="h-3.5 w-3.5" />Customer</span><span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500"><Navigation className="h-3.5 w-3.5" />Drag map to move</span></span></div><LiveMap orders={trackedOrders} center={center} zoom={zoom} onZoom={(direction) => setZoom((value) => clamp(value + direction, 3, 18))} onSelectOrder={selectOrder} selectedOrderId={selectedOrder?.id ?? null} followRider={followRider} onToggleFollow={() => setFollowRider((value) => !value)} onManageOrder={(order) => onManageOrder(order)} /></div>
    </div>
  </div>;
}
