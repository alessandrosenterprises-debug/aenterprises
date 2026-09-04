import Link from "next/link";
import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface CatalogItem {
  id: string;
  business_id: string;
  item_type: string;
  category: string | null;
  name: string;
  description: string | null;
  base_price: number | null;
  quantity: number | null;
  status: string | null;
  image_url: string | null;
  attributes: Record<string, unknown> | null;

  businesses?: {
    id: string;
    name: string;
  } | null;
}

function formatMoney(amount: number | null) {
  if (amount === null || amount === undefined) {
    return null;
  }

  return `ZMW ${Number(amount).toFixed(2)}`;
}

export default async function NewBookingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24">
        <CustomerNavigation />

        <section className="mx-auto max-w-3xl px-5 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#03162F] text-white">
              <CalendarDays className="h-6 w-6" />
            </div>

            <h1 className="mt-4 text-xl font-bold text-[#03162F]">
              Please sign in
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              You need to sign in before making a booking.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /*
   * Find the customer's profile.
   *
   * We use the same customer lookup strategy as the
   * main bookings page.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  let customer: {
    id: string;
    full_name: string;
    phone: string;
  } | null = null;

  if (profile?.email) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("email", profile.email)
      .maybeSingle();

    customer = data;
  }

  if (!customer && user.email) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("email", user.email)
      .maybeSingle();

    customer = data;
  }

  if (!customer && profile?.phone) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("phone", profile.phone)
      .maybeSingle();

    customer = data;
  }

  /*
   * Load only active SERVICES.
   *
   * New Booking must never show products or
   * financial/application items.
   */
  const { data: catalogData, error } = await supabase
    .from("enterprise_catalog")
    .select(`
      id,
      business_id,
      item_type,
      category,
      name,
      description,
      base_price,
      quantity,
      status,
      image_url,
      attributes,

      businesses (
        id,
        name
      )
    `)
    .eq("item_type", "service")
    .eq("status", "Active")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("New booking catalogue error:", error);
  }

  const services = (catalogData ?? []) as unknown as CatalogItem[];

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <CustomerNavigation />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="bg-[#03162F] px-5 pb-10 pt-7 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/customer/bookings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Bookings
          </Link>

          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Booking
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Choose a Service
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Select a service from one of our businesses to start your
              booking.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          SERVICES
      ===================================================== */}

      <section className="mx-auto max-w-5xl px-5 py-8">
        {!customer && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-800">
              Customer profile not found
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-700">
              You can view available services, but your customer profile must
              be connected before completing a booking.
            </p>
          </div>
        )}

        {services.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-[#03162F]">
              <CalendarDays className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-[#03162F]">
              No services available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are currently no active services available for booking.
              Please check again later.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {services.map((service) => {
              const price = formatMoney(service.base_price);

              const attributes = service.attributes ?? {};

              const duration =
                typeof attributes.service_duration === "string"
                  ? attributes.service_duration
                  : null;

              return (
                <article
                  key={service.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="grid md:grid-cols-[240px_1fr]">
                    {/* IMAGE */}

                    <div className="relative min-h-[220px] bg-slate-100">
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-[220px] items-center justify-center text-[#03162F]">
                          <CalendarDays className="h-12 w-12 opacity-30" />
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="flex flex-col p-5 sm:p-6">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
                          {service.businesses?.name ||
                            "Alessandro Enterprises"}
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-[#03162F]">
                          {service.name}
                        </h2>

                        {service.category && (
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {service.category}
                          </p>
                        )}

                        {service.description && (
                          <p className="mt-4 text-sm leading-6 text-slate-600">
                            {service.description}
                          </p>
                        )}

                        <div className="mt-5 flex flex-wrap gap-3">
                          {duration && (
                            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                              <Clock className="h-4 w-4 text-[#03162F]" />
                              {duration}
                            </div>
                          )}

                          {price && (
                            <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-[#03162F]">
                              {price}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ACTION */}

                      <div className="mt-6 border-t border-slate-100 pt-5">
                        <Link
                          href={`/customer/bookings/new/${service.id}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0a2549] hover:shadow-lg"
                        >
                          <CalendarDays className="h-5 w-5" />
                          Book This Service
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}