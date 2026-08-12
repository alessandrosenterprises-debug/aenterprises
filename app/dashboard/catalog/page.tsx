import CatalogTable from "@/modules/catalog/components/CatalogTable";
import { getEnterpriseCatalog } from "@/modules/catalog/services/enterprise-catalog.service";
import { getBusinesses } from "@/modules/catalog/services/business.service";
export default async function CatalogPage() {
  const [items, businesses] = await Promise.all([
  getEnterpriseCatalog(),
  getBusinesses(),
]);

  const totalItems = items.length;

  const totalProducts = items.filter(
    (item) => item.item_type === "product"
  ).length;

  const totalServices = items.filter(
    (item) => item.item_type === "service"
  ).length;

  const totalFinancial = items.filter(
    (item) => item.item_type === "financial"
  ).length;

  const activeItems = items.filter(
    (item) => item.status === "Active"
  ).length;

  const inventoryValue = items.reduce(
    (sum, item) =>
      sum +
      (Number(item.base_price) || 0) *
        (Number(item.quantity) || 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Business Catalog
        </h1>

        <p className="mt-2 text-slate-500">
          Manage all enterprise products,
          services and financial offerings.
        </p>
      </div>

      {/* Summary Cards */}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Catalog Items"
          value={totalItems}
        />

        <SummaryCard
          title="Products"
          value={totalProducts}
        />

        <SummaryCard
          title="Services"
          value={totalServices}
        />

        <SummaryCard
          title="Financial Products"
          value={totalFinancial}
        />

        <SummaryCard
          title="Inventory Value"
          value={`ZMW ${inventoryValue.toLocaleString()}`}
        />

        <SummaryCard
          title="Active Items"
          value={activeItems}
        />
      </div>

      <CatalogTable
  items={items}
  businesses={businesses}
/>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
}

function SummaryCard({
  title,
  value,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <h2 className="mt-3 text-3xl font-bold text-[#03162F]">
        {value}
      </h2>
    </div>
  );
}