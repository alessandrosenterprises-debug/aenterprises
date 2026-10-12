import { notFound } from "next/navigation";

import BusinessCatalogCollection from "@/modules/catalog/components/BusinessCatalogCollection";
import { getBusinessCatalogItems } from "@/modules/catalog/services/business-catalog-admin.service";
import SoftLoansProductWorkspace from "@/modules/loans/components/SoftLoansProductWorkspace";

interface PageProps {
  params: Promise<{ businessSlug: string; collection: string }>;
}

const collectionTypes: Record<string, Record<string, string>> = {
  "elite-fashion": { products: "product" },
  "classic-barbershop": { products: "product", services: "service" },
  "mobile-money": { products: "product", services: "service" },
};

export default async function BusinessCatalogPage({ params }: PageProps) {
  const { businessSlug, collection } = await params;
  if (businessSlug === "soft-loans" && collection === "loan-products") {
    return <SoftLoansProductWorkspace />;
  }
  const itemType = collectionTypes[businessSlug]?.[collection];
  if (!itemType) notFound();

  const result = await getBusinessCatalogItems(businessSlug, itemType);
  if (!result) notFound();

  return <BusinessCatalogCollection business={result.business} items={result.items} itemType={itemType} />;
}
