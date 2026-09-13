import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleOff,
  Clock3,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Business {
  id: string;
  name: string;
  slug: string;
}

interface Service {
  id: string;
  business_id: string;
  item_type: string;
  category: string | null;
  name: string;
  description: string | null;
  base_price: number | null;
  quantity: number | null;
  status: string;
  image_url: string | null;
  attributes: Record<string, unknown> | null;
}

export default async function TechSolutionsServicesPage() {
  const supabase = await createClient();

  /*
   * ------------------------------------------------------------
   * LOAD TECH SOLUTIONS BUSINESS
   * ------------------------------------------------------------
   */

  const { data: business, error: businessError } =
    await supabase
      .from("businesses")
      .select(
        `
          id,
          name,
          slug
        `
      )
      .ilike("name", "%Tech Solutions%")
      .eq("active", true)
      .maybeSingle();

  if (businessError) {
    console.error(
      "AEOS Tech Solutions services business error:",
      JSON.stringify(businessError, null, 2)
    );
  }

  if (!business) {
    redirect("/dashboard/enterprise");
  }

  /*
   * ------------------------------------------------------------
   * LOAD REAL TECH SOLUTIONS SERVICES
   * ------------------------------------------------------------
   */

  const { data: serviceData, error: serviceError } =
    await supabase
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
          quantity,
          status,
          image_url,
          attributes
        `
      )
      .eq("business_id", business.id)
      .ilike("item_type", "service")
      .order("created_at", {
        ascending: false,
      });

  if (serviceError) {
    console.error(
      "AEOS Tech Solutions services error:",
      JSON.stringify(serviceError, null, 2)
    );
  }

  const services = (serviceData ?? []) as Service[];

  const activeServices = services.filter(
    (service) =>
      service.status?.toLowerCase() === "active"
  );

  const inactiveServices = services.filter(
    (service) =>
      service.status?.toLowerCase() !== "active"
  );

  return (
    <div className="space-y-8">
      {/* --------------------------------------------------------
          HEADER
      --------------------------------------------------------- */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/dashboard/enterprise/tech-solutions"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#03162F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Tech Solutions Workspace
          </Link>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            AEOS • Tech Solutions
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#03162F]">
            Services
          </h1>

          <p className="mt-2 max-w-3xl text-slate-500">
            Manage every service offered by Alessandro Tech
            Solutions. These services are connected directly
            to the customer-facing Tech Solutions experience.
          </p>
        </div>

        <Link
          href="/dashboard/enterprise/tech-solutions/services/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0A2852] hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
          Add Service
        </Link>
      </div>

      {/* --------------------------------------------------------
          SUMMARY
      --------------------------------------------------------- */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Services"
          value={services.length}
          icon={Wrench}
        />

        <SummaryCard
          title="Active Services"
          value={activeServices.length}
          icon={CheckCircle2}
        />

        <SummaryCard
          title="Inactive Services"
          value={inactiveServices.length}
          icon={CircleOff}
        />

        <SummaryCard
          title="Customer Visible"
          value={activeServices.length}
          icon={Clock3}
        />
      </div>

      {/* --------------------------------------------------------
          SERVICE MANAGEMENT
      --------------------------------------------------------- */}

      <section className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Service Catalogue
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#03162F]">
              Tech Solutions Services
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Select a service to open its dedicated management
              page.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-400 shadow-sm">
            <Search className="h-4 w-4" />
            <span>Service management</span>
          </div>
        </div>

        {services.length === 0 ? (
          <EmptyServices />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ================================================================
   SUMMARY CARD
================================================================ */

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-black text-[#03162F]">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#03162F] text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SERVICE CARD
================================================================ */

function ServiceCard({
  service,
}: {
  service: Service;
}) {
  const isActive =
    service.status?.toLowerCase() === "active";

  const price =
    service.base_price !== null
      ? `ZMW ${Number(
          service.base_price
        ).toLocaleString("en-ZM", {
          minimumFractionDigits: 2,
        })}`
      : "Price not set";

  return (
    <Link
      href={`/dashboard/enterprise/tech-solutions/services/${service.id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
    >
      {/* Image */}

      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Wrench className="h-16 w-16 text-[#03162F]/20" />
          </div>
        )}

        {/* Status */}

        <div className="absolute right-4 top-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {isActive ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <CircleOff className="h-3.5 w-3.5" />
            )}

            {service.status}
          </span>
        </div>
      </div>

      {/* Content */}

      <div className="p-5">
        {service.category && (
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
            {service.category}
          </p>
        )}

        <h3 className="mt-2 text-xl font-black text-[#03162F]">
          {service.name}
        </h3>

        {service.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
            {service.description}
          </p>
        ) : (
          <p className="mt-2 text-sm italic text-slate-400">
            No service description has been added.
          </p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-medium text-slate-400">
              Service price
            </p>

            <p className="mt-1 font-bold text-[#03162F]">
              {price}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition group-hover:bg-[#03162F] group-hover:text-white">
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ================================================================
   EMPTY STATE
================================================================ */

function EmptyServices() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#03162F] text-white">
        <Wrench className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-xl font-black text-[#03162F]">
        No Tech Solutions services yet
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        Add the first Tech Solutions service and it will
        become part of the same service catalogue used by
        the customer-facing experience.
      </p>

      <Link
        href="/dashboard/enterprise/tech-solutions/services/new"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0A2852]"
      >
        <Plus className="h-5 w-5" />
        Add First Service
      </Link>
    </div>
  );
}