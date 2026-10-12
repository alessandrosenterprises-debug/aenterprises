import Link from "next/link";
import { ArrowRight, CalendarDays, Package, Wrench } from "lucide-react";
import type { BusinessCatalogRecord } from "../services/business-catalog-admin.service";

export default function TechnologyCategoryItems({
  items,
  slug,
  categoryName,
  itemType = "all",
}: {
  items: BusinessCatalogRecord[];
  slug: string;
  categoryName: string;
  itemType?: "all" | "product" | "service";
}) {
  const visibleItems = itemType === "all"
    ? items
    : items.filter((item) => item.item_type?.toLowerCase() === itemType);

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">Available from this category</p>
          <h2 className="mt-1 text-2xl font-black text-[#03162F]">{categoryName}</h2>
        </div>
        <p className="text-sm text-slate-500">{visibleItems.length} matching item{visibleItems.length === 1 ? "" : "s"}</p>
      </div>

      {visibleItems.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => {
            const isService = item.item_type?.toLowerCase() === "service";
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="aspect-[4/3] bg-slate-100">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300">{isService ? <Wrench className="h-12 w-12" /> : <Package className="h-12 w-12" />}</div>}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-[#9b7a08]">{item.category || (isService ? "Service" : "Product")}</p><h3 className="mt-1 font-black text-[#03162F]">{item.name}</h3></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${isService ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}>{isService ? "Service" : "Product"}</span>
                  </div>
                  {item.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p>}
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="font-black text-[#03162F]">{item.base_price == null ? "Price on request" : `ZMW ${Number(item.base_price).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                    {!isService && item.quantity != null && <span className="text-xs text-slate-500">{item.quantity} in stock</span>}
                  </div>
                  <Link href={isService ? `/customer/bookings/new/${item.id}` : `/customer/orders/new?itemId=${item.id}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0A2852]">
                    {isService ? <CalendarDays className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                    {isService ? "Book Service" : "Order Product"}<ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 font-black text-[#03162F]">No matching items available</h3>
          <p className="mt-1 text-sm text-slate-500">Active products or services in {categoryName} will appear here.</p>
          <Link href={`/customer/businesses/${slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#03162F]">Browse all categories<ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}
    </section>
  );
}
