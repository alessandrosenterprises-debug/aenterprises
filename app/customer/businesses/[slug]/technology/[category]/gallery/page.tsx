import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BusinessContentFeed from "@/components/customer/BusinessContentFeed";
import { technologyCategoryCapabilities } from "@/modules/catalog/utils/technology-category";

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

export default async function TechnologyGalleryPage({
  params,
}: PageProps) {
  const { slug, category } = await params;

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, description, logo_url, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!business) {
    redirect("/customer/businesses");
  }

  const categoryName =
    categoryNames[category] ?? category.replaceAll("-", " ");
  if (!technologyCategoryCapabilities[category]?.gallery) {
    redirect(`/customer/businesses/${slug}/technology/${category}`);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-[#03162F]">
      <CustomerNavigation />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href={`/customer/businesses/${slug}/technology/${category}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#03162F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {categoryName}
        </Link>

        <section className="overflow-hidden rounded-3xl bg-[#03162F]">
          <div className="relative p-6 sm:p-8">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#D4AF37]/20 blur-3xl" />

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
                <Sparkles className="h-4 w-4" />
                Our Work
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]">
                  <ImageIcon className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-3xl font-black text-white">
                    {business.name} Gallery
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Browse published project images and work shared by
                    {" "}{business.name}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
            Our work
          </p>

          <h2 className="mt-1 text-2xl font-black">
            {categoryName}
          </h2>

          <p className="mt-1 mb-6 text-sm text-slate-500">Published gallery images from {business.name}.</p>
          <BusinessContentFeed businesses={[business]} businessId={business.id} kind="gallery" />
        </section>
      </main>
    </div>
  );
}
