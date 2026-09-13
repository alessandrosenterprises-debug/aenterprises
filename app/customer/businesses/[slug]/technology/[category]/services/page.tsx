import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Wrench,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug: string;
    category: string;
  }>;
}

const categoryNames: Record<string, string> = {
  "computers-laptops": "Computers & Laptops",
  "phones-tablets": "Phones & Tablets",
  accessories: "Accessories",
  networking: "Networking",
  "software-applications": "Software & Applications",
  "repairs-maintenance": "Repairs & Maintenance",
  "printers-printing": "Printers & Printing",
  "cctv-security": "CCTV & Security",
  "data-storage": "Data & Storage",
  "it-support": "IT Support",
  "web-digital-solutions": "Web & Digital Solutions",
  "technology-consultation": "Technology Consultation",
};

export default async function TechnologyServicesPage({
  params,
}: PageProps) {
  const { slug, category } = await params;

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, description, logo_url, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!business) {
    redirect("/customer/businesses");
  }

  const categoryName =
    categoryNames[category] ?? category.replaceAll("-", " ");

  const { data: services, error } = await supabase
    .from("services")
    .select(
      `
        id,
        business_id,
        name,
        description,
        base_price,
        status,
        image_url,
        category
      `,
    )
    .eq("business_id", business.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Technology services loading error:", error);
  }

  const keywords = category.split("-").map((word) => word.toLowerCase());

  const filteredServices =
    services?.filter((service) => {
      const searchable = [
        service.name,
        service.description,
        service.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return keywords.some((keyword) => searchable.includes(keyword));
    }) ?? [];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-[#03162F]">
      <CustomerNavigation />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href={`/customer/businesses/${slug}/technology/${category}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#03162F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {categoryName}
        </Link>

        <section className="overflow-hidden rounded-3xl bg-[#03162F]">
          <div className="relative p-6 sm:p-8">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#D4AF37]/20 blur-3xl" />

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
                <Wrench className="h-4 w-4" />
                {business.name}
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]">
                  <Wrench className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-3xl font-black text-white">
                    {categoryName} Services
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Professional services provided by Alessandro Tech
                    Solutions. Select a service to continue with booking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
            Available services
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">{categoryName}</h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredServices.length} service
                {filteredServices.length === 1 ? "" : "s"} available
              </p>
            </div>
          </div>

          {filteredServices.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <article
                  key={service.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {service.image_url ? (
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#03162F] to-[#10294a]">
                      <Wrench className="h-12 w-12 text-[#D4AF37]" />
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="font-black text-[#03162F]">
                      {service.name}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {service.description ||
                        "Professional technology service from Alessandro Tech Solutions."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <Clock3 className="h-3.5 w-3.5" />
                        By appointment
                      </span>

                      {service.base_price !== null && (
                        <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold text-[#7c6510]">
                          From ZMW{" "}
                          {Number(service.base_price).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/customer/bookings/new/${service.id}`}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#03162F] transition hover:bg-[#e3c35c]"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Book Service
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
              <Wrench className="mx-auto h-9 w-9 text-slate-300" />

              <h3 className="mt-4 font-black">
                No services available yet
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                There are currently no active {categoryName.toLowerCase()}{" "}
                services available.
              </p>

              <Link
                href={`/customer/businesses/${slug}/apply`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white"
              >
                Request Assistance
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}