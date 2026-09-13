import {
  ArrowLeft,
  CheckCircle2,
  CircleOff,
  Image as ImageIcon,
  Save,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* ================================================================
   SERVER ACTION — CREATE TECH SOLUTIONS SERVICE
================================================================ */

async function createService(formData: FormData) {
  "use server";

  const supabase = await createClient();

  /* ------------------------------------------------------------
     LOAD TECH SOLUTIONS BUSINESS
  ------------------------------------------------------------ */

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .ilike("name", "%Tech Solutions%")
    .eq("active", true)
    .maybeSingle();

  if (businessError) {
    console.error(
      "AEOS Tech Solutions create service business error:",
      JSON.stringify(businessError, null, 2)
    );

    redirect(
      "/dashboard/enterprise/tech-solutions/services/new?error=Unable%20to%20load%20Tech%20Solutions%20business."
    );
  }

  if (!business) {
    redirect(
      "/dashboard/enterprise/tech-solutions/services/new?error=Tech%20Solutions%20business%20was%20not%20found."
    );
  }

  /* ------------------------------------------------------------
     READ FORM VALUES
  ------------------------------------------------------------ */

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(
    formData.get("description") ?? ""
  ).trim();
  const priceValue = String(
    formData.get("base_price") ?? ""
  ).trim();
  const imageUrl = String(
    formData.get("image_url") ?? ""
  ).trim();
  const statusValue = String(
    formData.get("status") ?? "active"
  ).trim();

  const attributesRaw = String(
    formData.get("attributes") ?? ""
  ).trim();

  /* ------------------------------------------------------------
     VALIDATION
  ------------------------------------------------------------ */

  if (!name) {
    redirect(
      "/dashboard/enterprise/tech-solutions/services/new?error=Service%20name%20is%20required."
    );
  }

  if (!priceValue) {
    redirect(
      "/dashboard/enterprise/tech-solutions/services/new?error=Service%20price%20is%20required."
    );
  }

  const basePrice = Number(priceValue);

  if (!Number.isFinite(basePrice) || basePrice < 0) {
    redirect(
      "/dashboard/enterprise/tech-solutions/services/new?error=Enter%20a%20valid%20service%20price."
    );
  }

  const status =
    statusValue.toLowerCase() === "inactive"
      ? "inactive"
      : "active";

  /* ------------------------------------------------------------
     PARSE ADDITIONAL ATTRIBUTES
  ------------------------------------------------------------ */

  let attributes: Record<string, unknown> = {};

  if (attributesRaw) {
    try {
      const parsed = JSON.parse(attributesRaw);

      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        redirect(
          "/dashboard/enterprise/tech-solutions/services/new?error=Additional%20information%20must%20be%20a%20JSON%20object."
        );
      }

      attributes = parsed as Record<string, unknown>;
    } catch {
      redirect(
        "/dashboard/enterprise/tech-solutions/services/new?error=Additional%20information%20contains%20invalid%20JSON."
      );
    }
  }

  /* ------------------------------------------------------------
     INSERT SERVICE
  ------------------------------------------------------------ */

  const { data: createdService, error: insertError } =
    await supabase
      .from("enterprise_catalog")
      .insert({
        business_id: business.id,
        item_type: "service",
        category: category || null,
        name,
        description: description || null,
        base_price: basePrice,
        quantity: null,
        status,
        image_url: imageUrl || null,
        attributes,
      })
      .select("id")
      .single();

  if (insertError || !createdService) {
    console.error(
      "AEOS Tech Solutions create service insert error:",
      JSON.stringify(insertError, null, 2)
    );

    redirect(
      "/dashboard/enterprise/tech-solutions/services/new?error=Unable%20to%20create%20the%20service.%20Please%20try%20again."
    );
  }

  /* ------------------------------------------------------------
     SUCCESS
  ------------------------------------------------------------ */

  redirect(
    `/dashboard/enterprise/tech-solutions/services/${createdService.id}`
  );
}

/* ================================================================
   PAGE
================================================================ */

interface PageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function AddTechSolutionsServicePage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const errorMessage = params.error
    ? decodeURIComponent(params.error)
    : null;

  const supabase = await createClient();

  /* ------------------------------------------------------------
     LOAD TECH SOLUTIONS BUSINESS
  ------------------------------------------------------------ */

  const { data: business, error: businessError } =
    await supabase
      .from("businesses")
      .select("id, name, slug")
      .ilike("name", "%Tech Solutions%")
      .eq("active", true)
      .maybeSingle();

  if (businessError) {
    console.error(
      "AEOS Tech Solutions add service business error:",
      JSON.stringify(businessError, null, 2)
    );
  }

  if (!business) {
    redirect("/dashboard/enterprise");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div>
        <Link
          href="/dashboard/enterprise/tech-solutions/services"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#03162F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
          AEOS • Tech Solutions
        </p>

        <h1 className="mt-2 text-3xl font-black text-[#03162F]">
          Add Service
        </h1>

        <p className="mt-2 max-w-3xl text-slate-500">
          Create a new service for Alessandro Tech Solutions.
          Active services can be made available through the
          customer-facing booking experience.
        </p>
      </div>

      {/* ========================================================
          ERROR MESSAGE
      ======================================================== */}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <CircleOff className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">
              Service could not be created
            </p>

            <p className="mt-1 text-sm">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          BUSINESS CONTEXT
      ======================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#03162F] text-white">
            <Wrench className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
              Business
            </p>

            <p className="mt-1 text-lg font-black text-[#03162F]">
              {business.name}
            </p>

            <p className="text-sm text-slate-500">
              New service will be added to the Tech Solutions
              catalogue.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          SERVICE FORM
      ======================================================== */}

      <form
        action={createService}
        className="space-y-6"
      >
        {/* ------------------------------------------------------
            BASIC INFORMATION
        ------------------------------------------------------ */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Service Information
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#03162F]">
              Basic Details
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Enter the information customers and staff will
              use to identify this service.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Service Name */}

            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-bold text-[#03162F]"
              >
                Service Name
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Website Development"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>

            {/* Category */}

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-bold text-[#03162F]"
              >
                Category
              </label>

              <input
                id="category"
                name="category"
                type="text"
                placeholder="e.g. Web Development"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>

            {/* Price */}

            <div>
              <label
                htmlFor="base_price"
                className="mb-2 block text-sm font-bold text-[#03162F]"
              >
                Service Price (ZMW)
                <span className="ml-1 text-red-500">*</span>
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                  ZMW
                </span>

                <input
                  id="base_price"
                  name="base_price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-16 pr-4 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Enter the standard customer price in Zambian
                Kwacha.
              </p>
            </div>

            {/* Description */}

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-bold text-[#03162F]"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={6}
                placeholder="Describe what this service includes, who it is for, and what the customer can expect..."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />

              <p className="mt-2 text-xs text-slate-400">
                This description can be displayed on the
                customer-facing service page.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------
            IMAGE
        ------------------------------------------------------ */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Service Media
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#03162F]">
              Service Image
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add an image URL for the service card and
              customer-facing service page.
            </p>
          </div>

          <div>
            <label
              htmlFor="image_url"
              className="mb-2 block text-sm font-bold text-[#03162F]"
            >
              Image URL
            </label>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <ImageIcon className="h-5 w-5" />
              </div>

              <input
                id="image_url"
                name="image_url"
                type="url"
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              You can use a public Supabase Storage image URL
              or another publicly accessible image URL.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------
            VISIBILITY
        ------------------------------------------------------ */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Availability
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#03162F]">
              Customer Visibility
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Active services are treated as customer-visible
              services by the catalogue.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Active */}

            <label className="relative cursor-pointer">
              <input
                type="radio"
                name="status"
                value="active"
                defaultChecked
                className="peer sr-only"
              />

              <div className="rounded-2xl border-2 border-slate-200 p-5 transition peer-checked:border-emerald-500 peer-checked:bg-emerald-50">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-black text-[#03162F]">
                      Active
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Service is available and can be shown
                      to customers.
                    </p>
                  </div>
                </div>
              </div>
            </label>

            {/* Inactive */}

            <label className="relative cursor-pointer">
              <input
                type="radio"
                name="status"
                value="inactive"
                className="peer sr-only"
              />

              <div className="rounded-2xl border-2 border-slate-200 p-5 transition peer-checked:border-slate-500 peer-checked:bg-slate-50">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <CircleOff className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-black text-[#03162F]">
                      Inactive
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Service remains in the catalogue but
                      is not customer-visible as an active
                      service.
                    </p>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* ------------------------------------------------------
            ATTRIBUTES
        ------------------------------------------------------ */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Advanced Information
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#03162F]">
              Additional Attributes
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Optional structured information for this service.
              Leave this empty if you do not need additional
              attributes.
            </p>
          </div>

          <textarea
            id="attributes"
            name="attributes"
            rows={8}
            placeholder={`{
  "duration": "2 hours",
  "delivery": "5 working days",
  "support": "30 days"
}`}
            className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm leading-6 text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/20"
          />

          <p className="mt-2 text-xs text-slate-400">
            Use valid JSON in object format. Example:
            {" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
              {"{\"duration\":\"2 hours\"}"}
            </code>
          </p>
        </section>

        {/* ------------------------------------------------------
            ACTIONS
        ------------------------------------------------------ */}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/enterprise/tech-solutions/services"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0A2852] hover:shadow-md"
          >
            <Save className="h-5 w-5" />
            Create Service
          </button>
        </div>
      </form>
    </div>
  );
}