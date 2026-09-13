import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleOff,
  Clock3,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  Trash2,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

interface Business {
  id: string;
  name: string;
  slug: string;
}

interface PageProps {
  params: Promise<{
    serviceId: string;
  }>;
}

export default async function TechSolutionsServicePage({
  params,
}: PageProps) {
  const { serviceId } = await params;

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
      "AEOS Tech Solutions business error:",
      JSON.stringify(businessError, null, 2)
    );
  }

  if (!business) {
    redirect("/dashboard/enterprise");
  }

  /*
   * ------------------------------------------------------------
   * LOAD SERVICE
   * ------------------------------------------------------------
   */

  const { data: service, error: serviceError } =
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
      .eq("id", serviceId)
      .eq("business_id", business.id)
      .ilike("item_type", "service")
      .maybeSingle();

  if (serviceError) {
    console.error(
      "AEOS Tech Solutions service error:",
      JSON.stringify(serviceError, null, 2)
    );
  }

  if (!service) {
    notFound();
  }

  const serviceRecord = service as Service;

  const isActive =
    serviceRecord.status?.toLowerCase() === "active";

  const price =
    serviceRecord.base_price !== null
      ? `ZMW ${Number(
          serviceRecord.base_price
        ).toLocaleString("en-ZM", {
          minimumFractionDigits: 2,
        })}`
      : "Price not set";

  /*
   * ------------------------------------------------------------
   * CUSTOMER BOOKING LINK
   * ------------------------------------------------------------
   */

  const customerBookingUrl = `/customer/bookings/new/${serviceRecord.id}`;

  return (
    <div className="space-y-8">
      {/* --------------------------------------------------------
          BREADCRUMB / BACK
      --------------------------------------------------------- */}

      <div>
        <Link
          href="/dashboard/enterprise/tech-solutions/services"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#03162F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>
      </div>

      {/* --------------------------------------------------------
          HEADER
      --------------------------------------------------------- */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            AEOS • Tech Solutions • Service
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#03162F]">
            {serviceRecord.name}
          </h1>

          <p className="mt-2 max-w-3xl text-slate-500">
            Manage this Tech Solutions service and control
            the information customers see when they browse
            and book it.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/enterprise/tech-solutions/services/${serviceRecord.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#03162F] shadow-sm transition hover:border-[#D4AF37] hover:shadow-md"
          >
            <Edit3 className="h-4 w-4" />
            Edit Service
          </Link>

          <Link
            href={customerBookingUrl}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0A2852] hover:shadow-md"
          >
            <ExternalLink className="h-4 w-4" />
            Customer View
          </Link>
        </div>
      </div>

      {/* --------------------------------------------------------
          SERVICE STATUS
      --------------------------------------------------------- */}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          label="Status"
          value={serviceRecord.status}
          icon={
            isActive ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <CircleOff className="h-5 w-5" />
            )
          }
          valueClassName={
            isActive
              ? "text-emerald-600"
              : "text-slate-500"
          }
        />

        <InfoCard
          label="Service Price"
          value={price}
          icon={<Wrench className="h-5 w-5" />}
        />

        <InfoCard
          label="Category"
          value={serviceRecord.category || "Uncategorised"}
          icon={<Clock3 className="h-5 w-5" />}
        />

        <InfoCard
          label="Booking"
          value={isActive ? "Available" : "Unavailable"}
          icon={<CalendarDays className="h-5 w-5" />}
          valueClassName={
            isActive
              ? "text-emerald-600"
              : "text-slate-500"
          }
        />
      </section>

      {/* --------------------------------------------------------
          MAIN SERVICE CONTENT
      --------------------------------------------------------- */}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* IMAGE */}

          <div className="min-h-[360px] bg-slate-100">
            {serviceRecord.image_url ? (
              <img
                src={serviceRecord.image_url}
                alt={serviceRecord.name}
                className="h-full min-h-[360px] w-full object-cover"
              />
            ) : (
              <div className="flex min-h-[360px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#03162F] text-white">
                    <ImageIcon className="h-9 w-9" />
                  </div>

                  <p className="mt-4 font-semibold text-slate-500">
                    No service image
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Add an image when editing this service.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SERVICE DETAILS */}

          <div className="p-7 lg:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Service Information
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#03162F]">
              {serviceRecord.name}
            </h2>

            {serviceRecord.category && (
              <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                {serviceRecord.category}
              </div>
            )}

            <div className="mt-7">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Description
              </p>

              {serviceRecord.description ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {serviceRecord.description}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-slate-400">
                  No description has been added for this
                  service.
                </p>
              )}
            </div>

            <div className="mt-7 border-t border-slate-100 pt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Customer Price
                  </p>

                  <p className="mt-1 text-2xl font-black text-[#03162F]">
                    {price}
                  </p>
                </div>

                <div
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {serviceRecord.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------
          CUSTOMER EXPERIENCE
      --------------------------------------------------------- */}

      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Customer Experience
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#03162F]">
              Booking Connection
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              This service is connected to the customer
              booking system. Customers can use this service
              to start a real booking when it is active.
            </p>
          </div>

          <Link
            href={customerBookingUrl}
            target="_blank"
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              isActive
                ? "bg-[#03162F] text-white hover:bg-[#0A2852]"
                : "pointer-events-none bg-slate-100 text-slate-400"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Open Booking Page
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------
          SERVICE ATTRIBUTES
      --------------------------------------------------------- */}

      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Additional Information
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#03162F]">
            Service Attributes
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Additional structured information stored with this
            service.
          </p>
        </div>

        {serviceRecord.attributes &&
        Object.keys(serviceRecord.attributes).length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(serviceRecord.attributes).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {formatAttributeLabel(key)}
                  </p>

                  <p className="mt-2 break-words text-sm font-semibold text-[#03162F]">
                    {formatAttributeValue(value)}
                  </p>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-semibold text-[#03162F]">
              No additional attributes
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Additional service information can be added
              from the edit page.
            </p>
          </div>
        )}
      </section>

      {/* --------------------------------------------------------
          MANAGEMENT ACTIONS
      --------------------------------------------------------- */}

      <section className="rounded-3xl border border-red-100 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
              Service Management
            </p>

            <h2 className="mt-1 text-xl font-black text-[#03162F]">
              Manage this service
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Edit the service information or permanently
              remove this service from Tech Solutions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/enterprise/tech-solutions/services/${serviceRecord.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#03162F] transition hover:border-[#D4AF37]"
            >
              <Edit3 className="h-4 w-4" />
              Edit Service
            </Link>

            <Link
              href={`/dashboard/enterprise/tech-solutions/services/${serviceRecord.id}/delete`}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Delete Service
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================================================================
   INFO CARD
================================================================ */

function InfoCard({
  label,
  value,
  icon,
  valueClassName = "text-[#03162F]",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p
            className={`mt-2 text-lg font-black ${valueClassName}`}
          >
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#03162F]">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   ATTRIBUTE HELPERS
================================================================ */

function formatAttributeLabel(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatAttributeValue(value: unknown) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}