"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bike,
  Check,
  CheckCircle2,
  Clock3,
  Plus,
  MapPin,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
  RefreshCw,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { DeliveryRider, ManagedOrder } from "../services/order.service";
import { updateOrderAction } from "../services/order.actions";
import { createAdminOrderAction } from "../services/order.actions";
import DeliveryLocationPicker from "@/components/customer/DeliveryLocationPicker";
import LiveTrackingBoard, { type RiderPresence } from "./LiveTrackingBoard";

const ORDER_STATUSES = ["Pending", "Confirmed", "Processing", "Ready", "Completed", "Cancelled"];
const PAYMENT_STATUSES = ["Pending", "Partial", "Paid", "Refunded"];
const money = (amount: number) => `ZMW ${Number(amount || 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ORDER_VIEWS = ["All Orders", "New", "Assigned", "Order Preparing", "En Route", "Live Tracking", "Delivered", "Pickup"] as const;
type OrderView = (typeof ORDER_VIEWS)[number];
type OrderCustomer = { id: string; full_name: string | null; phone: string | null; address: string | null };
type OrderBusiness = { id: string; name: string };
type OrderCatalogItem = { id: string; name: string; business_id: string; item_type: string | null; base_price: number | null; status: string | null };
type OrderStore = { id: string; name: string; business_id: string; address: string | null; city: string | null; latitude: number | null; longitude: number | null };
type AddressSuggestion = { label: string; latitude: number; longitude: number };

function matchesOrderView(order: ManagedOrder, view: OrderView) {
  if (view === "All Orders") return true;
  if (view === "New") return order.status === "Pending"
    && (order.fulfillment_method !== "Delivery" || !order.rider_employee_id);
  if (view === "Assigned") return order.fulfillment_method === "Delivery"
    && Boolean(order.rider_employee_id)
    && !["Processing", "Ready", "Completed", "Cancelled"].includes(order.status)
    && !["Picked Up", "Out for Delivery", "Delivered", "Delivery Failed"].includes(order.delivery_status || "");
  if (view === "Order Preparing") return order.status === "Processing"
    || (order.fulfillment_method === "Delivery" && order.status === "Ready" && order.delivery_status !== "Out for Delivery")
    || (order.fulfillment_method === "Delivery" && order.delivery_status === "Preparing");
  if (view === "En Route") return ["Picked Up", "Out for Delivery"].includes(order.delivery_status || "");
  if (view === "Live Tracking") return order.fulfillment_method === "Delivery"
    && Boolean(order.rider_employee_id)
    && !["Completed", "Cancelled"].includes(order.status)
    && !["Delivered", "Delivery Failed"].includes(order.delivery_status || "");
  if (view === "Delivered") return order.fulfillment_method === "Delivery"
    && (order.delivery_status === "Delivered" || order.status === "Completed");
  return order.fulfillment_method !== "Delivery" && order.status === "Completed";
}

function statusStyle(status: string) {
  if (["Completed", "Delivered", "Paid"].includes(status)) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (["Cancelled", "Delivery Failed", "Refunded"].includes(status)) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (["Processing", "Out for Delivery", "Picked Up", "Rider Assigned"].includes(status)) return "bg-blue-50 text-blue-700 ring-blue-200";
  if (["Ready", "Confirmed", "Preparing"].includes(status)) return "bg-violet-50 text-violet-700 ring-violet-200";
  return "bg-amber-50 text-amber-800 ring-amber-200";
}

export default function OrdersManager({ orders, riders, customers, businesses, catalog, stores }: { orders: ManagedOrder[]; riders: DeliveryRider[]; customers: OrderCustomer[]; businesses: OrderBusiness[]; catalog: OrderCatalogItem[]; stores: OrderStore[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [orderView, setOrderView] = useState<OrderView>("All Orders");
  const [message, setMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [liveTrackingOrderId, setLiveTrackingOrderId] = useState<string | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newBusinessId, setNewBusinessId] = useState("");
  const [newStoreId, setNewStoreId] = useState("");
  const [newFulfillment, setNewFulfillment] = useState<"Pickup" | "Delivery">("Pickup");
  const [newAddress, setNewAddress] = useState("");
  const [selectedAddressSuggestion, setSelectedAddressSuggestion] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState("");
  const [newLatitude, setNewLatitude] = useState<number | null>(null);
  const [newLongitude, setNewLongitude] = useState<number | null>(null);
  const [newNotes, setNewNotes] = useState("");
  const [newQuantities, setNewQuantities] = useState<Record<string, number>>({});
  const [riderPickerOpen, setRiderPickerOpen] = useState(false);
  const [returnToOrderDetails, setReturnToOrderDetails] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [riderPresence, setRiderPresence] = useState<Record<string, RiderPresence>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const query = newAddress.trim();
    if (newFulfillment !== "Delivery" || query.length < 3 || query === selectedAddressSuggestion) {
      const timer = window.setTimeout(() => { setAddressSuggestions([]); setAddressSearchLoading(false); }, 0);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAddressSearchLoading(true);
      setAddressSearchError("");
      try {
        const params = new URLSearchParams({ q: query, limit: "6", lang: "en", lat: "-15.4167", lon: "28.2833", zoom: "12" });
        const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Address suggestions are temporarily unavailable.");
        const result = await response.json() as { features?: Array<{ geometry?: { coordinates?: number[] }; properties?: Record<string, string | undefined> }> };
        const suggestions = (result.features ?? []).flatMap((feature) => {
          const coordinates = feature.geometry?.coordinates;
          if (!coordinates || coordinates.length < 2) return [];
          const props = feature.properties ?? {};
          const locality = [props.street, props.housenumber, props.district, props.city, props.state, props.country].filter(Boolean).join(", ");
          const label = [props.name, locality].filter(Boolean).join(", ");
          return label ? [{ label, longitude: Number(coordinates[0]), latitude: Number(coordinates[1]) }] : [];
        });
        setAddressSuggestions(suggestions);
      } catch (error) {
        if (!controller.signal.aborted) {
          setAddressSuggestions([]);
          setAddressSearchError(error instanceof Error ? error.message : "Address suggestions are temporarily unavailable.");
        }
      } finally {
        if (!controller.signal.aborted) setAddressSearchLoading(false);
      }
    }, 650);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [newAddress, newFulfillment, selectedAddressSuggestion]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-customer-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => router.refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [router]);

  useEffect(() => {
    const channel = supabase.channel("aeos-rider-presence", { config: { presence: { key: "orders-admin" } } });
    const syncPresence = () => {
      const current = channel.presenceState<RiderPresence>();
      const next: Record<string, RiderPresence> = {};
      for (const presence of Object.values(current).flat()) {
        if (presence.userId && presence.employeeId) next[presence.userId] = presence;
      }
      setRiderPresence(next);
    };
    channel.on("presence", { event: "sync" }, syncPresence).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "All statuses" || order.status === statusFilter;
      const matchesView = matchesOrderView(order, orderView);
      const matchesSearch = !query || [order.id, order.customers?.full_name, order.customers?.phone, order.businesses?.name, ...order.order_items.map((item) => item.enterprise_catalog?.name)].some((value) => value?.toLowerCase().includes(query));
      return matchesView && matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter, orderView]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;
  // Riders can fulfil deliveries across the enterprise, even when their HR
  // record is linked to a different business (for example, Delivery Service).
  const availableRiders = selectedOrder ? riders : [];

  function createOrder() {
    setMessage("");
    const items = Object.entries(newQuantities).filter(([, quantity]) => quantity > 0).map(([catalogItemId, quantity]) => ({ catalogItemId, quantity }));
    startTransition(async () => {
      const result = await createAdminOrderAction({ customerId: customerMode === "existing" ? newCustomerId : undefined, newCustomer: customerMode === "new" ? { fullName: newCustomerName, phone: newCustomerPhone, email: newCustomerEmail, address: newAddress } : undefined, businessId: newBusinessId, storeBranchId: newStoreId || undefined, fulfillmentMethod: newFulfillment, deliveryAddress: newAddress, deliveryLatitude: newLatitude, deliveryLongitude: newLongitude, notes: newNotes, items });
      if (!result.success) { setMessage(result.error || "Could not create this order."); return; }
      setCreateOrderOpen(false);
      setNewQuantities({}); setNewAddress(""); setSelectedAddressSuggestion(""); setNewLatitude(null); setNewLongitude(null); setNewNotes("");
      setOrderView("New");
      setMessage(`Order ${result.orderId?.slice(0, 8).toUpperCase() || ""} created successfully.`);
      router.refresh();
    });
  }

  function update(orderId: string, updates: { status?: string; payment_status?: string; rider_employee_id?: string | null; delivery_status?: string }, onSuccess?: () => void) {
    setMessage("");
    startTransition(async () => {
      const result = await updateOrderAction(orderId, updates);
      if (!result.success) {
        setMessage(result.error || "Could not update this order.");
        return;
      }
      setMessage("Order updated successfully.");
      onSuccess?.();
      router.refresh();
    });
  }

  function closeOrder() {
    if (isPending) return;
    setSelectedOrderId(null);
    setOrderDetailsOpen(false);
    setRiderPickerOpen(false);
    setMessage("");
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <nav aria-label="Order workflow" className="flex overflow-x-auto border-b-2 border-[#D4AF37] bg-[#03162F] px-2 pt-2 sm:px-3">
          {ORDER_VIEWS.map((view) => {
            const count = orders.filter((order) => matchesOrderView(order, view)).length;
            const active = orderView === view;
            return <button key={view} type="button" role="tab" aria-selected={active} onClick={() => setOrderView(view)} className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-xl px-3.5 py-3 text-sm font-semibold transition sm:px-5 ${active ? "bg-white text-[#03162F] after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-[#D4AF37]" : "text-white/85 hover:bg-white/10 hover:text-white"}`}><span>{view}</span><span className={`text-xs ${active ? "font-bold text-[#9A7412]" : "text-white/60"}`}>({count})</span></button>;
          })}
        </nav>
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, business, item or order ID" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20" />
          </label>
          <select aria-label="Filter orders by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#D4AF37]">
            <option>All statuses</option>{ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
          <button type="button" onClick={() => router.refresh()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#03162F] transition hover:border-[#D4AF37] hover:bg-amber-50"><RefreshCw className="h-4 w-4" />Refresh</button>
          <button type="button" onClick={() => { setMessage(""); setCreateOrderOpen(true); }} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0a2b52]"><Plus className="h-4 w-4" />New order</button>
        </div>
        {message && <p role="status" className="border-b border-slate-100 px-4 py-2.5 text-sm text-[#03162F]">{message}</p>}
        {orderView === "Live Tracking" ? <LiveTrackingBoard orders={orders} riders={riders} presence={riderPresence} selectedOrderId={liveTrackingOrderId} onSelectOrder={setLiveTrackingOrderId} onManageOrder={(order) => { setSelectedOrderId(order.id); setSelectedRiderId(order.rider_employee_id ?? ""); setOrderDetailsOpen(true); setMessage(""); }} /> : filteredOrders.length === 0 ? (
          <div className="p-12 text-center"><ShoppingBag className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 font-bold text-[#03162F]">No customer orders found</h2><p className="mt-1 text-sm text-slate-500">Orders placed through the customer interface will appear here.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] border-collapse text-left">
              <thead className="bg-[#F5F7FA] text-[11px] font-bold uppercase tracking-[0.08em] text-[#03162F]/75">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">#</th>
                  <th className="border-b border-slate-200 px-4 py-3">Order</th>
                  <th className="border-b border-slate-200 px-4 py-3">Customer</th>
                  <th className="border-b border-slate-200 px-4 py-3">Live map</th>
                  <th className="border-b border-slate-200 px-4 py-3">Driver</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Delivery value</th>
                  <th className="border-b border-slate-200 px-4 py-3">Store</th>
                  <th className="border-b border-slate-200 px-4 py-3">Source</th>
                  <th className="border-b border-slate-200 px-4 py-3">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map((order, index) => (
                  <tr key={order.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-semibold text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3.5"><span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-600">{order.id.slice(0, 8).toUpperCase()}</span><p className="mt-1 text-[11px] text-slate-400">{new Date(order.created_at).toLocaleDateString("en-ZM")}</p></td>
                    <td className="px-4 py-3.5"><p className="font-bold text-[#03162F]">{order.customers?.full_name || "Customer"}</p><p className="mt-0.5 text-xs text-slate-500">{order.customers?.phone || "No phone provided"}</p></td>
                    <td className="px-4 py-3.5">{order.fulfillment_method !== "Delivery" ? <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-500"><MapPin className="h-3.5 w-3.5" />Store pickup</span> : order.delivery_latitude !== null && order.delivery_longitude !== null ? <button type="button" title="View customer location in live tracking" onClick={() => { setLiveTrackingOrderId(order.id); setOrderView("Live Tracking"); }} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 transition hover:border-blue-400 hover:bg-blue-100"><MapPin className="h-3.5 w-3.5" />View location</button> : <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-800"><MapPin className="h-3.5 w-3.5" />No pin shared</span>}</td>
                    <td className="px-4 py-3.5">{order.fulfillment_method !== "Delivery" ? <span className="text-xs font-semibold text-slate-500">Pickup</span> : order.rider ? <><p className="font-semibold text-slate-700">{order.rider.full_name}</p><p className="mt-0.5 text-xs text-slate-500">{order.rider.phone || "Delivery rider"}</p></> : <span className="text-xs text-slate-400">Unassigned</span>}</td>
                    <td className="px-4 py-3.5 text-right font-black tabular-nums text-[#03162F]">{money(order.total_amount)}</td>
                    <td className="max-w-44 truncate px-4 py-3.5 font-medium text-slate-700" title={order.businesses?.name || "Business"}>{order.businesses?.name || "Business"}</td>
                    <td className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600"><Truck className="h-3.5 w-3.5 text-slate-400" />Customer app · {order.fulfillment_method}</span></td>
                    <td className="px-4 py-3.5"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyle(order.status)}`}>{order.status}</span>{order.fulfillment_method === "Delivery" && <p className="mt-1.5 text-[11px] text-slate-500">{order.delivery_status || "Not Started"}</p>}</td>
                    <td className="px-4 py-3.5"><div className="flex items-center justify-end gap-2">
                      {order.fulfillment_method === "Delivery" && <button type="button" disabled={isPending} onClick={() => { setSelectedOrderId(order.id); setSelectedRiderId(order.rider_employee_id ?? ""); setOrderDetailsOpen(false); setRiderPickerOpen(true); setReturnToOrderDetails(false); setMessage(""); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-[#03162F] transition hover:border-[#03162F]/30 hover:bg-slate-50 disabled:opacity-50"><Bike className="h-3.5 w-3.5" />Assign</button>}
                      <button type="button" onClick={() => { setSelectedOrderId(order.id); setSelectedRiderId(order.rider_employee_id ?? ""); setOrderDetailsOpen(true); setMessage(""); }} className="shrink-0 rounded-lg bg-[#03162F] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#0a2b52]">View</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedOrder && orderDetailsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeOrder(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="order-dialog-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9A7412]">Order details</p><h2 id="order-dialog-title" className="mt-1 truncate text-xl font-black text-[#03162F]">{selectedOrder.customers?.full_name || "Customer"}</h2><p className="mt-1 text-xs text-slate-500">{selectedOrder.businesses?.name || "Business"} · {selectedOrder.id.slice(0, 8).toUpperCase()}</p></div>
              <button type="button" onClick={closeOrder} aria-label="Close order details" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X className="h-5 w-5" /></button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              {message && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{message}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order total</p><p className="mt-1 text-xl font-black text-[#03162F]">{money(selectedOrder.total_amount)}</p><p className="mt-1 text-xs text-slate-500">{selectedOrder.order_items.length} item{selectedOrder.order_items.length === 1 ? "" : "s"} · {selectedOrder.fulfillment_method}</p></div>
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer contact</p><p className="mt-1 font-bold text-[#03162F]">{selectedOrder.customers?.full_name || "Customer"}</p><p className="mt-1 text-sm text-slate-600">{selectedOrder.customers?.phone || selectedOrder.customers?.email || "No contact details"}</p></div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-[#03162F]">Items</div>
                <ul className="divide-y divide-slate-100">
                  {selectedOrder.order_items.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.enterprise_catalog?.name || "Item"}</p><p className="mt-0.5 text-xs text-slate-500">Quantity {item.quantity} · {money(item.unit_price)} each</p></div><p className="shrink-0 text-sm font-bold text-[#03162F]">{money(item.total_price)}</p></li>)}
                </ul>
              </div>

              {selectedOrder.fulfillment_method === "Delivery" && <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" /><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-blue-800">Delivery details</p><p className="mt-1 break-words text-sm text-slate-700">{selectedOrder.delivery_address || "Delivery address not provided"}</p>
                  {selectedOrder.delivery_latitude !== null && selectedOrder.delivery_longitude !== null && <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${selectedOrder.delivery_latitude}&mlon=${selectedOrder.delivery_longitude}#map=17/${selectedOrder.delivery_latitude}/${selectedOrder.delivery_longitude}`} className="mt-2 inline-flex text-xs font-semibold text-blue-700 hover:underline">Open pinned location</a>}
                  {selectedOrder.rider ? <p className="mt-2 text-sm font-semibold text-emerald-700">Rider: {selectedOrder.rider.full_name}{selectedOrder.rider.phone ? ` · ${selectedOrder.rider.phone}` : ""}</p> : <p className="mt-2 text-xs text-amber-800">No rider assigned</p>}
                </div></div>
                {selectedOrder.delivery_latitude !== null && selectedOrder.delivery_longitude !== null && <iframe title={`Customer pinned map for order ${selectedOrder.id.slice(0, 8)}`} src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedOrder.delivery_longitude - 0.006}%2C${selectedOrder.delivery_latitude - 0.004}%2C${selectedOrder.delivery_longitude + 0.006}%2C${selectedOrder.delivery_latitude + 0.004}&layer=mapnik&marker=${selectedOrder.delivery_latitude}%2C${selectedOrder.delivery_longitude}`} loading="lazy" className="mt-4 h-52 w-full rounded-xl border border-slate-200 bg-slate-100" />}
              </div>}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-500">Payment status<select disabled={isPending} value={selectedOrder.payment_status} onChange={(event) => update(selectedOrder.id, { payment_status: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#03162F] disabled:opacity-60">{PAYMENT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
              </div>
              {selectedOrder.notes && <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Customer notes</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{selectedOrder.notes}</p></div>}
            </div>

            <footer className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={isPending || ["Confirmed", "Processing", "Ready", "Completed", "Cancelled"].includes(selectedOrder.status)} onClick={() => update(selectedOrder.id, { status: "Confirmed" })} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45"><Check className="h-4 w-4" />Confirm</button>
                  {selectedOrder.fulfillment_method === "Delivery" ? <>
                    <button type="button" disabled={isPending} onClick={() => { setOrderDetailsOpen(false); setRiderPickerOpen(true); setSelectedRiderId(selectedOrder.rider_employee_id ?? ""); setReturnToOrderDetails(true); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-[#03162F] transition hover:bg-slate-100 disabled:opacity-50"><Bike className="h-4 w-4" />{selectedOrder.rider_employee_id ? "Change rider" : "Assign rider"}</button>
                    <span className="w-full pt-1 text-[10px] font-bold uppercase tracking-wide text-[#9A7412]">Admin delivery controls · use if the rider app is unavailable</span>
                    <button type="button" disabled={isPending || ["Processing", "Ready", "Completed", "Cancelled"].includes(selectedOrder.status)} onClick={() => update(selectedOrder.id, { status: "Processing", delivery_status: "Preparing" })} className="inline-flex items-center gap-2 rounded-lg bg-[#03162F] px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0a2b52] disabled:cursor-not-allowed disabled:opacity-45"><Clock3 className="h-4 w-4" />Mark preparing</button>
                    <button type="button" disabled={isPending || !["Pending", "Confirmed", "Processing"].includes(selectedOrder.status)} onClick={() => update(selectedOrder.id, { status: "Ready", delivery_status: "Preparing" })} className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-amber-50 px-3.5 py-2.5 text-sm font-bold text-[#735800] transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-45"><PackageCheck className="h-4 w-4" />Mark ready</button>
                    <button type="button" disabled={isPending || !selectedOrder.rider_employee_id || selectedOrder.status !== "Ready" || selectedOrder.delivery_status === "Out for Delivery"} onClick={() => update(selectedOrder.id, { status: "Ready", delivery_status: "Out for Delivery" })} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-45"><Truck className="h-4 w-4" />Dispatch delivery</button>
                    <button type="button" disabled={isPending || selectedOrder.delivery_status !== "Out for Delivery"} onClick={() => update(selectedOrder.id, { status: "Completed", delivery_status: "Delivered" })} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45"><CheckCircle2 className="h-4 w-4" />Complete delivery</button>
                  </> : <>
                    <button type="button" disabled={isPending || ["Processing", "Ready", "Completed", "Cancelled"].includes(selectedOrder.status)} onClick={() => update(selectedOrder.id, { status: "Processing" })} className="inline-flex items-center gap-2 rounded-lg bg-[#03162F] px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0a2b52] disabled:cursor-not-allowed disabled:opacity-45"><Clock3 className="h-4 w-4" />Start processing</button>
                    <button type="button" disabled={isPending || ["Ready", "Completed", "Cancelled"].includes(selectedOrder.status)} onClick={() => update(selectedOrder.id, { status: "Ready" })} className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-amber-50 px-3.5 py-2.5 text-sm font-bold text-[#735800] transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-45"><PackageCheck className="h-4 w-4" />Mark ready</button>
                    <button type="button" disabled={isPending || ["Completed", "Cancelled"].includes(selectedOrder.status)} onClick={() => update(selectedOrder.id, { status: "Completed" })} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45"><CheckCircle2 className="h-4 w-4" />Complete pickup</button>
                  </>}
                  <button type="button" disabled={isPending || ["Completed", "Cancelled"].includes(selectedOrder.status)} onClick={() => update(selectedOrder.id, { status: "Cancelled" })} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3.5 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"><X className="h-4 w-4" />Cancel</button>
                </div>
                <button type="button" onClick={closeOrder} disabled={isPending} className="self-start rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50 xl:self-auto">Close</button>
              </div>
            </footer>
          </section>

        </div>
      )}

      {createOrderOpen && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) setCreateOrderOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="create-order-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9A7412]">Admin order entry</p><h2 id="create-order-title" className="mt-1 text-xl font-black text-[#03162F]">Create collection or delivery</h2><p className="mt-1 text-sm text-slate-500">Create an order for a customer and add it to the live dispatch queue.</p></div><button type="button" disabled={isPending} onClick={() => setCreateOrderOpen(false)} aria-label="Close create order" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></header>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            {message && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">{message}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><div className="mb-2 flex w-fit rounded-lg bg-slate-100 p-1"><button type="button" onClick={() => setCustomerMode("existing")} className={`rounded-md px-3 py-1.5 text-xs font-bold ${customerMode === "existing" ? "bg-white text-[#03162F] shadow-sm" : "text-slate-500"}`}>Existing customer</button><button type="button" onClick={() => setCustomerMode("new")} className={`rounded-md px-3 py-1.5 text-xs font-bold ${customerMode === "new" ? "bg-white text-[#03162F] shadow-sm" : "text-slate-500"}`}>New customer</button></div>
                {customerMode === "existing" ? <div><label className="block text-xs font-semibold text-slate-600">Customer<select value={newCustomerId} onChange={(event) => { const customerId = event.target.value; setNewCustomerId(customerId); const customer = customers.find((entry) => entry.id === customerId); if (customer?.address) setNewAddress(customer.address); }} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800"><option value="">Choose customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name || "Customer"}</option>)}</select></label><p className="mt-1 text-xs text-slate-500">{customers.length} AEOS customer{customers.length === 1 ? "" : "s"} available</p>{customers.length === 0 && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">No customer records were returned. Check admin access to the AEOS customer directory.</p>}</div> : <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs font-semibold text-slate-600">Full name<input value={newCustomerName} onChange={(event) => setNewCustomerName(event.target.value)} required placeholder="Customer name" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-slate-600">Phone<input value={newCustomerPhone} onChange={(event) => setNewCustomerPhone(event.target.value)} required placeholder="Phone number" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-slate-600">Email (optional)<input type="email" value={newCustomerEmail} onChange={(event) => setNewCustomerEmail(event.target.value)} placeholder="Email address" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" /></label></div>}</div>
              <label className="text-xs font-semibold text-slate-600">Business<select value={newBusinessId} onChange={(event) => { const businessId = event.target.value; setNewBusinessId(businessId); setNewQuantities({}); setNewStoreId(stores.find((store) => store.business_id === businessId)?.id || ""); }} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800"><option value="">Choose business</option>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select></label>
              <label className="text-xs font-semibold text-slate-600">Store / branch<select disabled={!newBusinessId} value={newStoreId} onChange={(event) => setNewStoreId(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 disabled:bg-slate-50"><option value="">{newBusinessId ? "Choose store" : "Choose a business first"}</option>{stores.filter((store) => store.business_id === newBusinessId).map((store) => <option key={store.id} value={store.id}>{store.name}{store.city ? ` · ${store.city}` : ""}</option>)}</select></label>
            </div>
            <fieldset><legend className="text-xs font-semibold text-slate-600">Fulfillment</legend><div className="mt-2 grid grid-cols-2 gap-3">{(["Pickup", "Delivery"] as const).map((method) => <button key={method} type="button" onClick={() => setNewFulfillment(method)} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${newFulfillment === method ? "border-[#03162F] bg-[#03162F] text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>{method === "Pickup" ? "Customer collection" : "Delivery"}</button>)}</div></fieldset>
            {newFulfillment === "Delivery" && <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-bold text-[#03162F]">Customer delivery location</h3><p className="mt-0.5 text-xs text-slate-500">Use the saved customer address, choose a place suggestion, or pin the exact drop-off point.</p></div>{customers.find((customer) => customer.id === newCustomerId)?.address && <button type="button" onClick={() => { const address = customers.find((customer) => customer.id === newCustomerId)?.address || ""; setNewAddress(address); setSelectedAddressSuggestion(address); }} className="text-xs font-bold text-blue-700 hover:underline">Use saved address</button>}</div><div className="relative"><label className="block text-xs font-semibold text-slate-600">Address / directions<input value={newAddress} onChange={(event) => { setNewAddress(event.target.value); setSelectedAddressSuggestion(""); setNewLatitude(null); setNewLongitude(null); }} placeholder="Start typing a street, area, or landmark" autoComplete="off" className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" /></label>{(addressSearchLoading || addressSuggestions.length > 0 || addressSearchError) && <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">{addressSearchLoading && <p className="px-3 py-2 text-xs text-slate-500">Finding nearby places…</p>}{addressSuggestions.map((suggestion) => <button key={`${suggestion.label}-${suggestion.latitude}`} type="button" onClick={() => { setNewAddress(suggestion.label); setSelectedAddressSuggestion(suggestion.label); setNewLatitude(suggestion.latitude); setNewLongitude(suggestion.longitude); setAddressSuggestions([]); }} className="block w-full border-t border-slate-100 px-3 py-2.5 text-left text-xs text-slate-700 transition first:border-0 hover:bg-blue-50"><span className="block font-semibold">{suggestion.label}</span><span className="mt-0.5 block text-[10px] text-slate-400">Use this address and map pin</span></button>)}{addressSearchError && <p className="px-3 py-2 text-xs text-amber-700">{addressSearchError}</p>}</div>}</div><div><p className="mb-2 text-xs font-semibold text-slate-600">Pinned map location</p><DeliveryLocationPicker latitude={newLatitude} longitude={newLongitude} onChange={(latitude, longitude) => { setNewLatitude(latitude); setNewLongitude(longitude); }} />{newLatitude !== null && newLongitude !== null && <p className="mt-2 text-xs font-medium text-emerald-700">Customer pin: {newLatitude.toFixed(6)}, {newLongitude.toFixed(6)}</p>}</div></div>}
            <div><h3 className="text-sm font-bold text-[#03162F]">Order items</h3><p className="mt-1 text-xs text-slate-500">Prices are confirmed from the selected business catalog.</p><div className="mt-2 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">{!newBusinessId ? <p className="p-5 text-center text-sm text-slate-500">Choose a business to see its available items.</p> : catalog.filter((item) => item.business_id === newBusinessId).length === 0 ? <p className="p-5 text-center text-sm text-slate-500">No active orderable items for this business.</p> : catalog.filter((item) => item.business_id === newBusinessId).map((item) => <div key={item.id} className="flex items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{money(Number(item.base_price || 0))}</p></div><input aria-label={`Quantity for ${item.name}`} type="number" min={0} max={999} value={newQuantities[item.id] || 0} onChange={(event) => setNewQuantities((current) => ({ ...current, [item.id]: Math.max(0, Math.min(999, Number(event.target.value) || 0)) }))} className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm" /></div>)}</div></div>
            <label className="block text-xs font-semibold text-slate-600">Order notes<textarea value={newNotes} onChange={(event) => setNewNotes(event.target.value)} rows={2} placeholder="Optional preparation or delivery notes" className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label>
          </div>
          <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6"><p className="text-xs text-slate-500">New orders start as Pending and appear in the New queue.</p><div className="flex gap-2"><button type="button" disabled={isPending} onClick={() => setCreateOrderOpen(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button type="button" disabled={isPending || (customerMode === "existing" ? !newCustomerId : !newCustomerName.trim() || !newCustomerPhone.trim()) || !newBusinessId || !Object.values(newQuantities).some((quantity) => quantity > 0)} onClick={createOrder} className="rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isPending ? "Creating…" : "Create order"}</button></div></footer>
        </section>
      </div>}

      {selectedOrder && riderPickerOpen && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setRiderPickerOpen(false); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="rider-picker-title" className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h3 id="rider-picker-title" className="text-lg font-bold text-[#03162F]">Assign a delivery rider</h3><p className="mt-1 text-sm text-slate-500">Choose an active enterprise rider.</p></div><button type="button" onClick={() => setRiderPickerOpen(false)} aria-label="Close rider list" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></header>
              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
                {availableRiders.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center"><Bike className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-700">No active riders available</p><a href="/dashboard/hr/riders" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">Open rider management</a></div> : availableRiders.map((rider) => <label key={rider.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition ${selectedRiderId === rider.id ? "border-[#03162F] bg-slate-50 ring-1 ring-[#03162F]" : "border-slate-200 hover:border-slate-300"}`}><input type="radio" name="delivery-rider" value={rider.id} checked={selectedRiderId === rider.id} onChange={() => setSelectedRiderId(rider.id)} className="h-4 w-4 accent-[#03162F]" /><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Bike className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#03162F]">{rider.full_name}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{rider.position}{rider.phone ? ` · ${rider.phone}` : ""}{rider.business_id && rider.business_id !== selectedOrder.business_id ? " · Cross-business rider" : ""}</span></span>{selectedRiderId === rider.id && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}</label>)}
              </div>
              <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4"><button type="button" disabled={isPending} onClick={() => { setRiderPickerOpen(false); if (returnToOrderDetails) setOrderDetailsOpen(true); }} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">Back</button><button type="button" disabled={isPending || !selectedRiderId} onClick={() => update(selectedOrder.id, { rider_employee_id: selectedRiderId }, () => { setRiderPickerOpen(false); if (returnToOrderDetails) setOrderDetailsOpen(true); })} className="inline-flex items-center gap-2 rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0a2b52] disabled:cursor-not-allowed disabled:opacity-45"><PackageCheck className="h-4 w-4" />{isPending ? "Assigning…" : "Assign rider"}</button></footer>
            </section>
          </div>}
    </>
  );
}
