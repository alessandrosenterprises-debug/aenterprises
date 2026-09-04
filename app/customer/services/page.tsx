import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Wrench,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";

type Service = {
  id: string;
  business_id: string;
  item_type: string;
  category: string | null;
  name: string;
  description: string | null;
  base_price: number | string | null;
  status: string;
  image_url: string | null;
  businesses:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | {
        id: string;
        name: string;
        slug: string;
      }[]
    | null;
};

export default async function CustomerServicesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
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
    .eq("item_type", "service")
    .eq("status", "Active")
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Customer services loading error:",
      error
    );
  }

  const services = (data ?? []) as Service[];

  return (
    <main className="min-h-screen bg-slate-50 pb-[92px]">
      <CustomerNavigation />

      <div className="mx-auto w-full max-w-[720px]">
        {/* =========================================================
            HEADER
        ========================================================= */}
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

        {/* =========================================================
            ALL SERVICES
        ========================================================= */}
        <section className="px-5 py-7">
          {services.length > 0 ? (
            <div className="space-y-3">
              {services.map((service) => {
                const business = Array.isArray(
                  service.businesses
                )
                  ? service.businesses[0]
                  : service.businesses;

                const businessHome = business?.slug
                  ? `/customer/businesses/${business.slug}`
                  : "/customer/businesses";

                return (
                  <Link
                    key={service.id}
                    href={businessHome}
                    className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:shadow-lg"
                  >
                    <div className="flex gap-4">
                      {/* SERVICE IMAGE */}
                      {service.image_url ? (
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37] transition duration-300 group-hover:bg-[#08264D]">
                          <Wrench className="h-6 w-6" />
                        </div>
                      )}

                      {/* SERVICE INFORMATION */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-sm font-bold text-[#03162F]">
                              {service.name}
                            </h2>

                            {business?.name && (
                              <p className="mt-1 text-[10px] font-bold text-[#D4AF37]">
                                {business.name}
                              </p>
                            )}
                          </div>

                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition duration-300 group-hover:translate-x-1 group-hover:text-[#D4AF37]" />
                        </div>

                        {service.description && (
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {service.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {service.category && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                              {service.category}
                            </span>
                          )}

                          {service.base_price !== null &&
                            service.base_price !== undefined && (
                              <span className="rounded-full bg-[#D4AF37]/10 px-2.5 py-1 text-[9px] font-bold text-[#8A6D00]">
                                K
                                {Number(
                                  service.base_price
                                ).toLocaleString("en-ZM", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            )}
                        </div>

                        {/* BUSINESS HOME INDICATOR */}
                        {business?.name && (
                          <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-slate-400 transition group-hover:text-[#03162F]">
                            Visit {business.name}
                            <ArrowRight className="h-3 w-3 transition duration-300 group-hover:translate-x-1" />
                          </div>
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