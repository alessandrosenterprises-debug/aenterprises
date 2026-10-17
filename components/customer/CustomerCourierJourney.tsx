"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MapPinned, MessageSquareText, PackageCheck, Star, WalletCards } from "lucide-react";
import { rateCustomerDeliveryAction } from "@/modules/orders/services/order.actions";
import { getCustomerErrorMessage } from "@/modules/customers/utils/customer-error";

export default function CustomerCourierJourney({ orderId, deliveryStatus, paymentStatus, receivedBy, proofNote, proofAt, rating, review }: {
  orderId: string;
  deliveryStatus: string;
  paymentStatus: string;
  receivedBy: string | null;
  proofNote: string | null;
  proofAt: string | null;
  rating: number | null;
  review: string | null;
}) {
  const router = useRouter();
  const delivered = deliveryStatus === "Delivered";
  const [selectedRating, setSelectedRating] = useState(rating ?? 0);
  const [comment, setComment] = useState(review ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveRating() {
    if (selectedRating < 1 || saving) return;
    setSaving(true);
    setMessage("");
    const result = await rateCustomerDeliveryAction({ orderId, rating: selectedRating, review: comment });
    setMessage(result.success ? "Thank you for rating your courier." : getCustomerErrorMessage(result.error, "Your rating could not be saved. Please try again."));
    setSaving(false);
    if (result.success) router.refresh();
  }

  return <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]"><PackageCheck className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9A7412]">Courier journey</p><h2 className="text-base font-black text-[#03162F]">Track, receive and review</h2></div></div>
    <ol className="mt-5 grid gap-3 sm:grid-cols-3">
      <li className={`rounded-xl border p-3 ${deliveryStatus === "Out for Delivery" || delivered ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}><MapPinned className="h-4 w-4 text-blue-700" /><p className="mt-2 text-xs font-black text-[#03162F]">6 · Track courier</p><p className="mt-1 text-[11px] leading-4 text-slate-600">{deliveryStatus === "Out for Delivery" ? "Courier is on the way. Live map is shown above." : delivered ? "Courier delivery is complete." : "Live tracking opens when the courier starts the delivery."}</p></li>
      <li className={`rounded-xl border p-3 ${delivered ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><CheckCircle2 className="h-4 w-4 text-emerald-700" /><p className="mt-2 text-xs font-black text-[#03162F]">7 · Proof of delivery</p>{delivered ? <><p className="mt-1 text-[11px] leading-4 text-slate-700">Received by <strong>{receivedBy || "Recipient"}</strong>{proofAt ? ` · ${new Date(proofAt).toLocaleString("en-ZM")}` : ""}</p>{proofNote && <p className="mt-1 text-[11px] text-slate-600">{proofNote}</p>}</> : <p className="mt-1 text-[11px] leading-4 text-slate-600">Handover details appear here once the courier completes the order.</p>}</li>
      <li className={`rounded-xl border p-3 ${rating ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}><Star className="h-4 w-4 text-amber-600" /><p className="mt-2 text-xs font-black text-[#03162F]">8 · Rate the service</p>{rating ? <p className="mt-1 text-[11px] text-slate-700">Your rating: {"★".repeat(rating)}{"☆".repeat(5 - rating)}{review ? ` · ${review}` : ""}</p> : !delivered ? <p className="mt-1 text-[11px] leading-4 text-slate-600">You can leave a rating after delivery.</p> : <div className="mt-2"><div className="flex gap-1" role="radiogroup" aria-label="Courier rating">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={selectedRating === value} aria-label={`${value} star${value > 1 ? "s" : ""}`} onClick={() => setSelectedRating(value)} className={`text-xl leading-none ${value <= selectedRating ? "text-amber-500" : "text-slate-300"}`}>★</button>)}</div><label className="mt-2 block text-[10px] font-semibold text-slate-600">Comment (optional)<textarea value={comment} maxLength={1000} onChange={(event) => setComment(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" placeholder="Tell us how it went" /></label><button type="button" onClick={saveRating} disabled={selectedRating < 1 || saving} className="mt-2 rounded-lg bg-[#03162F] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Submit rating"}</button></div>}</li>
    </ol>
    <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-4 text-slate-600"><WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7412]" />Payment status: <strong>{paymentStatus || "Pending"}</strong>. Online payment is not connected yet; this order records payment status for AEOS to update.</p>
    {message && <p role="status" className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700"><MessageSquareText className="h-4 w-4" />{message}</p>}
  </section>;
}
