import CatalogTable from "@/modules/catalog/components/CatalogTable";
import { getEnterpriseCatalog } from "@/modules/catalog/services/enterprise-catalog.service";

export default async function CatalogPage() {
  const items = await getEnterpriseCatalog();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Business Catalog
        </h1>

        <p className="text-slate-500">
          Manage all enterprise products, services and financial offerings.
        </p>
      </div>

      <CatalogTable items={items} />
    </div>
  );
}