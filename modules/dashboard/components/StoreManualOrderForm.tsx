"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Plus, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createAdminOrderAction } from "@/modules/orders/services/order.actions";

type StoreCustomerOption = { id: string; fullName: string; phone: string; email: string | null };
type StoreCatalogOption = { id: string; name: string; price: number };

export default function StoreManualOrderForm({
  businessId,
  branchId,
  customers,
  catalog,
  initialFulfillment = "Pickup",
  lockFulfillment = false,
  onClose,
}: {
  businessId: string;
  branchId: string;
  customers: StoreCustomerOption[];
  catalog: StoreCatalogOption[];
  initialFulfillment?: "Pickup" | "Delivery";
  lockFulfillment?: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(customers.length ? "existing" : "new");
  const [customerId, setCustomerId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfillment, setFulfillment] = useState<"Pickup" | "Delivery">(initialFulfillment);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const total = useMemo(() => catalog.reduce((sum, item) => sum + item.price * (quantities[item.id] ?? 0), 0), [catalog, quantities]);
  const selectedCount = Object.values(quantities).filter((quantity) => quantity > 0).length;
  const customerReady = customerMode === "existing"
    ? Boolean(customerId)
    : Boolean(fullName.trim() && phone.trim());
  const deliveryReady = fulfillment !== "Delivery" || Boolean(deliveryAddress.trim());
  const formReady = customerReady && deliveryReady && selectedCount > 0 && catalog.length > 0;

  function submit() {
    setError("");
    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([catalogItemId, quantity]) => ({ catalogItemId, quantity }));
    startTransition(async () => {
      const response = await createAdminOrderAction({
        customerId: customerMode === "existing" ? customerId : undefined,
        newCustomer: customerMode === "new" ? { fullName, phone, email, address: fulfillment === "Delivery" ? deliveryAddress : undefined } : undefined,
        businessId,
        storeBranchId: branchId,
        fulfillmentMethod: fulfillment,
        deliveryAddress: fulfillment === "Delivery" ? deliveryAddress : undefined,
        notes,
        items,
      });
      if (!response.success) {
        const message = response.error || "The order could not be created.";
        setError(message);
        return;
      }
      toast.success("Order created and added to this store’s queue.");
      onClose();
      router.refresh();
    });
  }

  return <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="store-create-order-title" className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#03162f] px-5 py-4 text-white sm:px-7">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e0bd39]">Store order entry</p><h2 id="store-create-order-title" className="mt-1 text-xl font-bold">{lockFulfillment ? "Create a delivery" : "Create a new order"}</h2><p className="mt-1 text-sm text-slate-300">The {lockFulfillment ? "delivery" : "order"} will be assigned to this store and appear in enterprise reporting.</p></div>
        <button type="button" disabled={isPending} onClick={onClose} aria-label="Close new order form" className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-50"><X className="size-5" /></button>
      </header>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</p>}
        <section className="rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-[#03162f]">Customer</h3><p className="mt-1 text-xs text-slate-500">Select a known customer or register a walk-in customer.</p></div><div className="flex rounded-lg bg-slate-100 p-1"><button type="button" onClick={() => setCustomerMode("existing")} disabled={!customers.length} className={`rounded-md px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${customerMode === "existing" ? "bg-white text-[#03162f] shadow-sm" : "text-slate-500"}`}>Existing</button><button type="button" onClick={() => setCustomerMode("new")} className={`rounded-md px-3 py-1.5 text-xs font-bold ${customerMode === "new" ? "bg-white text-[#03162f] shadow-sm" : "text-slate-500"}`}>New customer</button></div></div>
          {customerMode === "existing" ? <label className="mt-4 block text-xs font-semibold text-slate-600">Customer<select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-[#03162f] outline-none focus:border-[#c9a227]"><option value="">Choose a customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName} · {customer.phone}</option>)}</select></label> : <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Customer name *<input value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={120} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-[#03162f] outline-none focus:border-[#c9a227]" /></label><label className="text-xs font-semibold text-slate-600">Phone number *<input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} inputMode="tel" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-[#03162f] outline-none focus:border-[#c9a227]" /></label><label className="text-xs font-semibold text-slate-600 sm:col-span-2">Email <span className="font-normal text-slate-400">(optional)</span><input value={email} onChange={(event) => setEmail(event.target.value)} maxLength={160} type="email" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-[#03162f] outline-none focus:border-[#c9a227]" /></label></div>}
        </section>

        <section className="rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-[#03162f]">Order items</h3><p className="mt-1 text-xs text-slate-500">Choose products and enter quantities. Prices use the published store catalog.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{selectedCount} selected</span></div>
          {catalog.length ? <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">{catalog.map((item) => <div key={item.id} className="flex items-center gap-3 px-3 py-3 sm:px-4"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-[#9a7410]"><ShoppingBag className="size-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#03162f]">{item.name}</p><p className="text-xs text-slate-500">ZMW {item.price.toLocaleString("en-ZM", { minimumFractionDigits: 2 })} each</p></div><label className="sr-only" htmlFor={`qty-${item.id}`}>Quantity for {item.name}</label><input id={`qty-${item.id}`} type="number" min="0" max="999" step="1" value={quantities[item.id] ?? 0} onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: Math.max(0, Math.min(999, Number.parseInt(event.target.value || "0", 10) || 0)) }))} className="h-10 w-20 rounded-lg border border-slate-300 px-2 text-center text-sm font-bold text-[#03162f] outline-none focus:border-[#c9a227]" /></div>)}</div> : <p className="mt-4 rounded-lg bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">No active orderable products are configured for this business yet.</p>}
        </section>

        <section className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2 sm:p-5">
          {lockFulfillment ? <div className="text-xs font-semibold text-slate-600">Fulfillment<div className="mt-1.5 flex min-h-11 items-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-bold text-[#03162f]">Delivery</div></div> : <label className="text-xs font-semibold text-slate-600">Fulfillment<select value={fulfillment} onChange={(event) => setFulfillment(event.target.value as "Pickup" | "Delivery")} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-[#03162f] outline-none focus:border-[#c9a227]"><option value="Pickup">Customer pickup</option><option value="Delivery">Delivery</option></select></label>}
          {fulfillment === "Delivery" && <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Delivery address *<input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} maxLength={500} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-[#03162f] outline-none focus:border-[#c9a227]" placeholder="Enter the delivery address" /></label>}
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Order notes <span className="font-normal text-slate-400">(optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} rows={3} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-[#03162f] outline-none focus:border-[#c9a227]" placeholder="Instructions or details for the team" /></label>
        </section>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm font-semibold text-slate-600">Order total</span><span className="text-xl font-black text-[#03162f]">ZMW {total.toLocaleString("en-ZM", { minimumFractionDigits: 2 })}</span></div>
      </div>
      <footer className="flex flex-col-reverse justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:px-7"><button type="button" disabled={isPending} onClick={onClose} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="button" disabled={isPending || !formReady} onClick={submit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#03162f] px-5 text-sm font-bold text-white hover:bg-[#0a2b52] disabled:cursor-not-allowed disabled:opacity-50">{isPending ? <><Loader2 className="size-4 animate-spin" />Saving {lockFulfillment ? "delivery" : "order"}…</> : <><Plus className="size-4" />Create {lockFulfillment ? "delivery" : "order"}</>}</button></footer>
    </section>
  </div>;
}
