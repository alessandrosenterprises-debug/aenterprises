import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  CalendarDays,
  Megaphone,
  Sparkles,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";

type Promotion = {
  id: string;
  business_id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  content?: string | null;
  image_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  active?: boolean | null;
  status?: string | null;
  created_at?: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-ZM", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
        <CustomerNavigation />

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

  const { data, error } = await supabase
    .from("business_promotions")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Soft Loans promotions loading error:",
      error
    );
  }

  const promotions = (data ?? []) as Promotion[];

  return (
    <main className="min-h-screen bg-slate-50 pb-28 text-[#03162F]">
      <CustomerNavigation />

      <section className="overflow-hidden bg-[#03162F] text-white">
        <div className="mx-auto max-w-5xl px-4 pb-8 pt-5 sm:px-6">
          <Link
            href={`/customer/businesses/${slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 transition hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Soft Loans
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]">
              <Megaphone className="h-6 w-6" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
                Alessandro Soft Loans
              </p>

              <h1 className="mt-0.5 text-2xl font-black sm:text-3xl">
                Promotions
              </h1>

              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Special offers and announcements from Soft
                Loans.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {promotions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {promotions.map((promotion) => {
              const title =
                promotion.title ??
                promotion.name ??
                "Special Promotion";

              const description =
                promotion.description ??
                promotion.content ??
                "";

              const startDate = formatDate(
                promotion.start_date
              );

              const endDate = formatDate(
                promotion.end_date
              );

              return (
                <article
                  key={promotion.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {promotion.image_url ? (
                    <div className="h-48 overflow-hidden bg-slate-100">
                      <img
                        src={promotion.image_url}
                        alt={title}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-[#03162F]">
                      <Sparkles className="h-10 w-10 text-[#D4AF37]" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                          Special Offer
                        </p>

                        <h2 className="mt-1 text-xl font-black">
                          {title}
                        </h2>
                      </div>

                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        Active
                      </span>
                    </div>

                    {description && (
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {description}
                      </p>
                    )}

                    {(startDate || endDate) && (
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
                        <CalendarDays className="h-4 w-4 text-[#D4AF37]" />

                        <span>
                          {startDate && `From ${startDate}`}
                          {startDate && endDate && " • "}
                          {endDate && `Until ${endDate}`}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#03162F]/5">
              <Megaphone className="h-7 w-7 text-[#03162F]/40" />
            </div>

            <h2 className="mt-4 text-lg font-black">
              No promotions right now
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">
              Check back later for new offers from
              Alessandro Soft Loans.
            </p>

            <Link
              href={`/customer/businesses/${slug}`}
              className="mt-5 inline-flex rounded-xl bg-[#03162F] px-5 py-3 text-xs font-black text-white"
            >
              Back to Soft Loans
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}