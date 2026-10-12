import Link from "next/link";
import { ArrowLeft, Package, Wrench } from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import type { BusinessCatalogRecord } from "../services/business-catalog-admin.service";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerBusinessCatalogList({
  businessName,
  slug,
  items,
  itemType,
}: {
  businessName: string;
  slug: string;
  items: BusinessCatalogRecord[];
  itemType: "product" | "service";
}) {
  const supabase = await createClient();
  const { data: business } = await supabase.from("businesses")
    .select("logo_url").eq("slug", slug).maybeSingle();
  const isProduct = itemType === "product";
  const title = isProduct ? "Products" : "Services";
  const Icon = isProduct ? Package : Wrench;

  return <main className="min-h-screen bg-slate-50 pb-[92px] text-[#03162F]
    "><CustomerNavigation /><div className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-6">
    <Link href={`/customer/businesses/${slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#03162F]"><ArrowLeft className="h-4 w-4" />Back to {businessName}</Link>
    <section className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#03162F] via-[#0A2852] to-[#174D8C] p-7 text-white shadow-xl sm:p-9"><div className="flex items-center gap-4">{business?.logo_url ? <img src={business.logo_url} alt={`${businessName} logo`} className="h-14 w-14 rounded-2xl bg-white p-2 object-contain"/> : null}<div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{businessName}</p><h1 className="mt-2 text-3xl font-black">{title}</h1></div></div><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">Browse active {title.toLowerCase()} available from {businessName}.</p></section>
    {items.length ? <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="aspect-[4/3] bg-slate-100">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Icon className="h-14 w-14 text-slate-300" /></div>}</div><div className="p-5">{item.category && <p className="text-xs font-bold uppercase tracking-wider text-[#B08D1E]">{item.category}</p>}<h2 className="mt-2 text-lg font-black">{item.name}</h2>{item.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p>}{item.base_price !== null && <p className="mt-4 text-base font-black text-[#03162F]">ZMW {Number(item.base_price).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}{isProduct && item.quantity !== null && <p className="mt-1 text-xs text-slate-500">{item.quantity} in stock</p>}</div></article>)}</section> : <section className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Icon className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-lg font-bold">No {title.toLowerCase()} available yet</h2><p className="mt-2 text-sm text-slate-500">Please check back later.</p></section>}
  </div></main>;
}
