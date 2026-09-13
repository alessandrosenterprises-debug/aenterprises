import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Save,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Business {
  id: string;
  name: string;
  slug: string;
}

async function createProduct(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const basePriceRaw = String(formData.get("base_price") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (!name) {
    redirect(
      "/dashboard/enterprise/tech-solutions/products/new?error=Product%20name%20is%20required"
    );
  }

  let basePrice: number | null = null;

  if (basePriceRaw) {
    const parsedPrice = Number(basePriceRaw);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      redirect(
        "/dashboard/enterprise/tech-solutions/products/new?error=Please%20enter%20a%20valid%20price"
      );
    }

    basePrice = parsedPrice;
  }

  let quantity: number | null = null;

  if (quantityRaw) {
    const parsedQuantity = Number(quantityRaw);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity < 0 ||
      !Number.isInteger(parsedQuantity)
    ) {
      redirect(
        "/dashboard/enterprise/tech-solutions/products/new?error=Please%20enter%20a%20valid%20quantity"
      );
    }

    quantity = parsedQuantity;
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .ilike("name", "%Tech Solutions%")
    .eq("active", true)
    .maybeSingle();

  if (businessError) {
    console.error(
      "AEOS Tech Solutions create product business error:",
      JSON.stringify(businessError, null, 2)
    );

    redirect(
      "/dashboard/enterprise/tech-solutions/products/new?error=Unable%20to%20load%20Tech%20Solutions%20business"
    );
  }

  if (!business) {
    redirect(
      "/dashboard/enterprise/tech-solutions/products/new?error=Tech%20Solutions%20business%20was%20not%20found"
    );
  }

  const businessRecord = business as Business;

  const { data: product, error: productError } = await supabase
    .from("enterprise_catalog")
    .insert({
      business_id: businessRecord.id,
      item_type: "product",
      category: category || null,
      name,
      description: description || null,
      base_price: basePrice,
      quantity,
      status: status || "active",
      image_url: imageUrl || null,
      attributes: {},
    })
    .select("id")
    .single();

  if (productError) {
    console.error(
      "AEOS Tech Solutions create product error:",
      JSON.stringify(productError, null, 2)
    );

    redirect(
      `/dashboard/enterprise/tech-solutions/products/new?error=${encodeURIComponent(
        productError.message
      )}`
    );
  }

  redirect(
    `/dashboard/enterprise/tech-solutions/products/${product.id}`
  );
}

export default async function NewTechSolutionsProductPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/enterprise/tech-solutions/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#03162F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Technology Shop
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            AEOS • Tech Solutions
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#03162F]">
            Add Product
          </h1>

          <p className="mt-2 max-w-3xl text-slate-500">
            Add a product to Alessandro Tech Solutions and make it
            available in the Technology Shop.
          </p>
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Form */}
      <form action={createProduct} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#03162F] text-white">
                <Package className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black text-[#03162F]">
                  Product Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the basic information for this Technology
                  Shop product.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-bold text-[#03162F]"
              >
                Product Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Wireless Keyboard"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
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
                placeholder="e.g. Accessories"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-bold text-[#03162F]"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue="active"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label
                htmlFor="base_price"
                className="mb-2 block text-sm font-bold text-[#03162F]"
              >
                Price
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  ZMW
                </span>

                <input
                  id="base_price"
                  name="base_price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-16 pr-4 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Leave empty if the price has not been set.
              </p>
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="mb-2 block text-sm font-bold text-[#03162F]"
              >
                Quantity
              </label>

              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 25"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />

              <p className="mt-2 text-xs text-slate-400">
                Enter the available stock quantity.
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
                placeholder="Describe the product, its features, specifications, or other useful information."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <label
                htmlFor="image_url"
                className="mb-2 block text-sm font-bold text-[#03162F]"
              >
                Product Image URL
              </label>

              <input
                id="image_url"
                name="image_url"
                type="url"
                placeholder="https://example.com/product-image.jpg"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />

              <p className="mt-2 text-xs text-slate-400">
                Optional. You can add or upload an image later from
                the product edit page.
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/enterprise/tech-solutions/products"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:text-[#03162F]"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0A2852]"
          >
            <Save className="h-4 w-4" />
            Create Product
          </button>
        </div>
      </form>
    </div>
  );
}