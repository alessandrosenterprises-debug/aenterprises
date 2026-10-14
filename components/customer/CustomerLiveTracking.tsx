"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, Check, Circle, Clock3, Radio, Truck, UserRound } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import CustomerDeliveryMap from "@/components/customer/CustomerDeliveryMap";

type TrackingKind = "booking" | "order";
type Rider = { id: string; full_name: string; phone: string | null } | null;

const orderSteps = ["Pending", "Confirmed", "Processing", "Ready", "Completed"];
const deliverySteps = ["Preparing", "Ready", "En Route", "Delivered"];
const bookingSteps = ["Pending", "Confirmed", "Completed"];

export default function CustomerLiveTracking({
  kind,
  recordId,
  initialStatus,
  updatedAt,
  isDelivery = false,
  initialDeliveryStatus = "Not Started",
  initialRider = null,
  initialRiderLatitude = null,
  initialRiderLongitude = null,
  storeName = "Store",
  initialStoreLatitude = null,
  initialStoreLongitude = null,
  initialDestinationLatitude = null,
  initialDestinationLongitude = null,
}: {
  kind: TrackingKind;
  recordId: string;
  initialStatus: string;
  updatedAt: string;
  isDelivery?: boolean;
  initialDeliveryStatus?: string;
  initialRider?: Rider;
  initialRiderLatitude?: number | null;
  initialRiderLongitude?: number | null;
  storeName?: string;
  initialStoreLatitude?: number | null;
  initialStoreLongitude?: number | null;
  initialDestinationLatitude?: number | null;
  initialDestinationLongitude?: number | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [deliveryStatus, setDeliveryStatus] = useState(initialDeliveryStatus);
  const [rider, setRider] = useState<Rider>(initialRider);
  const [riderLatitude, setRiderLatitude] = useState<number | null>(initialRiderLatitude);
  const [riderLongitude, setRiderLongitude] = useState<number | null>(initialRiderLongitude);
  const destinationLatitude = initialDestinationLatitude;
  const destinationLongitude = initialDestinationLongitude;
  const [lastUpdated, setLastUpdated] = useState(updatedAt);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const cancelled = status.toLowerCase() === "cancelled" || deliveryStatus === "Delivery Failed";
  const steps = kind === "booking" ? bookingSteps : isDelivery ? deliverySteps : orderSteps;
  const currentStep = isDelivery
    ? deliveryStatus === "Delivered" ? "Delivered"
      : ["Out for Delivery", "Picked Up"].includes(deliveryStatus) ? "En Route"
      : status === "Ready" ? "Ready"
      : ["Preparing", "Rider Assigned"].includes(deliveryStatus) ? "Preparing"
      : deliveryStatus
    : status;
  const activeIndex = steps.indexOf(currentStep);
  const reachedIndex = activeIndex >= 0 ? activeIndex : status === "Completed" ? steps.length - 1 : -1;

  useEffect(() => {
    const table = kind === "booking" ? "bookings" : "orders";
    const channel = supabase
      .channel(`customer-${kind}-tracking-${recordId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table,
        filter: `id=eq.${recordId}`,
      }, async ({ new: row }) => {
        const next = row as Record<string, unknown>;
        if (typeof next.status === "string") setStatus(next.status);
        if (typeof next.delivery_status === "string") {
          const startedDelivery = deliveryStatus !== "Out for Delivery" && next.delivery_status === "Out for Delivery";
          setDeliveryStatus(next.delivery_status);
          if (startedDelivery && alertsEnabled) {
            if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([280, 120, 280]);
            try {
              const context = audioContext.current;
              if (context?.state === "running") {
                const start = context.currentTime;
                [880, 1175].forEach((frequency, index) => {
                  const oscillator = context.createOscillator();
                  const gain = context.createGain();
                  oscillator.type = "sine";
                  oscillator.frequency.value = frequency;
                  gain.gain.setValueAtTime(0.0001, start + index * 0.19);
                  gain.gain.exponentialRampToValueAtTime(0.16, start + index * 0.19 + 0.025);
                  gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.19 + 0.16);
                  oscillator.connect(gain);
                  gain.connect(context.destination);
                  oscillator.start(start + index * 0.19);
                  oscillator.stop(start + index * 0.19 + 0.17);
                });
              }
            } catch {
              // Audio is optional; the live status and vibration remain available.
            }
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Your order is out for delivery", {
                body: rider ? `${rider.full_name} is on the way with your order.` : "Your order is on the way.",
                tag: `delivery-${recordId}`,
              });
            }
          }
        }
        if (typeof next.rider_latitude === "number") setRiderLatitude(next.rider_latitude);
        if (typeof next.rider_longitude === "number") setRiderLongitude(next.rider_longitude);
        if (typeof next.updated_at === "string") setLastUpdated(next.updated_at);

        if (kind === "order" && typeof next.rider_employee_id === "string") {
          const { data } = await supabase.from("employees")
            .select("id, full_name, phone")
            .eq("id", next.rider_employee_id)
            .maybeSingle();
          if (data) setRider(data as Rider);
        } else if (kind === "order" && next.rider_employee_id === null) {
          setRider(null);
        }
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [alertsEnabled, deliveryStatus, kind, recordId, rider]);

  async function enableDeliveryAlerts() {
    try {
      const AudioContextConstructor = window.AudioContext;
      if (AudioContextConstructor) {
        if (!audioContext.current) audioContext.current = new AudioContextConstructor();
        await audioContext.current.resume();
      }
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      setAlertsEnabled(true);
      if ("vibrate" in navigator) navigator.vibrate([80, 60, 80]);
    } catch {
      setAlertsEnabled(true);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a7910]">Live tracking</p>
          <h2 className="mt-1 text-lg font-black text-[#03162F]">{isDelivery ? "Delivery progress" : kind === "booking" ? "Booking progress" : "Order progress"}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isDelivery && !alertsEnabled && <button type="button" onClick={enableDeliveryAlerts} className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-amber-50 px-3 py-1.5 text-xs font-bold text-[#785d00] hover:bg-amber-100"><BellRing className="h-3.5 w-3.5" />Enable delivery alerts</button>}
          {isDelivery && alertsEnabled && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-[#785d00]"><BellRing className="h-3.5 w-3.5" />Sound & vibration on</span>}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><Radio className="h-3.5 w-3.5 animate-pulse" />Live updates</span>
        </div>
      </div>

      {cancelled ? (
        <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{deliveryStatus === "Delivery Failed" ? "Delivery needs attention. Please contact the business for an update." : "This request has been cancelled."}</div>
      ) : (
        <ol className="mt-6 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-5">
          {steps.map((step, index) => {
            const complete = reachedIndex >= index;
            const current = reachedIndex === index;
            return <li key={step} className="flex items-start gap-2 sm:block">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${complete ? "bg-[#03162F] text-[#D4AF37]" : "bg-slate-100 text-slate-400"}`}>
                {complete && !current ? <Check className="h-4 w-4" /> : current ? (isDelivery ? <Truck className="h-4 w-4" /> : <Circle className="h-3 w-3 fill-current" />) : <span className="text-xs font-bold">{index + 1}</span>}
              </span>
              <span className={`pt-1 text-xs font-semibold sm:mt-2 sm:block ${current ? "text-[#03162F]" : complete ? "text-slate-600" : "text-slate-400"}`}>{step}</span>
            </li>;
          })}
        </ol>
      )}

      {isDelivery && deliveryStatus === "Out for Delivery" && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status" aria-live="polite">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700"><Truck className="h-5 w-5 animate-pulse" /></span>
          <span><strong>Your order is on the way.</strong>{rider ? ` ${rider.full_name} is delivering it to you.` : " Live delivery updates will appear here."}</span>
        </div>
      )}

      {isDelivery && deliveryStatus === "Out for Delivery" && (
        <div className="mt-5 overflow-hidden rounded-xl border border-emerald-200 bg-white">
          {destinationLatitude !== null && destinationLongitude !== null ? <CustomerDeliveryMap
            storeName={storeName}
            store={initialStoreLatitude !== null && initialStoreLongitude !== null ? { lat: initialStoreLatitude, lon: initialStoreLongitude } : null}
            rider={riderLatitude !== null && riderLongitude !== null ? { lat: riderLatitude, lon: riderLongitude } : null}
            destination={{ lat: destinationLatitude, lon: destinationLongitude }}
          /> : <div className="flex items-center gap-3 bg-emerald-50 px-4 py-4 text-sm text-emerald-900"><Radio className="h-5 w-5 shrink-0 animate-pulse" /><span>{riderLatitude !== null && riderLongitude !== null ? "Rider location is live. The customer’s order does not have a pinned delivery address yet." : "Live tracking is on. Waiting for the rider’s phone location…"}</span></div>}
        </div>
      )}

      {isDelivery && rider && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D4AF37]/25 bg-amber-50/50 p-4">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#8a6b00]"><UserRound className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your delivery rider</p><p className="mt-0.5 text-sm font-bold text-[#03162F]">{rider.full_name}</p></div></div>
          {rider.phone && <a href={`tel:${rider.phone}`} className="rounded-lg bg-[#03162F] px-3 py-2 text-xs font-bold text-white">Call rider</a>}
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400"><Clock3 className="h-3.5 w-3.5" />Last update {new Date(lastUpdated).toLocaleString("en-ZM", { dateStyle: "medium", timeStyle: "short" })}</p>
    </section>
  );
}
