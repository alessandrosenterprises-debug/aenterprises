import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import BusinessCatalogItemForm from "@/modules/catalog/components/BusinessCatalogItemForm";
import { getBusinessCatalogItem } from "@/modules/catalog/services/business-catalog-admin.service";

interface PageProps {
  params: Promise<{ businessSlug: string; collection: string; itemId: string }>;
}

const collectionTypes: Record<string, Record<string, string>> = {
  "elite-fashion": { products: "product" },
  "classic-barbershop": { products: "product", services: "service" },
  "mobile-money": { products: "product", services: "service" },
};

export default async function EditBusinessCatalogItemPage({ params }: PageProps) {
  const { businessSlug, collection, itemId } = await params;
  const itemType = collectionTypes[businessSlug]?.[collection];
  if (!itemType) notFound();
  const result = await getBusinessCatalogItem(businessSlug, itemId, itemType);
  if (!result) notFound();
  const collectionUrl = `/dashboard/enterprise/${businessSlug}/${collection}`;

  return <div className="space-y-8"><div><Link href={`${collectionUrl}/${itemId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#03162F]"><ArrowLeft className="h-4 w-4" />Back to item</Link><p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">AEOS • {result.business.name}</p><h1 className="mt-2 text-3xl font-black text-[#03162F]">Edit {result.item.name}</h1><p className="mt-2 text-slate-500">Changes are saved to this business catalog and shown to customers when the item is active.</p></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><BusinessCatalogItemForm business={result.business} collectionUrl={collectionUrl} item={result.item} /></section></div>;
}
