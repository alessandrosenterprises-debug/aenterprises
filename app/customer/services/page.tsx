import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Wrench,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerServicesPage() {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from("enterprise_catalog")
    .select(
      `
        id,
        business_id,
        item_type,
        category,
        name,
        description,
        base_price,
        status,
        image_url,
        businesses (
          id,
          name,
          slug
        )
      `
    )
    .eq("status", "Active")
    .order("name");

  if (error) {
    console.error(
      "Customer services loading error:",
      error
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-[92px]">
      <CustomerNavigation />

      <div className="mx-auto w-full max-w-[720px]">

        <section className="bg-[#03162F] px-5 pb-10 pt-7 text-white">
          <Link
            href="/customer"
            className="mb-6 inline-flex items-center text-xs font-semibold text-slate-300 transition hover:text-[#D4AF37]"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]">
              <Wrench className="h-6 w-6" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Discover
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight">
                Services
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Explore services available across
                Alessandro Enterprises.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 py-7">
          {services && services.length > 0 ? (
            <div className="space-y-3">
              {services.map((service) => {
                const business = Array.isArray(
                  service.businesses
                )
                  ? service.businesses[0]
                  : service.businesses;

                return (
                  <Link
                    key={service.id}
                    href={
                      business?.slug
                        ? `/customer/businesses/${business.slug}`
                        : "/customer/businesses"
                    }
                    className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
                  >
                    <div className="flex gap-4">
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]">
                          <Wrench className="h-6 w-6" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-sm font-bold text-[#03162F]">
                              {service.name}
                            </h2>

                            {business?.name && (
                              <p className="mt-1 text-[10px] font-semibold text-[#D4AF37]">
                                {business.name}
                              </p>
                            )}
                          </div>

                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-[#D4AF37]" />
                        </div>

                        {service.description && (
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {service.description}
                          </p>
                        )}

                        {service.category && (
                          <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                            {service.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Wrench className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-sm font-bold text-[#03162F]">
                No services available
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Services will appear here once they
                are added and activated.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}