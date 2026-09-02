import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MessageCircle,
  Store,
  Wrench,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerPage() {
  const supabase = await createClient();

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug,
      description,
      logo_url
    `)
    .eq("active", true)
    .order("name")
    .limit(6);

  if (error) {
    console.error("Customer businesses loading error:", error);
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-[92px]">
      <CustomerNavigation />

      <div className="mx-auto w-full max-w-[720px]">
        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden bg-[#03162F] px-5 pb-12 pt-7 text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl"
          />

          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
              Welcome
            </p>

            <h1 className="mt-3 max-w-[620px] text-[32px] font-black leading-[1.05] tracking-tight sm:text-4xl">
              Everything you need,
              <span className="block text-[#D4AF37]">
                all in one place.
              </span>
            </h1>

            <p className="mt-4 max-w-[580px] text-sm leading-6 text-slate-300 sm:text-base">
              Discover businesses, products, services and
              opportunities across the Alessandro Enterprises
              ecosystem.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/customer/businesses"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#03162F] shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#e3c45a] hover:shadow-xl active:scale-[0.98]"
              >
                Explore Businesses
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>

              <Link
                href="/businesses"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition duration-300 hover:bg-white/10 active:scale-[0.98]"
              >
                Visit Website
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================
            QUICK ACTION CONTAINER
        ===================================================== */}

        <section className="relative z-10 px-4 pt-5">
          <div className="rounded-[22px] border border-slate-200/80 bg-slate-100/90 p-2.5 shadow-sm">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <QuickAction
                href="/customer/businesses"
                icon={<Store />}
                title="Businesses"
                description="Explore businesses"
              />

              <QuickAction
                href="/customer/services"
                icon={<Wrench />}
                title="Services"
                description="Find services"
              />

              <QuickAction
                href="/customer/bookings"
                icon={<CalendarDays />}
                title="Bookings"
                description="Manage bookings"
              />

              <QuickAction
                href="/customer/messages"
                icon={<MessageCircle />}
                title="Messages"
                description="Chat with us"
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            BUSINESS DISCOVERY
        ===================================================== */}

        <section className="px-5 pb-8 pt-9">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Discover
              </p>

              <h2 className="mt-1.5 text-[23px] font-black tracking-tight text-[#03162F]">
                Explore Our Businesses
              </h2>

              <p className="mt-1.5 max-w-[560px] text-xs leading-5 text-slate-500">
                Find products, services and opportunities from
                across our business ecosystem.
              </p>
            </div>

            <Link
              href="/customer/businesses"
              className="hidden shrink-0 text-xs font-bold text-[#03162F] transition hover:text-[#D4AF37] sm:flex sm:items-center"
            >
              View All
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>

          {businesses && businesses.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {businesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/customer/businesses/${business.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    {business.logo_url ? (
                      <img
                        src={business.logo_url}
                        alt={business.name}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-base font-black text-[#D4AF37]">
                        {business.name.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-[#03162F]">
                        {business.name}
                      </h3>

                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {business.description ||
                          "Explore products and services"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold text-[#03162F]">
                      Explore Business
                    </span>

                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-[#D4AF37] transition duration-300 group-hover:bg-[#03162F] group-hover:text-[#D4AF37]">
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="text-sm font-bold text-[#03162F]">
                No businesses available
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Businesses will appear here once they are activated.
              </p>
            </div>
          )}

          <Link
            href="/customer/businesses"
            className="mt-5 flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#03162F] shadow-sm transition hover:border-[#D4AF37] sm:hidden"
          >
            View All Businesses
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-[96px] flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#03162F] text-[#D4AF37] transition duration-300 group-hover:bg-[#D4AF37] group-hover:text-[#03162F]">
        <span className="h-4 w-4 [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
      </div>

      <h3 className="mt-2 text-xs font-bold text-[#03162F]">
        {title}
      </h3>

      <p className="mt-0.5 text-[9px] leading-4 text-slate-500">
        {description}
      </p>
    </Link>
  );
}