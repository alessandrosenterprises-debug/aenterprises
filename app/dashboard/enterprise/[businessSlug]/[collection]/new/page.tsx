import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import BusinessCatalogItemForm from "@/modules/catalog/components/BusinessCatalogItemForm";
import { getBusinessForCatalog } from "@/modules/catalog/services/business-catalog-admin.service";

interface PageProps {
  params: Promise<{ businessSlug: string; collection: string }>;
}

const collectionTypes: Record<string, Record<string, string>> = {
  "elite-fashion": { products: "product" },
  "classic-barbershop": { products: "product", services: "service" },
  "mobile-money": { products: "product", services: "service" },
};

export default async function NewBusinessCatalogItemPage({ params }: PageProps) {
  const { businessSlug, collection } = await params;
  const itemType = collectionTypes[businessSlug]?.[collection];
  if (!itemType) notFound();
  const business = await getBusinessForCatalog(businessSlug);
  if (!business) notFound();
  const collectionUrl = `/dashboard/enterprise/${businessSlug}/${collection}`;
  const label = itemType === "product" ? "Product" : "Service";

  return <div className="space-y-8">
    <div><Link href={collectionUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#03162F]"><ArrowLeft className="h-4 w-4" />Back to {collection}</Link><p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">AEOS • {business.name}</p><h1 className="mt-2 text-3xl font-black text-[#03162F]">Add {label}</h1><p className="mt-2 max-w-3xl text-slate-500">Add a {label.toLowerCase()} to {business.name}. Active items are displayed to customers.</p></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><BusinessCatalogItemForm business={business} collectionUrl={collectionUrl} /></section>
  </div>;
}
