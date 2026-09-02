import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      active
    `)
    .eq("active", true)
    .order("name");

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#03162F] px-6 pb-20 pt-12 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
            Alessandro Enterprises
          </p>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Everything you need,
            <span className="block text-[#D4AF37]">
              in one place.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Explore businesses, products, services and opportunities
            across the Alessandro Enterprises ecosystem.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/businesses"
              className="rounded-xl bg-[#D4AF37] px-6 py-3 font-semibold text-[#03162F] transition hover:scale-105"
            >
              Explore Businesses
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-white/20 px-6 py-3 font-semibold transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Businesses */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37]">
              Our Ecosystem
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#03162F]">
              Explore Our Businesses
            </h2>

            <p className="mt-2 text-slate-500">
              Discover products and services across Alessandro Enterprises.
            </p>
          </div>

          <Link
            href="/businesses"
            className="hidden font-semibold text-[#03162F] md:block"
          >
            View All →
          </Link>
        </div>

        {businesses && businesses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href={`/businesses/${business.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#03162F] text-xl font-bold text-[#D4AF37]">
                      {business.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-[#03162F]">
                      {business.name}
                    </h3>

                    {business.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
                        {business.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 font-semibold text-[#03162F]">
                  Explore Business
                  <span className="ml-2 inline-block transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">
              Businesses will appear here soon.
            </p>
          </div>
        )}

        <Link
          href="/businesses"
          className="mt-8 block rounded-xl border border-slate-200 bg-white px-5 py-4 text-center font-semibold text-[#03162F] md:hidden"
        >
          View All Businesses →
        </Link>
      </section>
    </main>
  );
}