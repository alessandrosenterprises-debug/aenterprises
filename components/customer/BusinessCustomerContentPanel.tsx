"use client";

import { useState } from "react";
import BusinessContentFeed, { type ContentBusiness } from "@/components/customer/BusinessContentFeed";

export default function BusinessCustomerContentPanel({ business }: { business: ContentBusiness }) {
  const [kind, setKind] = useState<"promotions" | "gallery" | "posts">("promotions");
  return <section className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-[#9A7910]">From {business.name}</p><h2 className="mt-1 text-xl font-black text-[#03162F]">Business updates</h2></div><div className="flex gap-2">{([ ["promotions", "Offers"], ["gallery", "Gallery"], ["posts", "Posts"] ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setKind(value)} className={`rounded-full px-3 py-2 text-xs font-bold ${kind === value ? "bg-[#03162F] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{label}</button>)}</div></div>
    <BusinessContentFeed businesses={[business]} businessId={business.id} kind={kind} compact />
  </section>;
}
