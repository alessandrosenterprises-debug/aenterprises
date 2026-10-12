import Link from "next/link";
import { ArrowLeft, Edit3, Package, Wrench } from "lucide-react";
import { notFound } from "next/navigation";

import DeleteBusinessCatalogItemButton from "@/modules/catalog/components/DeleteBusinessCatalogItemButton";
import { getBusinessCatalogItem } from "@/modules/catalog/services/business-catalog-admin.service";

interface PageProps {
  params: Promise<{ businessSlug: string; collection: string; itemId: string }>;
}

const collectionTypes: Record<string, Record<string, string>> = {
  "elite-fashion": { products: "product" },
  "classic-barbershop": { products: "product", services: "service" },
  "mobile-money": { products: "product", services: "service" },
};

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function BusinessCatalogItemPage({ params }: PageProps) {
  const { businessSlug, collection, itemId } = await params;
  const itemType = collectionTypes[businessSlug]?.[collection];
  if (!itemType) notFound();
  const result = await getBusinessCatalogItem(businessSlug, itemId, itemType);
  if (!result) notFound();

  const { business, item } = result;
  const collectionUrl = `/dashboard/enterprise/${businessSlug}/${collection}`;
  const itemLabel = itemType === "product" ? "Product" : "Service";
  const Icon = itemType === "product" ? Package : Wrench;

  return <div className="space-y-8">
    <Link href={collectionUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#03162F]"><ArrowLeft className="h-4 w-4" />Back to {collection}</Link>
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">AEOS • {business.name}</p><h1 className="mt-2 text-3xl font-black text-[#03162F]">{item.name}</h1><p className="mt-2 max-w-3xl text-slate-500">{item.category || itemLabel} details and customer display settings.</p></div><Link href={`${collectionUrl}/${item.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white hover:bg-[#0A2852]"><Edit3 className="h-4 w-4" />Edit {itemLabel}</Link></div>
    <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><InfoCard label="Status" value={item.status} /><InfoCard label="Category" value={item.category || "Uncategorized"} /><InfoCard label="Price" value={item.base_price === null ? "Price not set" : `ZMW ${Number(item.base_price).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} /><InfoCard label="Quantity" value={itemType === "product" ? displayValue(item.quantity) : "Not applicable"} /></section>
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="grid lg:grid-cols-[420px_1fr]"><div className="min-h-[300px] bg-slate-100">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full min-h-[300px] w-full object-cover" /> : <div className="flex min-h-[300px] items-center justify-center"><Icon className="h-24 w-24 text-slate-300" /></div>}</div><div className="p-7 lg:p-9"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{itemLabel} Information</p><h2 className="mt-2 text-2xl font-black text-[#03162F]">{item.name}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.description || "No description provided."}</p><div className="mt-8 border-t border-slate-100 pt-6"><h3 className="font-bold text-[#03162F]">Business-specific details</h3>{item.attributes && Object.keys(item.attributes).length > 0 ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{Object.entries(item.attributes).map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{key.replaceAll("_", " ")}</p><p className="mt-2 break-words text-sm font-semibold text-[#03162F]">{displayValue(value)}</p></div>)}</div> : <p className="mt-2 text-sm text-slate-500">No additional details were added.</p>}</div></div></div></section>
    <section className="rounded-3xl border border-red-100 bg-white p-7 shadow-sm"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Manage Item</p><h2 className="mt-1 text-xl font-black text-[#03162F]">Edit or remove this {itemLabel.toLowerCase()}</h2><p className="mt-2 text-sm text-slate-500">Deleting removes this item from the business catalog and customer-facing listings.</p></div><div className="flex flex-wrap gap-3"><Link href={`${collectionUrl}/${item.id}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white"><Edit3 className="h-4 w-4" />Edit {itemLabel}</Link><DeleteBusinessCatalogItemButton itemId={item.id} collectionUrl={collectionUrl} /></div></div></section>
  </div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 font-bold text-[#03162F]">{value}</p></div>;
}
