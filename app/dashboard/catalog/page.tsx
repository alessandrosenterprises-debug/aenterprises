import {
  Activity,
  Boxes,
  BriefcaseBusiness,
  Database,
  Package,
  Wrench,
} from "lucide-react";

import CatalogTable from "@/modules/catalog/components/CatalogTable";
import { getEnterpriseCatalog } from "@/modules/catalog/services/enterprise-catalog.service";
import { getBusinesses } from "@/modules/catalog/services/business.service";
import { getActiveCategoryNames } from "@/modules/configuration/services/configuration.server.service";

interface CatalogPageProps {
  searchParams?: Promise<{ business?: string }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { business: businessSlug } = (await searchParams) ?? {};
  const [items, businesses, categories] = await Promise.all([
    getEnterpriseCatalog(),
    getBusinesses(),
    getActiveCategoryNames(),
  ]);
  const selectedBusiness = businesses.find((business) => business.slug === businessSlug);
  const products = items.filter((item) => item.item_type === "product");
  const services = items.filter((item) => item.item_type === "service");
  const financial = items.filter((item) => item.item_type === "financial");
  const activeItems = items.filter((item) => item.status === "Active").length;
  const lowStockProducts = products.filter((item) => Number(item.quantity) > 0 && Number(item.quantity) <= 5).length;
  const outOfStockProducts = products.filter((item) => item.quantity != null && Number(item.quantity) <= 0).length;
  const inventoryValue = products.reduce(
    (sum, item) => sum + (Number(item.base_price) || 0) * (Number(item.quantity) || 0),
    0,
  );

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 isolate overflow-hidden rounded-none bg-[#03162F] px-6 py-7 text-white shadow-xl shadow-[#03162F]/10 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.22),transparent_65%)]" />
        <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <Activity className="h-4 w-4" />
              Enterprise catalog
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Products &amp; services</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Manage customer-facing products, services and financial offerings across your businesses.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[450px]">
            <OverviewMetric label="Catalog items" value={items.length} />
            <OverviewMetric label="Active offers" value={activeItems} />
            <OverviewMetric label="Low stock" value={lowStockProducts} emphasis={lowStockProducts > 0} />
          </div>
        </div>
      </header>

      <section aria-label="Catalog summary" className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible 2xl:grid-cols-6">
        <SummaryCard title="Products" value={products.length} icon={Package} />
        <SummaryCard title="Services" value={services.length} icon={Wrench} />
        <SummaryCard title="Financial offers" value={financial.length} icon={BriefcaseBusiness} />
        <SummaryCard title="Low stock (1–5)" value={lowStockProducts} icon={Boxes} alert={lowStockProducts > 0} />
        <SummaryCard title="Out of stock" value={outOfStockProducts} icon={Package} alert={outOfStockProducts > 0} />
        <SummaryCard title="Product inventory value" value={`ZMW ${inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Database} />
      </section>

      <section aria-labelledby="catalog-list-heading" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A88314]">Manage inventory and offers</p>
            <h2 id="catalog-list-heading" className="mt-1 text-xl font-bold tracking-tight text-[#03162F]">Enterprise catalog</h2>
          </div>
          <p className="text-xs text-slate-500">Stock is tracked for products; services and financial offers do not use inventory quantities.</p>
        </div>
        <CatalogTable
          items={items}
          businesses={businesses}
          categories={categories}
          initialBusinessId={selectedBusiness?.id ?? ""}
        />
      </section>
    </div>
  );
}

function OverviewMetric({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${emphasis ? "border-amber-300/30 bg-amber-300/10" : "border-white/10 bg-white/[0.06]"}`}>
      <p className={`text-2xl font-bold ${emphasis ? "text-amber-200" : "text-white"}`}>{value.toLocaleString()}</p>
      <p className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${emphasis ? "text-amber-100" : "text-slate-300"}`}>{label}</p>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, alert = false }: { title: string; value: string | number; icon: typeof Package; alert?: boolean }) {
  return (
    <div className={`min-w-[150px] rounded-2xl border p-4 shadow-sm shadow-slate-900/[0.03] sm:min-w-0 ${alert ? "border-amber-200 bg-amber-50/70" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs font-semibold ${alert ? "text-amber-800" : "text-slate-500"}`}>{title}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${alert ? "bg-amber-100 text-amber-800" : "bg-[#F7F2DF] text-[#9B7910]"}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className={`mt-3 text-xl font-bold tracking-tight ${alert ? "text-amber-900" : "text-[#03162F]"}`}>{value}</p>
    </div>
  );
}
