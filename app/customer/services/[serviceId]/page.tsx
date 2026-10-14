import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SaveCustomerServiceButton from "./SaveCustomerServiceButton";

export const dynamic = "force-dynamic";

export default async function CustomerServiceDetailsPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  const supabase = await createClient();
  const { data: service, error } = await supabase
    .from("enterprise_catalog")
    .select(`
      id, business_id, item_type, category, name, description, base_price,
      status, image_url, attributes,
      businesses!inner (id, name, slug, active, logo_url)
    `)
    .eq("id", serviceId)
    .ilike("item_type", "service")
    .ilike("status", "active")
    .eq("businesses.active", true)
    .maybeSingle();

  if (error) console.error("Customer service detail loading error:", error);
  if (!service) notFound();

  const business = Array.isArray(service.businesses)
    ? service.businesses[0]
    : service.businesses;
  const attributes = (service.attributes ?? {}) as Record<string, unknown>;
  const duration = typeof attributes.service_duration === "string"
    ? attributes.service_duration
    : null;
  const price = service.base_price == null
    ? null
    : `ZMW ${Number(service.base_price).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-[#03162F]">

      <div className="mx-auto max-w-5xl px-5 py-7 sm:px-6">
        <Link href="/customer/services" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#03162F]">
          <ArrowLeft className="h-4 w-4" /> All services
        </Link>

        <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-h-72 bg-slate-100">
              {service.image_url ? (
                <img src={service.image_url} alt={service.name} className="h-full min-h-72 w-full object-cover" />
              ) : (
                <div className="flex h-full min-h-72 items-center justify-center text-[#D4AF37]"><Wrench className="h-16 w-16" /></div>
              )}
            </div>
            <div className="flex flex-col p-6 sm:p-9">
              <div className="flex items-center gap-3">
                {business?.logo_url && <img src={business.logo_url} alt={`${business.name} logo`} className="h-10 w-10 rounded-lg border border-slate-100 bg-white object-contain p-1" />}
                <p className="text-xs font-bold uppercase tracking-wider text-[#9A7910]">{business?.name ?? "Alessandro Enterprises"}</p>
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-tight">{service.name}</h1>
              {service.category && <p className="mt-2 text-sm font-semibold text-slate-500">{service.category}</p>}
              {service.description && <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">{service.description}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                {price && <span className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">{price}</span>}
                {duration && <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"><Clock3 className="h-4 w-4" />{duration}</span>}
              </div>
              <div className="mt-auto grid gap-3 pt-8 sm:grid-cols-2">
                <SaveCustomerServiceButton serviceId={service.id} />
                <Link href={`/customer/bookings/new/${service.id}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0a2549]">
                  <CalendarDays className="h-4 w-4" /> Book service
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
