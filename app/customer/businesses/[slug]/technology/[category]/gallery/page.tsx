import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
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

  /*
   * Gallery content is intentionally kept independent from Products
   * and Services. When AEOS gallery/media records are connected,
   * this page can display them without changing the route structure.
   */

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
                    {categoryName} Gallery
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Explore work, projects and technology solutions from
                    Alessandro Tech Solutions.
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

          <p className="mt-1 text-sm text-slate-500">
            Projects and technology work will appear here as they are
            published through AEOS.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="group aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 transition duration-300 group-hover:from-[#03162F]/5 group-hover:to-[#D4AF37]/10">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-7 w-7 text-slate-300 transition group-hover:text-[#D4AF37]" />

                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      AEOS Gallery
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}