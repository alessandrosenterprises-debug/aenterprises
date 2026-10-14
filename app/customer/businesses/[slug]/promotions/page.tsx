import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  Megaphone,
} from "lucide-react";

import BusinessContentFeed from "@/components/customer/BusinessContentFeed";

export default async function SoftLoansPromotionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, description, logo_url, active"
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!business) {
    return (
      <main className="min-h-screen bg-slate-50">


        <div className="mx-auto max-w-xl px-5 py-20 text-center">
          <h1 className="text-2xl font-black text-[#03162F]">
            Business Not Found
          </h1>

          <Link
            href="/customer/businesses"
            className="mt-5 inline-flex rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white"
          >
            Back to Businesses
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-28 text-[#03162F]">


      <section className="overflow-hidden bg-[#03162F] text-white">
        <div className="mx-auto max-w-5xl px-4 pb-8 pt-5 sm:px-6">
          <Link
            href={`/customer/businesses/${slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 transition hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {business.name}
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]">
              <Megaphone className="h-6 w-6" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
                {business.name}
              </p>

              <h1 className="mt-0.5 text-2xl font-black sm:text-3xl">
                Promotions
              </h1>

              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Special offers and announcements from {business.name}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <BusinessContentFeed businesses={[business]} businessId={business.id} kind="promotions" />
      </section>
    </main>
  );
}
