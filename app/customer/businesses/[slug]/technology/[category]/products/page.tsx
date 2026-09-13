import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  ShoppingCart,
  Sparkles,
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

export default async function TechnologyProductsPage({
  params,
}: PageProps) {
  const { slug, category } = await params;

  const supabase = await createClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug, description, logo_url, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (businessError) {
    console.error("Products business error:", businessError);
  }

  if (!business) {
    redirect("/customer/businesses");
  }

  const categoryName =
    categoryNames[category] ?? category.replaceAll("-", " ");

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      `
        id,
        business_id,
        name,
        description,
        price,
        status,
        image_url,
        category
      `,
    )
    .eq("business_id", business.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Technology products loading error:", productsError);
  }

  const keywords = category
    .split("-")
    .map((word) => word.toLowerCase());

  const filteredProducts =
    products?.filter((product) => {
      const searchable = [
        product.name,
        product.description,
        product.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        category === "accessories" ||
        keywords.some((keyword) => searchable.includes(keyword))
      );
    }) ?? [];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-[#03162F]">
      <CustomerNavigation />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href={`/customer/businesses/${slug}/technology/${category}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#03162F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {categoryName}
        </Link>

        <section className="overflow-hidden rounded-3xl bg-[#03162F] shadow-sm">
          <div className="relative p-6 sm:p-8">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#D4AF37]/20 blur-3xl" />

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
                <Package className="h-4 w-4" />
                {business.name}
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]">
                  <Package className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white">
                    {categoryName} Products
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Browse available technology products from Alessandro Tech
                    Solutions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
              Available products
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {categoryName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredProducts.length} product
              {filteredProducts.length === 1 ? "" : "s"} available
            </p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-slate-300" />
                    )}

                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-[#03162F] shadow-sm">
                      Available
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-black text-[#03162F]">
                        {product.name}
                      </h3>

                      <Sparkles className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                    </div>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {product.description ||
                        "Quality technology product from Alessandro Tech Solutions."}
                    </p>

                    {product.price !== null && (
                      <p className="mt-4 text-lg font-black text-[#03162F]">
                        ZMW {Number(product.price).toLocaleString()}
                      </p>
                    )}

                    <Link
                      href={`/customer/orders/new?itemId=${product.id}`}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#10294a]"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Order Product
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No products available yet"
              description={`There are currently no active ${categoryName.toLowerCase()} products available.`}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#03162F]/5">
        <Package className="h-6 w-6 text-[#03162F]" />
      </div>

      <h3 className="mt-4 font-black text-[#03162F]">{title}</h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}