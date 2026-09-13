import {
  CheckCircle2,
  ChevronRight,
  Package,
  Plus,
  XCircle,
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
}

export default async function TechSolutionsProductsPage() {
  const supabase = await createClient();

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
      "AEOS Tech Solutions products business error:",
      JSON.stringify(businessError, null, 2)
    );
  }

  if (!business) {
    redirect("/dashboard/enterprise");
  }

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
          image_url
        `
      )
      .eq("business_id", business.id)
      .eq("item_type", "product")
      .order("created_at", {
        ascending: false,
      });

  if (productError) {
    console.error(
      "AEOS Tech Solutions products error:",
      JSON.stringify(productError, null, 2)
    );
  }

  const products = (productData ?? []) as Product[];

  const activeProducts = products.filter(
    (product) => product.status?.toLowerCase() === "active"
  );

  const inactiveProducts = products.filter(
    (product) => product.status?.toLowerCase() !== "active"
  );

  const customerVisibleProducts = activeProducts.filter(
    (product) => product.status?.toLowerCase() === "active"
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
          AEOS • Tech Solutions
        </p>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#03162F]">
              Technology Shop
            </h1>

            <p className="mt-2 max-w-3xl text-slate-500">
              Manage products sold through Alessandro Tech
              Solutions and the customer-facing Technology Shop.
            </p>
          </div>

          <Link
            href="/dashboard/enterprise/tech-solutions/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0A2852]"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Products"
          value={products.length}
          icon={Package}
        />

        <SummaryCard
          title="Active"
          value={activeProducts.length}
          icon={CheckCircle2}
        />

        <SummaryCard
          title="Inactive"
          value={inactiveProducts.length}
          icon={XCircle}
        />

        <SummaryCard
          title="Customer Visible"
          value={customerVisibleProducts.length}
          icon={CheckCircle2}
        />
      </div>

      {/* Products */}
      <section className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Products
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#03162F]">
            Technology Shop Products
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Select a product to view its complete details and
            manage it.
          </p>
        </div>

        {products.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/dashboard/enterprise/tech-solutions/products/${product.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {product.category && (
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
                          {product.category}
                        </p>
                      )}

                      <h3 className="mt-2 text-lg font-black text-[#03162F]">
                        {product.name}
                      </h3>
                    </div>

                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#D4AF37]" />
                  </div>

                  {product.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Price
                      </p>

                      <p className="mt-1 font-bold text-[#03162F]">
                        {formatPrice(product.base_price)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Quantity
                      </p>

                      <p className="mt-1 font-bold text-[#03162F]">
                        {product.quantity ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        product.status.toLowerCase() === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {product.status}
                    </span>

                    <span className="text-xs font-semibold text-slate-400 transition group-hover:text-[#03162F]">
                      View product
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between">
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

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Package className="h-7 w-7 text-slate-400" />
      </div>

      <h3 className="mt-5 text-lg font-black text-[#03162F]">
        No products yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Add the first Technology Shop product to make it
        available for management and, when active, visible
        to customers.
      </p>

      <Link
        href="/dashboard/enterprise/tech-solutions/products/new"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0A2852]"
      >
        <Plus className="h-4 w-4" />
        Add Product
      </Link>
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