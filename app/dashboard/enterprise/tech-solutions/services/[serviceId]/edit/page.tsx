import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Save,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import EditServiceForm from "./EditServiceForm";

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

interface PageProps {
  params: Promise<{
    serviceId: string;
  }>;
}

export default async function EditTechSolutionsServicePage({
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
      "AEOS Tech Solutions edit business error:",
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
      "AEOS Tech Solutions edit service error:",
      JSON.stringify(serviceError, null, 2)
    );
  }

  if (!service) {
    notFound();
  }

  const serviceRecord = service as Service;

  /*
   * ------------------------------------------------------------
   * COMMON TECH SOLUTIONS CATEGORIES
   * ------------------------------------------------------------
   */

  const categories = [
    "Computers & Laptops",
    "Phones & Accessories",
    "IT Support",
    "Networking",
    "CCTV & Security",
    "Printers",
    "Web Development",
    "Graphic Design",
    "Software & Systems",
    "Data & Backup",
    "Cybersecurity",
    "Other",
  ];

  /*
   * ------------------------------------------------------------
   * PAGE
   * ------------------------------------------------------------
   */

  return (
    <div className="space-y-8">
      {/* --------------------------------------------------------
          BACK
      --------------------------------------------------------- */}

      <div>
        <Link
          href={`/dashboard/enterprise/tech-solutions/services/${serviceRecord.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#03162F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Service
        </Link>
      </div>

      {/* --------------------------------------------------------
          HEADER
      --------------------------------------------------------- */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            AEOS • Tech Solutions • Services
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#03162F]">
            Edit Service
          </h1>

          <p className="mt-2 max-w-3xl text-slate-500">
            Update the information for this Tech Solutions
            service. Changes are saved to the same catalogue
            record used by the customer-facing application.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 lg:self-auto">
          <CheckCircle2 className="h-4 w-4" />
          Connected to customer experience
        </div>
      </div>

      {/* --------------------------------------------------------
          CURRENT SERVICE
      --------------------------------------------------------- */}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[280px_1fr]">
          <div className="relative min-h-[220px] bg-slate-100">
            {serviceRecord.image_url ? (
              <img
                src={serviceRecord.image_url}
                alt={serviceRecord.name}
                className="h-full min-h-[220px] w-full object-cover"
              />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#03162F] text-white">
                    <ImageIcon className="h-7 w-7" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    No image currently set
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Editing
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black text-[#03162F]">
                {serviceRecord.name}
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  serviceRecord.status?.toLowerCase() ===
                  "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {serviceRecord.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              {serviceRecord.category ||
                "No category assigned"}
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------
          EDIT FORM
      --------------------------------------------------------- */}

      <EditServiceForm
        service={serviceRecord}
        categories={categories}
      />

      {/* --------------------------------------------------------
          HELP / CONNECTION NOTICE
      --------------------------------------------------------- */}

      <section className="rounded-3xl border border-[#D4AF37]/30 bg-[#03162F] p-7 text-white shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Wrench className="h-6 w-6 text-[#D4AF37]" />
          </div>

          <div>
            <h2 className="font-black">
              One source of truth
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-300">
              This service is stored in the shared enterprise
              catalogue. Saving here updates the service that
              Tech Solutions customers see and use for booking.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}