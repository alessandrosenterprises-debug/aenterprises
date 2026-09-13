
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Package,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Business {
  id: string;
  name: string;
  slug: string;
}

interface Product {
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
    productId: string;
  }>;
}

export default async function TechSolutionsProductPage({
  params,
}: PageProps) {
  const { productId } = await params;

  const supabase = await createClient();

  // ------------------------------------------------------------
  // Load Tech Solutions business
  // ------------------------------------------------------------
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
      "AEOS Tech Solutions product business error:",
      JSON.stringify(businessError, null, 2)
    );
  }

  if (!business) {
    redirect("/dashboard/enterprise");
  }

  // ------------------------------------------------------------
  // Load product
  // ------------------------------------------------------------
  const { data: productData, error: productError } =
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
      .eq("id", productId)
      .eq("business_id", business.id)
      .eq("item_type", "product")
      .maybeSingle();

  if (productError) {
    console.error(
      "AEOS Tech Solutions product error:",
      JSON.stringify(productError, null, 2)
    );
  }

  if (!productData) {
    notFound();
  }

  const product = productData as Product;

  const isActive =
    product.status?.toLowerCase() === "active";

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div>
        <Link
          href="/dashboard/enterprise/tech-solutions/products"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#03162F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Technology Shop
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            AEOS • Tech Solutions • Product
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#03162F]">
            {product.name}
          </h1>

          <p className="mt-2 max-w-3xl text-slate-500">
            View and manage the complete Technology Shop
            product record.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/enterprise/tech-solutions/products/${product.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0A2852]"
          >
            <Edit3 className="h-4 w-4" />
            Edit Product
          </Link>

          <Link
            href="/dashboard/enterprise/tech-solutions/products"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#03162F] transition hover:border-[#D4AF37]"
          >
            <Package className="h-4 w-4" />
            All Products
          </Link>
        </div>
      </div>

      {/* Product status */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          label="Status"
          value={product.status}
          icon={
            isActive ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )
          }
          valueClassName={
            isActive
              ? "text-emerald-600"
              : "text-slate-500"
          }
        />

        <InfoCard
          label="Price"
          value={formatPrice(product.base_price)}
          icon={<ShoppingBag className="h-5 w-5" />}
        />

        <InfoCard
          label="Quantity"
          value={
            product.quantity !== null &&
            product.quantity !== undefined
              ? String(product.quantity)
              : "Not set"
          }
          icon={<Package className="h-5 w-5" />}
        />

        <InfoCard
          label="Category"
          value={product.category || "Uncategorized"}
          icon={<Package className="h-5 w-5" />}
        />
      </section>

      {/* Main product information */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[420px_1fr]">
          {/* Image */}
          <div className="bg-slate-100">
            <div className="aspect-square overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[360px] items-center justify-center">
                  <Package className="h-24 w-24 text-slate-300" />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-7 lg:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Product Details
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#03162F]">
              {product.name}
            </h2>

            {product.category && (
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {product.category}
              </p>
            )}

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Product Type"
                value="Technology Shop Product"
              />

              <DetailItem
                label="Status"
                value={product.status}
              />

              <DetailItem
                label="Price"
                value={formatPrice(product.base_price)}
              />

              <DetailItem
                label="Quantity"
                value={
                  product.quantity !== null &&
                  product.quantity !== undefined
                    ? String(product.quantity)
                    : "Not set"
                }
              />
            </div>

            <div className="mt-8 border-t border-slate-100 pt-7">
              <p className="text-sm font-bold text-[#03162F]">
                Description
              </p>

              <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
                {product.description ||
                  "No product description has been added yet."}
              </p>
            </div>

            {/* Customer visibility */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                {isActive ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                    <XCircle className="h-5 w-5" />
                  </div>
                )}

                <div>
                  <p className="font-bold text-[#03162F]">
                    {isActive
                      ? "Customer visible"
                      : "Not customer visible"}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {isActive
                      ? "This product is active and can be displayed in the customer-facing Technology Shop."
                      : "This product is not currently active, so it should not be displayed as an active customer-facing product."}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer page */}
            <div className="mt-6">
              <Link
                href={`/customer/businesses/${business.slug}/products`}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#03162F] transition hover:text-[#D4AF37]"
              >
                View customer Technology Shop
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Attributes */}
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Product Data
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#03162F]">
            Additional Attributes
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Additional product information stored with this
            catalog record.
          </p>
        </div>

        {!product.attributes ||
        Object.keys(product.attributes).length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-semibold text-[#03162F]">
              No additional attributes
            </p>

            <p className="mt-2 text-sm text-slate-500">
              This product does not currently have any
              additional attribute data.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="divide-y divide-slate-100">
              {Object.entries(product.attributes).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="grid gap-2 px-5 py-4 sm:grid-cols-[220px_1fr]"
                  >
                    <p className="text-sm font-bold text-[#03162F]">
                      {formatAttributeLabel(key)}
                    </p>

                    <p className="text-sm leading-6 text-slate-600">
                      {formatAttributeValue(value)}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </section>

      {/* Management actions */}
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Management
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#03162F]">
            Product Actions
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Manage this Technology Shop product directly from
            its product page.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/dashboard/enterprise/tech-solutions/products/${product.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0A2852]"
          >
            <Edit3 className="h-4 w-4" />
            Edit Product
          </Link>

          <Link
            href="/dashboard/enterprise/tech-solutions/products"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#03162F] transition hover:border-[#D4AF37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </section>
    </div>
  );
}

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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p
            className={`mt-2 text-lg font-black ${valueClassName}`}
          >
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03162F] text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-bold text-[#03162F]">
        {value}
      </p>
    </div>
  );
}

function formatPrice(value: number | null) {
  if (value === null || value === undefined) {
    return "Price not set";
  }

  return `ZMW ${Number(value).toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAttributeLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
}
