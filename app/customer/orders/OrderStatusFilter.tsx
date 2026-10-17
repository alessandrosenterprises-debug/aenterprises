"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, Hourglass, Package, ShoppingBag } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "processing" | "ready";

const statuses: { id: OrderStatus; label: string; description: string; Icon: typeof Hourglass; styles: string }[] = [
  { id: "pending", label: "Pending", description: "Awaiting confirmation", Icon: Hourglass, styles: "border-amber-200 bg-amber-50/40 text-amber-700" },
  { id: "confirmed", label: "Confirmed", description: "Order confirmed", Icon: CheckCircle2, styles: "border-emerald-200 bg-emerald-50/40 text-emerald-700" },
  { id: "processing", label: "Processing", description: "Being prepared", Icon: Package, styles: "border-blue-200 bg-blue-50/40 text-blue-700" },
  { id: "ready", label: "Ready", description: "Ready for collection", Icon: ShoppingBag, styles: "border-purple-200 bg-purple-50/40 text-purple-700" },
];

export default function OrderStatusFilter({ counts, activeOrders, statusOrders }: {
  counts: Record<OrderStatus, number>;
  activeOrders: ReactNode;
  statusOrders: Record<OrderStatus, ReactNode>;
}) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const selected = statuses.find((status) => status.id === selectedStatus);

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {statuses.map(({ id, label, description, Icon, styles }) => {
          const active = selectedStatus === id;
          return (
            <button key={id} type="button" aria-pressed={active} onClick={() => setSelectedStatus(active ? null : id)} className={`rounded-2xl border px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] sm:px-5 sm:py-5 ${styles} ${active ? "ring-2 ring-[#D4AF37] shadow-md" : ""}`}>
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wide">{label}</span>
                  <span className="mt-1 block text-2xl font-bold leading-none text-slate-900">{counts[id]}</span>
                  <span className="mt-1.5 block text-[11px] leading-4 text-slate-500">{description}</span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80"><Icon className="h-5 w-5" /></span>
              </span>
            </button>
          );
        })}
      </div>
      <section aria-live="polite" className="pt-7">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#03162F] sm:text-2xl">{selected ? `${selected.label} Orders` : "Active Orders"}</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{selected ? `${counts[selected.id]} order${counts[selected.id] === 1 ? "" : "s"} with ${selected.label.toLowerCase()} status.` : "Your pending, confirmed and active orders."}</p>
        </div>
        {selected ? counts[selected.id] === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">No {selected.label.toLowerCase()} orders right now.</div>
        ) : statusOrders[selected.id] : activeOrders}
      </section>
    </>
  );
}
