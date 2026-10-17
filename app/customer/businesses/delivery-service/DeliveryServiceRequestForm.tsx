"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Truck } from "lucide-react";
import DeliveryLocationPicker from "@/components/customer/DeliveryLocationPicker";
import CustomerAddressAutocomplete from "@/components/customer/CustomerAddressAutocomplete";
import { createCustomerDeliveryRequestAction } from "@/modules/orders/services/order.actions";
import type { DeliveryPricingSettings } from "@/modules/orders/services/order.service";
import { getCustomerErrorMessage } from "@/modules/customers/utils/customer-error";

const steps = ["Service type", "Pickup details", "Item type", "Delivery details", "Review pricing", "Confirm order & pay"];
const itemTypes = ["Parcel", "Documents", "Groceries", "Clothing", "Electronics", "Food", "Other"];
const serviceTypes = [
  { name: "Personal delivery", description: "Send your own item from one address to another." },
  { name: "Shop collection", description: "Have a shop or store purchase collected and brought to you." },
];
const money = (amount: number) => `ZMW ${amount.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DeliveryServiceRequestForm({ customerName, customerPhone, pricing }: { customerName: string; customerPhone: string; pricing: DeliveryPricingSettings }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupLatitude, setPickupLatitude] = useState<number | null>(null);
  const [pickupLongitude, setPickupLongitude] = useState<number | null>(null);
  const [pickupContactName, setPickupContactName] = useState(customerName);
  const [pickupContactPhone, setPickupContactPhone] = useState(customerPhone);
  const [itemType, setItemType] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [deliveryArea, setDeliveryArea] = useState("");
  const [deliveryContactName, setDeliveryContactName] = useState("");
  const [deliveryContactPhone, setDeliveryContactPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const distanceKm = pickupLatitude !== null && pickupLongitude !== null && deliveryLatitude !== null && deliveryLongitude !== null
    ? 6371 * 2 * Math.asin(Math.sqrt(
      Math.sin(((deliveryLatitude - pickupLatitude) * Math.PI) / 180 / 2) ** 2
      + Math.cos((pickupLatitude * Math.PI) / 180) * Math.cos((deliveryLatitude * Math.PI) / 180)
      * Math.sin(((deliveryLongitude - pickupLongitude) * Math.PI) / 180 / 2) ** 2,
    )) : null;
  const areaRate = deliveryArea ? pricing.area_rates[deliveryArea] : undefined;
  const estimatedFee = pricing.pricing_mode === "per_km" && distanceKm !== null && pricing.rate_per_km > 0
    ? Math.round(Math.max(pricing.minimum_fee, pricing.base_fee + distanceKm * pricing.road_distance_factor * pricing.rate_per_km) * 100) / 100
    : pricing.pricing_mode === "per_area" && areaRate !== undefined ? areaRate : null;
  const pricingConfigured = pricing.pricing_mode === "per_km" ? pricing.rate_per_km > 0 : Object.keys(pricing.area_rates).length > 0;
  const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 sm:text-sm";

  function nextStep() {
    setError("");
    if (step === 0 && !serviceType) return setError("Choose the courier service you need.");
    if (step === 1 && (!pickupAddress.trim() || !pickupContactName.trim() || !pickupContactPhone.trim())) return setError("Enter the pickup address and contact details to continue.");
    if (step === 2 && (!itemType || !packageDescription.trim())) return setError("Choose the item type and describe what the rider will collect.");
    if (step === 3 && (!deliveryAddress.trim() || !deliveryContactName.trim() || !deliveryContactPhone.trim())) return setError("Enter the delivery address and recipient details to continue.");
    if (step === 3 && pricing.pricing_mode === "per_km" && distanceKm === null) return setError("Pin both the pickup and delivery locations to calculate the distance fee.");
    if (step === 3 && pricing.pricing_mode === "per_area" && !deliveryArea) return setError("Choose a delivery area to calculate the fee.");
    if (step === 4 && (!pricingConfigured || estimatedFee === null)) return setError("Delivery pricing is not available for this route yet. Please contact AEOS dispatch.");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== steps.length - 1 || submitting) return;
    setSubmitting(true);
    setError("");
    const result = await createCustomerDeliveryRequestAction({
      pickupAddress, pickupLatitude, pickupLongitude, pickupContactName, pickupContactPhone,
      deliveryAddress, deliveryLatitude, deliveryLongitude, deliveryArea, deliveryContactName,
      deliveryContactPhone, packageDescription: `${serviceType} · ${itemType}: ${packageDescription}`, notes,
    });
    if (!result.success) {
      setError(getCustomerErrorMessage(result.error, "We couldn’t submit your delivery request. Check your connection and try again."));
      setSubmitting(false);
      return;
    }
    router.push(`/customer/orders/${result.orderId}`);
    router.refresh();
  }

  return <main className="min-h-screen bg-slate-50 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
    <section className="relative w-full overflow-hidden bg-[#03162F] px-4 py-5 text-white sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <div className="relative mx-auto w-full max-w-6xl">
        <Link href="/customer/businesses" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 transition hover:text-[#D4AF37]"><ArrowLeft className="h-4 w-4" />All businesses</Link>
        <div className="mt-4 flex items-start gap-3.5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]"><Truck className="h-5 w-5" /></span><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Alessandro Enterprises Courier</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Send something across town</h1><p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-300">Request collection from any shop or location, see your fee, and follow your courier to delivery.</p></div></div>
      </div>
    </section>

    <form onSubmit={submit} className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-5 sm:py-6">
      <nav aria-label="Courier request steps" className="mb-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><ol className="flex min-w-[700px] items-center gap-1 sm:min-w-0">{steps.map((label, index) => <li key={label} className="flex min-w-0 flex-1 items-center gap-2"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${index < step ? "bg-emerald-600 text-white" : index === step ? "bg-[#D4AF37] text-[#03162F]" : "bg-slate-100 text-slate-400"}`}>{index < step ? <Check className="h-4 w-4" /> : index + 1}</span><span className={`whitespace-nowrap text-[10px] font-bold sm:whitespace-normal sm:text-xs ${index === step ? "text-[#03162F]" : "text-slate-500"}`}>{label}</span>{index < steps.length - 1 && <span className="mx-1 h-px min-w-3 flex-1 bg-slate-200" />}</li>)}</ol></nav>
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</p>}

      {step === 0 && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><StepHeading number="•" title="Select service type" description="Choose what you need the courier to do." /><div className="mt-5 grid gap-3 sm:grid-cols-2">{serviceTypes.map((service) => <button key={service.name} type="button" onClick={() => setServiceType(service.name)} className={`rounded-2xl border p-5 text-left transition ${serviceType === service.name ? "border-[#D4AF37] bg-amber-50 ring-2 ring-[#D4AF37]/20" : "border-slate-200 hover:bg-slate-50"}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]"><Truck className="h-5 w-5" /></span><span className="mt-3 block text-sm font-black text-[#03162F]">{service.name}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{service.description}</span></button>)}</div></section>}

      {step === 1 && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><StepHeading number="1" title="Enter pickup details" description="Tell us where to collect the item and who will hand it to the courier." /><div className="mt-5"><CustomerAddressAutocomplete label="Shop, street, or pickup address" value={pickupAddress} placeholder="Start typing an area, street, shop, or landmark" onChange={(value) => { setPickupAddress(value); setPickupLatitude(null); setPickupLongitude(null); }} onSelect={(place) => { setPickupLatitude(place.latitude); setPickupLongitude(place.longitude); }} /></div><div className="mt-4"><DeliveryLocationPicker latitude={pickupLatitude} longitude={pickupLongitude} onChange={(latitude, longitude) => { setPickupLatitude(latitude); setPickupLongitude(longitude); }} theme="light" title="Pin pickup point" description="The selected suggestion is pinned automatically. Drag the map or tap to adjust its exact position." compact /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Pickup contact<input required value={pickupContactName} onChange={(event) => setPickupContactName(event.target.value)} className={fieldClass} placeholder="Person handing over the item" /></label><label className="text-xs font-bold text-slate-600">Pickup phone<input required type="tel" value={pickupContactPhone} onChange={(event) => setPickupContactPhone(event.target.value)} className={fieldClass} placeholder="Phone number" /></label></div></section>}

      {step === 2 && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><StepHeading number="2" title="Choose item type" description="Select what the courier will collect and add a short description." /><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{itemTypes.map((type) => <button key={type} type="button" onClick={() => setItemType(type)} className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${itemType === type ? "border-[#D4AF37] bg-amber-50 text-[#03162F] ring-2 ring-[#D4AF37]/20" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{type}</button>)}</div><label className="mt-5 block text-xs font-bold text-slate-600">What is in the item?<input required value={packageDescription} onChange={(event) => setPackageDescription(event.target.value)} className={fieldClass} placeholder="For example: phone charger, sealed groceries, signed documents" /></label><label className="mt-4 block text-xs font-bold text-slate-600">Collection instructions <span className="font-normal text-slate-400">(optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={1000} className={`${fieldClass} resize-y`} placeholder="Store name, order number, or special handling instructions" /></label></section>}

      {step === 3 && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><StepHeading number="3" title="Enter delivery details" description="Pin the destination and tell us who will receive the item." /><div className="mt-5"><CustomerAddressAutocomplete label="Delivery address" value={deliveryAddress} placeholder="Start typing an area, street, building, or landmark" onChange={(value) => { setDeliveryAddress(value); setDeliveryLatitude(null); setDeliveryLongitude(null); }} onSelect={(place) => { setDeliveryLatitude(place.latitude); setDeliveryLongitude(place.longitude); }} /></div><div className="mt-4"><DeliveryLocationPicker latitude={deliveryLatitude} longitude={deliveryLongitude} onChange={(latitude, longitude) => { setDeliveryLatitude(latitude); setDeliveryLongitude(longitude); }} theme="light" title="Pin drop-off point" description="The selected suggestion is pinned automatically. Drag the map or tap to adjust its exact position." compact /></div>{pricing.pricing_mode === "per_area" && <label className="mt-4 block text-xs font-bold text-slate-600">Delivery area<select required value={deliveryArea} onChange={(event) => setDeliveryArea(event.target.value)} className={fieldClass}><option value="">Choose your delivery area</option>{Object.keys(pricing.area_rates).sort((a, b) => a.localeCompare(b)).map((area) => <option key={area} value={area}>{area}</option>)}</select></label>}<div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Recipient<input required value={deliveryContactName} onChange={(event) => setDeliveryContactName(event.target.value)} className={fieldClass} placeholder="Person receiving the item" /></label><label className="text-xs font-bold text-slate-600">Recipient phone<input required type="tel" value={deliveryContactPhone} onChange={(event) => setDeliveryContactPhone(event.target.value)} className={fieldClass} placeholder="Phone number" /></label></div></section>}

      {step === 4 && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><StepHeading number="4" title="Review pricing" description="Check your courier fee before confirming the order." />{estimatedFee === null ? <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{!pricingConfigured ? "Courier rates are not available yet. Please contact AEOS dispatch." : pricing.pricing_mode === "per_km" ? "Pin both locations to calculate the route fee." : "Choose a delivery area to see its fee."}</p> : <div className="mt-5 rounded-2xl border border-[#D4AF37]/30 bg-[#FFFCF2] p-5"><p className="text-xs font-black uppercase tracking-wider text-[#9A7412]">{pricing.pricing_mode === "per_km" ? "Distance-based fee" : `Area rate · ${deliveryArea}`}</p><p className="mt-2 text-3xl font-black text-[#03162F]">{money(estimatedFee)}</p>{pricing.pricing_mode === "per_km" && <p className="mt-1 text-sm text-slate-600">Approx. {distanceKm?.toFixed(1)} km map distance × {pricing.road_distance_factor} route factor, plus base fee. Minimum fee: {money(pricing.minimum_fee)}.</p>}<div className="mt-4 grid gap-2 border-t border-amber-200 pt-4 text-sm sm:grid-cols-2"><p><span className="font-semibold text-slate-500">Pickup:</span> {pickupAddress}</p><p><span className="font-semibold text-slate-500">Delivery:</span> {deliveryAddress}</p><p><span className="font-semibold text-slate-500">Service:</span> {serviceType}</p><p><span className="font-semibold text-slate-500">Item:</span> {itemType} · {packageDescription}</p></div></div>}</section>}

      {step === 5 && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><StepHeading number="5" title="Confirm order & pay" description="Confirm your request. Payment status and the live courier updates will appear on your order." /><div className="mt-5 rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-600">Courier fee</span><strong className="text-xl text-[#03162F]">{estimatedFee === null ? "Unavailable" : money(estimatedFee)}</strong></div><p className="mt-3 text-xs leading-5 text-slate-600">When you confirm, AEOS creates your courier order and opens its tracking page. Payment is currently recorded as pending in AEOS; an online payment provider is not connected in this checkout yet.</p></div><ul className="mt-4 space-y-2 text-sm text-slate-700"><li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />Pickup and recipient details saved to the courier order</li><li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />Order status, rider assignment and live tracking available</li><li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />Delivery proof and service rating available after delivery</li></ul></section>}

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><button type="button" onClick={() => { setError(""); setStep((current) => Math.max(0, current - 1)); }} disabled={step === 0 || submitting} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 disabled:opacity-40">Back</button>{step < steps.length - 1 ? <button type="button" onClick={nextStep} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#03162F] px-5 text-sm font-black text-white">Continue<ArrowRight className="h-4 w-4 text-[#D4AF37]" /></button> : <button type="submit" disabled={estimatedFee === null || submitting} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#03162F] px-5 text-sm font-black text-white disabled:opacity-50">{submitting ? "Confirming order…" : "Confirm order"}<ArrowRight className="h-4 w-4 text-[#D4AF37]" /></button>}</div>
      {step === 5 && <p className="mt-2 text-center text-[11px] text-slate-500">Your order will be created with payment marked pending.</p>}
    </form>
  </main>;
}

function StepHeading({ number, title, description }: { number: string; title: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-sm font-black text-[#D4AF37]">{number}</span><div><h2 className="text-lg font-black text-[#03162F]">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{description}</p></div></div>;
}
