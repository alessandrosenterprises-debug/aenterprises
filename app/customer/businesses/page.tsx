import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerBusinessesPage() {
  const supabase = await createClient();

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug,
      description,
      logo_url
    `)
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Customer businesses loading error:", error);
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-[92px]">
      <CustomerNavigation />

      <div className="mx-auto w-full max-w-[720px]">
        {/* Header */}
        <section className="bg-[#03162F] px-5 pb-10 pt-7 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
            Discover
          </p>

          <h1 className="mt-3 text-[30px] font-black leading-tight tracking-tight">
            Our Businesses
          </h1>

          <p className="mt-3 max-w-[600px] text-sm leading-6 text-slate-300">
            Explore the businesses within Alessandro Enterprises.
            Each business has its own products, services, categories,
            galleries, offers and customer experience.
          </p>
        </section>

        {/* Businesses */}
        <section className="px-5 py-7">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <h2 className="text-sm font-bold text-red-700">
                Unable to load businesses
              </h2>

              <p className="mt-1 text-xs leading-5 text-red-600">
                Please try again shortly.
              </p>
            </div>
          ) : businesses && businesses.length > 0 ? (
            <div className="space-y-3">
              {businesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/customer/businesses/${business.slug}`}
                  className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/50 hover:shadow-lg active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    {/* Business Logo */}
                    {business.logo_url ? (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white">
                        <img
                          src={business.logo_url}
                          alt={`${business.name} logo`}
                          className="h-full w-full object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]">
                        <Store className="h-7 w-7" />
                      </div>
                    )}

                    {/* Business Information */}
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-bold text-[#03162F]">
                        {business.name}
                      </h2>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {business.description ||
                          "Explore this business and discover what it offers."}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-[#D4AF37] transition-all duration-300 group-hover:bg-[#03162F] group-hover:text-[#D4AF37]">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Alessandro Enterprises
                    </span>

                    <span className="text-xs font-bold text-[#03162F] transition-colors group-hover:text-[#D4AF37]">
                      Explore Business
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]">
                <Store className="h-7 w-7" />
              </div>

              <h2 className="mt-4 text-base font-bold text-[#03162F]">
                No businesses available
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">
                There are currently no active businesses available
                in the Alessandro Enterprises ecosystem.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}