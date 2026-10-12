import Link from "next/link";
import { CheckCircle2, ChevronRight, Package, Plus, Wrench, XCircle } from "lucide-react";

import type { BusinessCatalogRecord } from "../services/business-catalog-admin.service";

interface Props {
  business: { name: string; slug: string };
  items: BusinessCatalogRecord[];
  itemType: string;
}

function formatPrice(value: number | null) {
  if (value === null) return "Price not set";
  return `ZMW ${Number(value).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BusinessCatalogCollection({ business, items, itemType }: Props) {
  const isProduct = itemType === "product";
  const itemLabel = itemType === "financial" ? "Loan Product" : isProduct ? "Product" : "Service";
  const title = itemType === "financial" ? "Loan Products" : isProduct ? "Products" : "Services";
  const Icon = isProduct || itemType === "financial" ? Package : Wrench;
  const activeCount = items.filter((item) => item.status.toLowerCase() === "active").length;
  const inactiveCount = items.length - activeCount;
  const collectionUrl = `/dashboard/enterprise/${business.slug}/${itemType === "financial" ? "loan-products" : `${itemType}s`}`;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">AEOS • {business.name}</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href={`/dashboard/enterprise/${business.slug}`} className="text-sm font-semibold text-slate-500 hover:text-[#03162F]">← Business Workspace</Link>
            <h1 className="mt-3 text-3xl font-bold text-[#03162F]">{title}</h1>
            <p className="mt-2 max-w-3xl text-slate-500">Manage {title.toLowerCase()} offered by {business.name}. Active items are displayed in the customer-facing business experience.</p>
          </div>
          <Link href={`${collectionUrl}/new`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0A2852]"><Plus className="h-4 w-4" />Add {itemLabel}</Link>
        </div>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title={`Total ${title}`} value={items.length} icon={Icon} />
        <SummaryCard title="Active" value={activeCount} icon={CheckCircle2} />
        <SummaryCard title="Inactive" value={inactiveCount} icon={XCircle} />
        <SummaryCard title="Customer Visible" value={activeCount} icon={CheckCircle2} />
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{title}</p>
          <h2 className="mt-1 text-2xl font-black text-[#03162F]">{business.name} {title}</h2>
          <p className="mt-2 text-sm text-slate-500">Select an item to view its details, edit it or remove it.</p>
        </div>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"><Icon className="h-7 w-7 text-slate-400" /></div>
            <h3 className="mt-5 text-lg font-black text-[#03162F]">No {title.toLowerCase()} yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Add the first {itemLabel.toLowerCase()} to manage it here and display it to customers when active.</p>
            <Link href={`${collectionUrl}/new`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" />Add {itemLabel}</Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Link key={item.id} href={`${collectionUrl}/${item.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Icon className="h-16 w-16 text-slate-300" /></div>}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4"><div>{item.category && <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">{item.category}</p>}<h3 className="mt-2 text-lg font-black text-[#03162F]">{item.name}</h3></div><ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#D4AF37]" /></div>
                  {item.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p>}
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Price</p><p className="mt-1 font-bold text-[#03162F]">{formatPrice(item.base_price)}</p></div>{isProduct && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quantity</p><p className="mt-1 font-bold text-[#03162F]">{item.quantity ?? "—"}</p></div>}</div>
                  <div className="mt-4 flex items-center justify-between"><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status.toLowerCase() === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.status}</span><span className="text-xs font-semibold text-slate-400 group-hover:text-[#03162F]">View {itemLabel.toLowerCase()}</span></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Package }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-3 text-3xl font-black text-[#03162F]">{value}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#03162F] text-white"><Icon className="h-5 w-5" /></div></div></div>;
}
