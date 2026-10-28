"use client";

import { useMemo, useState, useTransition } from "react";
import { Boxes, Building2, ClipboardList, PackageCheck, Plus, Search, Settings2, TrendingDown, ChartNoAxesCombined } from "lucide-react";
import { toast } from "sonner";
import { postStockMovement, updateStockItemSettings } from "@/modules/stock/actions";
import type { StockTab, StockWorkspaceData } from "@/modules/stock/services/stock.service";
import StockProcurementWorkspace from "@/modules/stock/components/StockProcurementWorkspace";
import StockCountsWorkspace from "@/modules/stock/components/StockCountsWorkspace";

type Row = Record<string, unknown>;
const str = (v: unknown) => typeof v === "string" ? v : "";
const num = (v: unknown) => Number(v ?? 0);
const currency = (v: unknown) => new Intl.NumberFormat("en-ZM", { style: "currency", currency: "ZMW", minimumFractionDigits: 2 }).format(num(v));
const date = (v: unknown) => typeof v === "string" ? new Intl.DateTimeFormat("en-ZM", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v)) : "—";
const movements = ["Receive", "Transfer", "Sale", "Customer Return", "Supplier Return", "Adjustment Increase", "Adjustment Decrease", "Damaged", "Loss"];

function RecordModal({ item, businessId, onClose }: { item: Row; businessId: string; onClose: () => void }) {
  const current = item.stock && typeof item.stock === "object" ? item.stock as Row : {};
  const [pending, startTransition] = useTransition();
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <form className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget);
        startTransition(async () => { try { await updateStockItemSettings({ itemId: str(item.id), businessId, sku: String(form.get("sku") ?? ""), barcode: String(form.get("barcode") ?? ""), unitCost: Number(form.get("unitCost")), reorderLevel: Number(form.get("reorderLevel")), warrantyMonths: Number(form.get("warrantyMonths")), trackingEnabled: form.get("trackingEnabled") === "on" }); toast.success("Product stock controls saved."); onClose(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save product stock controls."); } });
    }}>
      <div><p className="text-xs font-bold uppercase tracking-widest text-[#A17B14]">Inventory controls</p><h2 className="mt-1 text-xl font-bold text-[#03162F]">{str(item.name)}</h2></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">SKU<input name="sku" defaultValue={str(current.sku)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="e.g. TS-LAP-001" /></label>
        <label className="text-sm font-medium">Barcode<input name="barcode" defaultValue={str(current.barcode)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Scan or enter barcode" /></label>
        <label className="text-sm font-medium">Unit cost (ZMW)<input name="unitCost" type="number" min="0" step="0.01" defaultValue={num(current.unit_cost)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" required /></label>
        <label className="text-sm font-medium">Low-stock alert at each branch<input name="reorderLevel" type="number" min="0" step="0.001" defaultValue={num(current.reorder_level)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" required /><span className="mt-1 block text-xs font-normal text-slate-500">The same threshold is used for this product at every branch.</span></label>
        <label className="text-sm font-medium">Warranty (months)<input name="warrantyMonths" type="number" min="0" max="240" step="1" defaultValue={num(current.warranty_months)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" required /></label>
        <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm sm:col-span-2"><input name="trackingEnabled" type="checkbox" defaultChecked={Boolean(current.tracking_enabled)} className="mt-0.5" /><span><strong>Enforce branch stock on order completion</strong><span className="mt-1 block text-xs text-slate-600">Turn this on after stock is physically counted and transferred into the correct branches. Completed orders will then deduct stock and block sales when stock is insufficient.</span></span></label>
      </div>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button><button disabled={pending} className="rounded-lg bg-[#03162F] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{pending ? "Saving…" : "Save controls"}</button></div>
    </form>
  </div>;
}

export default function StockWorkspace({ data, initialTab = "inventory" }: { data: StockWorkspaceData; initialTab?: StockTab }) {
  const [tab, setTab] = useState<StockTab>(initialTab);
  const [businessId, setBusinessId] = useState(str(data.businesses[0]?.id));
  const locations = useMemo(() => data.locations.filter((location) => str(location.business_id) === businessId), [data.locations, businessId]);
  const [locationId, setLocationId] = useState("");
  const selectedLocationId = locations.some((location) => location.id === locationId) ? locationId : str(locations.find((location) => location.location_type === "Branch")?.id ?? locations[0]?.id);
  const [search, setSearch] = useState("");
  const [movementOpen, setMovementOpen] = useState(false);
  const [settingsItem, setSettingsItem] = useState<Row | null>(null);
  const [pending, startTransition] = useTransition();
  const [movementType, setMovementType] = useState("Receive");

  const items = useMemo(() => data.items.filter((item) => str(item.business_id) === businessId && (item.status == null || !["inactive", "disabled", "archived", "deleted"].includes(str(item.status).toLowerCase()))), [data.items, businessId]);
  const balances = data.balances.filter((balance) => str(balance.business_id) === businessId);
  const quantityAt = (itemId: string, targetLocation: string) => balances.filter((balance) => str(balance.catalog_item_id) === itemId && str(balance.location_id) === targetLocation).reduce((sum, balance) => sum + num(balance.quantity_on_hand), 0);
  const selectedBalances = selectedLocationId ? balances.filter((balance) => str(balance.location_id) === selectedLocationId) : [];
  const visibleItems = items.filter((item) => !search.trim() || `${str(item.name)} ${str(item.category)} ${str((item.stock as Row | null)?.sku)}`.toLowerCase().includes(search.trim().toLowerCase()));
  const totalUnits = selectedLocationId ? selectedBalances.reduce((sum, balance) => sum + num(balance.quantity_on_hand), 0) : balances.reduce((sum, balance) => sum + num(balance.quantity_on_hand), 0);
  const lowStock = visibleItems.filter((item) => {
    const controls = item.stock as Row | null;
    const threshold = num(controls?.reorder_level);
    return quantityAt(str(item.id), selectedLocationId) <= threshold;
  });
  const businessName = str(data.businesses.find((business) => str(business.id) === businessId)?.name) || "Select business";
  const locationName = str(locations.find((location) => str(location.id) === selectedLocationId)?.name) || "All locations";
  const movementsForBusiness = data.movements.filter((movement) => str(movement.business_id) === businessId);
  const itemById = new Map(items.map((item) => [str(item.id), item]));
  const locationById = new Map(locations.map((location) => [str(location.id), location]));

  const submitMovement = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await postStockMovement({ businessId, itemId: String(form.get("itemId") ?? ""), type: movementType, quantity: Number(form.get("quantity")), fromLocationId: String(form.get("fromLocationId") ?? "") || undefined, toLocationId: String(form.get("toLocationId") ?? "") || undefined, unitCost: Number(form.get("unitCost") ?? 0), reference: String(form.get("reference") ?? ""), reason: String(form.get("reason") ?? ""), notes: String(form.get("notes") ?? "") });
        toast.success("Stock movement recorded and branch balances updated."); setMovementOpen(false); window.location.reload();
      } catch (error) { toast.error(error instanceof Error ? error.message : "Stock movement could not be saved."); }
    });
  };

  const needsSource = ["Transfer", "Sale", "Supplier Return", "Adjustment Decrease", "Damaged", "Loss"].includes(movementType);
  const needsDestination = ["Receive", "Transfer", "Customer Return", "Adjustment Increase"].includes(movementType);

  return <div className="space-y-5">
    <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 flex flex-col gap-4 rounded-none bg-gradient-to-r from-[#03162F] via-[#0A2852] to-[#183B60] p-5 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-[#D4AF37] text-[#03162F]"><Boxes className="size-6" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Enterprise operations</p><h1 className="text-2xl font-black">Stock Management</h1><p className="mt-1 text-xs text-slate-300">Branch inventory, stock controls and movement history.</p></div></div>
      {data.permissions.manage && <button onClick={() => setMovementOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 text-sm font-bold text-[#03162F] hover:bg-[#edcb4f]"><Plus className="size-4" />Record stock movement</button>}
    </header>

    <div className="sticky top-[calc(var(--app-header-height,0px)+112px)] z-20 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1 overflow-x-auto">{(["inventory", "movements", ...(data.permissions.purchase ? ["purchases" as const] : []), ...(data.permissions.count || data.permissions.manage ? ["counts" as const] : []), "reports"] as StockTab[]).map((key) => <button key={key} onClick={() => setTab(key)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold capitalize ${tab === key ? "bg-[#03162F] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{key === "inventory" ? "Branch inventory" : key === "movements" ? "Stock movements" : key === "purchases" ? "Suppliers & purchase orders" : key === "counts" ? "Stock counts" : "Reports"}</button>)}</div>
      <div className="flex gap-2"><select value={businessId} onChange={(e) => { setBusinessId(e.target.value); setLocationId(""); }} className="h-9 min-w-40 rounded-lg border border-slate-200 bg-white px-3 text-sm">{data.businesses.map((business) => <option value={str(business.id)} key={str(business.id)}>{str(business.name)}</option>)}</select><select value={selectedLocationId} onChange={(e) => setLocationId(e.target.value)} className="h-9 min-w-40 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">All locations</option>{locations.map((location) => <option value={str(location.id)} key={str(location.id)}>{str(location.name)}</option>)}</select></div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Boxes} title="Units on hand" value={totalUnits.toLocaleString("en-ZM", { maximumFractionDigits: 3 })} note={selectedLocationId ? locationName : "All visible locations"} tone="blue" />
      <Metric icon={PackageCheck} title="Tracked products" value={String(items.length)} note={businessName} tone="gold" />
      <Metric icon={TrendingDown} title="Low / out of stock" value={String(lowStock.length)} note="At selected location" tone={lowStock.length ? "red" : "green"} />
      <Metric icon={Building2} title="Stock locations" value={String(locations.filter((location) => location.location_type === "Branch").length)} note="Branch stockrooms" tone="violet" />
    </div>

    {tab === "inventory" && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-[#03162F]">{locationName} inventory</h2><p className="mt-1 text-xs text-slate-500">Quantities are maintained separately by branch. Legacy stock starts in Unallocated opening stock.</p></div><label className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 px-3 sm:max-w-xs"><Search className="size-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products or SKU" className="min-w-0 flex-1 text-sm outline-none" /></label></div>
      {visibleItems.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Product / SKU</th><th className="px-4 py-3">Branch stock</th><th className="px-4 py-3">Reorder at</th><th className="px-4 py-3">Unit cost</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Controls</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleItems.map((item) => { const itemId = str(item.id); const settings = item.stock as Row | null; const qty = quantityAt(itemId, selectedLocationId); const threshold = num(settings?.reorder_level); const isLow = qty <= threshold; return <tr key={itemId}><td className="px-4 py-3"><div className="font-semibold text-slate-900">{str(item.name)}</div><div className="text-xs text-slate-500">{str(settings?.sku) || str(item.category) || "No SKU assigned"}</div></td><td className="px-4 py-3 font-bold">{qty.toLocaleString("en-ZM", { maximumFractionDigits: 3 })}</td><td className="px-4 py-3">{threshold.toLocaleString("en-ZM", { maximumFractionDigits: 3 })}</td><td className="px-4 py-3">{currency(settings?.unit_cost)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isLow ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{isLow ? qty <= 0 ? "Out of stock" : "Low stock" : "In stock"}</span></td><td className="px-4 py-3 text-right">{data.permissions.manage && <button onClick={() => setSettingsItem(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#03162F]"><Settings2 className="size-3.5" />Controls</button>}</td></tr>; })}</tbody></table></div> : <Empty title="No product stock records" detail="Add retail products to the enterprise catalogue to manage their stock here." />}
    </section>}

    {tab === "movements" && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><h2 className="font-bold text-[#03162F]">Stock movement ledger</h2><p className="mt-1 text-xs text-slate-500">Receipts, transfers, sales, returns, damage and approved adjustments. Posted records are immutable.</p></div>{movementsForBusiness.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date / reference</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Movement</th><th className="px-4 py-3">From</th><th className="px-4 py-3">To</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Reason</th></tr></thead><tbody className="divide-y divide-slate-100">{movementsForBusiness.map((row) => <tr key={str(row.id)}><td className="px-4 py-3"><div>{date(row.created_at)}</div><div className="text-xs text-slate-500">{str(row.reference_number) || "—"}</div></td><td className="px-4 py-3 font-medium">{str(itemById.get(str(row.catalog_item_id))?.name) || "Product"}</td><td className="px-4 py-3">{str(row.movement_type)}</td><td className="px-4 py-3">{str(locationById.get(str(row.from_location_id))?.name) || "—"}</td><td className="px-4 py-3">{str(locationById.get(str(row.to_location_id))?.name) || "—"}</td><td className="px-4 py-3 font-bold">{num(row.quantity).toLocaleString("en-ZM", { maximumFractionDigits: 3 })}</td><td className="max-w-48 truncate px-4 py-3" title={str(row.reason)}>{str(row.reason) || "—"}</td></tr>)}</tbody></table></div> : <Empty title="No stock movements yet" detail="Record a receipt, branch transfer or adjustment to start the audit trail." />}</section>}

    {tab === "purchases" && data.permissions.purchase && <StockProcurementWorkspace data={data} businessId={businessId} />}
    {tab === "counts" && (data.permissions.count || data.permissions.manage) && <StockCountsWorkspace data={data} businessId={businessId} />}

    {tab === "reports" && <div className="grid gap-5 xl:grid-cols-2"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><h2 className="font-bold text-[#03162F]">Branch stock position</h2><p className="mt-1 text-xs text-slate-500">Quantities by location, with low-stock indicators.</p></div><div className="divide-y divide-slate-100">{locations.filter((location) => location.location_type === "Branch").map((location) => { const branchBalances = balances.filter((row) => str(row.location_id) === str(location.id)); const units = branchBalances.reduce((sum, row) => sum + num(row.quantity_on_hand), 0); const affected = items.filter((item) => quantityAt(str(item.id), str(location.id)) <= num((item.stock as Row | null)?.reorder_level)).length; return <div key={str(location.id)} className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="font-semibold text-slate-800">{str(location.name)}</p><p className="text-xs text-slate-500">{branchBalances.length} product balances</p></div><div className="text-right"><p className="font-bold">{units.toLocaleString("en-ZM", { maximumFractionDigits: 3 })} units</p><p className={`text-xs ${affected ? "text-rose-600" : "text-emerald-700"}`}>{affected} low / out</p></div></div>; })}</div></section><section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-2 text-amber-950"><ChartNoAxesCombined className="size-5" /><h2 className="font-bold">Stock control notes</h2></div><ul className="mt-3 space-y-2 text-sm leading-6 text-amber-950/80"><li>• Legacy catalogue quantities were placed in <strong>Unallocated opening stock</strong>. Count and transfer them to the correct branch before relying on branch availability.</li><li>• Each branch manager sees inventory for their assigned branch. Enterprise administrators can compare locations.</li><li>• Use the product controls to set SKU, barcode, unit cost, warranty and a shared reorder threshold for this product across branches.</li><li>• Posted stock movements are permanent audit records; correct mistakes with a new adjustment and reason.</li></ul></section></div>}

    {movementOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setMovementOpen(false); }}><form onSubmit={submitMovement} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div><p className="text-xs font-bold uppercase tracking-widest text-[#A17B14]">Stock ledger</p><h2 className="mt-1 text-xl font-bold text-[#03162F]">Record stock movement</h2><p className="mt-1 text-sm text-slate-500">This updates the selected location balances and the enterprise catalogue total together.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Movement type<select value={movementType} onChange={(e) => setMovementType(e.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3">{movements.map((type) => <option key={type}>{type}</option>)}</select></label><label className="text-sm font-medium">Product<select name="itemId" required className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3"><option value="">Select product</option>{items.map((item) => <option key={str(item.id)} value={str(item.id)}>{str(item.name)}{(item.stock as Row | null)?.sku ? ` · ${str((item.stock as Row).sku)}` : ""}</option>)}</select></label>{needsSource && <label className="text-sm font-medium">Source location<select name="fromLocationId" required defaultValue={selectedLocationId} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3">{locations.map((location) => <option key={str(location.id)} value={str(location.id)}>{str(location.name)}</option>)}</select></label>}{needsDestination && <label className="text-sm font-medium">Destination location<select name="toLocationId" required defaultValue={movementType === "Transfer" ? "" : selectedLocationId} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3"><option value="" disabled>Select location</option>{locations.map((location) => <option key={str(location.id)} value={str(location.id)}>{str(location.name)}</option>)}</select></label>}<label className="text-sm font-medium">Quantity<input name="quantity" required min="0.001" step="0.001" type="number" className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3" /></label><label className="text-sm font-medium">Unit cost (ZMW)<input name="unitCost" min="0" step="0.01" type="number" defaultValue="0" className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3" /></label><label className="text-sm font-medium">Reference / document no.<input name="reference" className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3" placeholder="Invoice, order or transfer number" /></label><label className="text-sm font-medium">Reason<textarea name="reason" required minLength={movementType.startsWith("Adjustment") || ["Damaged", "Loss"].includes(movementType) ? 3 : 0} className="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Reason for this movement" /></label><label className="text-sm font-medium sm:col-span-2">Notes (optional)<textarea name="notes" className="mt-1 block min-h-16 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div><div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={() => setMovementOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button><button disabled={pending} className="rounded-lg bg-[#03162F] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{pending ? "Posting…" : "Post movement"}</button></div></form></div>}
    {settingsItem && <RecordModal item={settingsItem} businessId={businessId} onClose={() => setSettingsItem(null)} />}
  </div>;
}

function Metric({ icon: Icon, title, value, note, tone }: { icon: typeof Boxes; title: string; value: string; note: string; tone: string }) {
  const color = ({ blue: "bg-blue-50 text-blue-700", gold: "bg-amber-50 text-amber-800", red: "bg-rose-50 text-rose-700", green: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700" } as Record<string, string>)[tone] ?? "bg-slate-50 text-slate-700";
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><span className="text-xs font-semibold text-slate-500">{title}</span><span className={`grid size-9 place-items-center rounded-lg ${color}`}><Icon className="size-4" /></span></div><p className="mt-2 text-2xl font-black text-[#03162F]">{value}</p><p className="mt-1 truncate text-xs text-slate-500">{note}</p></div>;
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="grid min-h-48 place-items-center p-8 text-center"><div><ClipboardList className="mx-auto size-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">{title}</p><p className="mt-1 text-sm text-slate-500">{detail}</p></div></div>;
}
