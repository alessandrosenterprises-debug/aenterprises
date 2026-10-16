"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { DeliveryPricingSettings } from "@/modules/orders/services/order.service";
import { saveDeliveryPricingAction } from "@/modules/orders/services/order.actions";

export default function DeliveryPricingManager({ initialSettings }: { initialSettings: DeliveryPricingSettings }) {
  const [mode, setMode] = useState(initialSettings.pricing_mode);
  const [baseFee, setBaseFee] = useState(String(initialSettings.base_fee));
  const [ratePerKm, setRatePerKm] = useState(String(initialSettings.rate_per_km));
  const [minimumFee, setMinimumFee] = useState(String(initialSettings.minimum_fee));
  const [distanceFactor, setDistanceFactor] = useState(String(initialSettings.road_distance_factor));
  const [areas, setAreas] = useState(Object.entries(initialSettings.area_rates).map(([name, rate]) => ({ name, rate: String(rate) })));
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    setMessage("");
    const areaRates = Object.fromEntries(areas.map(({ name, rate }) => [name.trim(), Number(rate)]));
    if (areas.some(({ name, rate }) => !name.trim() || !rate.trim())
      || Object.keys(areaRates).length !== areas.length
      || new Set(Object.keys(areaRates).map((area) => area.toLocaleLowerCase())).size !== areas.length) {
      setIsError(true);
      setMessage("Enter a unique area name and fee for each delivery area.");
      setSaving(false);
      return;
    }
    const result = await saveDeliveryPricingAction({
      pricing_mode: mode,
      base_fee: Number(baseFee),
      rate_per_km: Number(ratePerKm),
      minimum_fee: Number(minimumFee),
      road_distance_factor: Number(distanceFactor),
      area_rates: areaRates,
    });
    setIsError(!result.success);
    setMessage(result.success ? "Delivery pricing saved. Customer estimates and order fees now use these rates." : result.error || "Rates could not be saved.");
    setSaving(false);
  }

  const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-[#03162F] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";

  return <div className="mx-auto max-w-4xl space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#9A7412]">Customer delivery service</p><h2 className="mt-1 text-xl font-black text-[#03162F]">Pricing rules</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">These rates appear in the customer request form and are applied by AEOS when an order is created. Per-kilometre estimates use the pinned locations and a route-distance multiplier.</p></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setMode("per_km")} className={`rounded-xl border p-4 text-left transition ${mode === "per_km" ? "border-[#D4AF37] bg-[#FFFCF2] ring-2 ring-[#D4AF37]/20" : "border-slate-200 hover:bg-slate-50"}`}><span className="block text-sm font-extrabold text-[#03162F]">Price per kilometre</span><span className="mt-1 block text-xs text-slate-500">Base fee plus estimated route distance.</span></button>
        <button type="button" onClick={() => setMode("per_area")} className={`rounded-xl border p-4 text-left transition ${mode === "per_area" ? "border-[#D4AF37] bg-[#FFFCF2] ring-2 ring-[#D4AF37]/20" : "border-slate-200 hover:bg-slate-50"}`}><span className="block text-sm font-extrabold text-[#03162F]">Price by delivery area</span><span className="mt-1 block text-xs text-slate-500">Set a fixed delivery fee for each named area.</span></button>
      </div>

      {mode === "per_km" ? <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-600">Base fee (ZMW)<input type="number" min="0" step="0.01" value={baseFee} onChange={(event) => setBaseFee(event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-bold text-slate-600">Rate per kilometre (ZMW)<input type="number" min="0.01" step="0.01" value={ratePerKm} onChange={(event) => setRatePerKm(event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-bold text-slate-600">Minimum delivery fee (ZMW)<input type="number" min="0" step="0.01" value={minimumFee} onChange={(event) => setMinimumFee(event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-bold text-slate-600">Route distance multiplier<input type="number" min="1" max="5" step="0.01" value={distanceFactor} onChange={(event) => setDistanceFactor(event.target.value)} className={inputClass} /><span className="mt-1 block font-normal text-slate-400">Converts straight-line map distance into an estimated road distance.</span></label>
      </div> : <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[#03162F]">Delivery areas and fees</h3><p className="mt-1 text-xs text-slate-500">Use the area names customers should see in the delivery form.</p></div><button type="button" onClick={() => setAreas((current) => [...current, { name: "", rate: "" }])} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#03162F] hover:bg-slate-50"><Plus className="h-4 w-4" />Add area</button></div>
        {areas.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">Add at least one delivery area and fee before customers can request an area-priced delivery.</div>}
        {areas.map((area, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,180px)_40px] items-end gap-2 rounded-xl bg-slate-50 p-3"><label className="text-xs font-bold text-slate-600">Area name<input value={area.name} onChange={(event) => setAreas((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} className={inputClass} placeholder="e.g. Lusaka Central" /></label><label className="text-xs font-bold text-slate-600">Fee (ZMW)<input type="number" min="0" step="0.01" value={area.rate} onChange={(event) => setAreas((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, rate: event.target.value } : item))} className={inputClass} placeholder="0.00" /></label><button type="button" aria-label={`Remove ${area.name || "delivery area"}`} onClick={() => setAreas((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div>)}
      </div>}

      {message && <p role={isError ? "alert" : "status"} className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${isError ? "border border-rose-200 bg-rose-50 text-rose-800" : "border border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{message}</p>}
      <div className="mt-6 flex justify-end border-t border-slate-100 pt-5"><button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-black text-white hover:bg-[#0A2852] disabled:opacity-60"><Save className="h-4 w-4 text-[#D4AF37]" />{saving ? "Saving…" : "Save pricing"}</button></div>
    </section>
  </div>;
}
