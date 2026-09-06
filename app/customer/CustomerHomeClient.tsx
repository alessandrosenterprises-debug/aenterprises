"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MessageCircle,
  Package,
  Sparkles,
  Store,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CustomerHomeBusiness } from "./page";

interface CustomerHomeClientProps {
  businesses: CustomerHomeBusiness[];
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

export default function CustomerHomeClient({
  businesses,
}: CustomerHomeClientProps) {
  const [activeBusiness, setActiveBusiness] = useState(0);

  const featuredBusinesses = useMemo(
    () => businesses.slice(0, Math.min(businesses.length, 6)),
    [businesses]
  );

  useEffect(() => {
    if (featuredBusinesses.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveBusiness((current) =>
        current >= featuredBusinesses.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => window.clearInterval(interval);
  }, [featuredBusinesses.length]);

  const quickActions: QuickAction[] = [
    {
      title: "Businesses",
      description: "Explore AE businesses",
      href: "/customer/businesses",
      icon: Store,
      tone: "from-blue-600 to-indigo-600",
    },
    {
      title: "Services",
      description: "Find what you need",
      href: "/customer/services",
      icon: Wrench,
      tone: "from-emerald-500 to-teal-600",
    },
    {
      title: "Bookings",
      description: "Manage appointments",
      href: "/customer/bookings",
      icon: CalendarDays,
      tone: "from-amber-500 to-orange-600",
    },
    {
      title: "Messages",
      description: "Talk to AEOS",
      href: "/customer/messages",
      icon: MessageCircle,
      tone: "from-violet-500 to-purple-700",
    },
  ];

  const activeFeaturedBusiness =
    featuredBusinesses[activeBusiness] ?? featuredBusinesses[0] ?? null;

  const goPrevious = () => {
    if (!featuredBusinesses.length) {
      return;
    }

    setActiveBusiness((current) =>
      current <= 0 ? featuredBusinesses.length - 1 : current - 1
    );
  };

  const goNext = () => {
    if (!featuredBusinesses.length) {
      return;
    }

    setActiveBusiness((current) =>
      current >= featuredBusinesses.length - 1 ? 0 : current + 1
    );
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-[760px] overflow-hidden bg-[#F1F5F9]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#03162F] px-5 pb-8 pt-8 text-white sm:px-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#D4AF37]/20 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl"
        />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>AEOS Customer Experience</span>
          </div>

          <h1 className="max-w-xl text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl">
            Everything you need,
            <span className="block bg-gradient-to-r from-white via-[#D4AF37] to-amber-200 bg-clip-text text-transparent">
              all in one place.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Discover Alessandro Enterprises businesses, services, products,
            bookings and opportunities through one connected customer
            experience.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
            <Link
              href="/customer/businesses"
              className="group flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-[#D4AF37] px-3 py-2.5 text-center text-[11px] font-black text-[#03162F] shadow-[0_8px_20px_rgba(212,175,55,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(212,175,55,0.35)] active:scale-[0.97] sm:text-xs"
            >
              <Store className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span>Explore Businesses</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/"
              className="group flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 text-center text-[11px] font-black text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:bg-white/15 hover:text-[#D4AF37] active:scale-[0.97] sm:text-xs"
            >
              <span>Visit Website</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* PAGE CONTENT */}
      <div className="space-y-7 bg-[#F1F5F9] px-4 py-6 sm:px-6">
        {/* QUICK ACTIONS */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                Quick access
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                What would you like to do?
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${action.tone} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <p className="text-sm font-black text-slate-900">
                    {action.title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {action.description}
                  </p>

                  <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-slate-600" />

                  <div className="pointer-events-none absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-slate-100 opacity-70 transition-transform duration-500 group-hover:scale-150" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* FEATURED BUSINESSES */}
        <section className="mt-6" aria-labelledby="featured-businesses-title">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                Discover
              </p>

              <h2
                id="featured-businesses-title"
                className="mt-0.5 text-lg font-black tracking-tight text-[#03162F]"
              >
                Featured Businesses
              </h2>
            </div>

            <Link
              href="/customer/businesses"
              className="text-[10px] font-black text-[#03162F] transition-colors hover:text-[#D4AF37]"
            >
              View All
            </Link>
          </div>

          {!activeFeaturedBusiness ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Store className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-black text-slate-700">
                No featured businesses yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Active businesses will appear here.
              </p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[28px] border border-[#B8941F]/50 bg-gradient-to-br from-[#D4AF37] via-[#E2C45F] to-[#C49A20] shadow-[0_14px_35px_rgba(212,175,55,0.30)]">
              {/* Premium background glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/25 blur-3xl"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-[#03162F]/15 blur-3xl"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-1/3 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/10 blur-2xl"
              />

              <div className="relative p-5 sm:p-6">
                {/* Featured badge */}
                <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#03162F]/20 bg-[#03162F] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#D4AF37] shadow-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                  Featured Business
                </div>

                <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr_auto]">
                  {/* Business Logo */}
                  <div className="flex justify-center sm:justify-start">
                    <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[24px] border-4 border-white/90 bg-white shadow-[0_12px_30px_rgba(3,22,47,0.22)] sm:h-28 sm:w-28">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-[#03162F]/10"
                      />

                      {activeFeaturedBusiness.logo_url ? (
                        <img
                          src={activeFeaturedBusiness.logo_url}
                          alt={`${activeFeaturedBusiness.name} logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Store className="h-10 w-10 text-[#03162F]" />
                      )}
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="min-w-0 text-center sm:text-left">
                    <p className="mb-1 text-[9px] font-black uppercase tracking-[0.15em] text-[#03162F]/60">
                      Explore
                    </p>

                    <h3 className="truncate text-xl font-black tracking-tight text-[#03162F] sm:text-2xl">
                      {activeFeaturedBusiness.name}
                    </h3>

                    {activeFeaturedBusiness.description && (
                      <p className="mt-2 line-clamp-2 max-w-xl text-xs font-medium leading-relaxed text-[#03162F]/70 sm:text-sm">
                        {activeFeaturedBusiness.description}
                      </p>
                    )}

                    <Link
                      href={`/customer/businesses/${activeFeaturedBusiness.slug}`}
                      className="group mt-4 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-[10px] font-black text-white shadow-[0_8px_18px_rgba(3,22,47,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#071F40] hover:shadow-[0_12px_22px_rgba(3,22,47,0.32)] active:scale-[0.97]"
                    >
                      Visit Business
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>

                  {/* Slider Controls */}
                  {featuredBusinesses.length > 1 && (
                    <div className="flex items-center justify-center gap-2 sm:flex-col">
                      <button
                        type="button"
                        onClick={goPrevious}
                        aria-label="Previous featured business"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#03162F]/15 bg-white/85 text-[#03162F] shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-md active:scale-[0.94]"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={goNext}
                        aria-label="Next featured business"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#03162F]/15 bg-white/85 text-[#03162F] shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-md active:scale-[0.94]"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Slide indicators */}
                {featuredBusinesses.length > 1 && (
                  <div className="mt-5 flex justify-center gap-1.5">
                    {featuredBusinesses.map((business, index) => (
                      <button
                        key={business.id}
                        type="button"
                        onClick={() => setActiveBusiness(index)}
                        aria-label={`Show ${business.name}`}
                        aria-current={
                          index === activeBusiness ? "true" : undefined
                        }
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          index === activeBusiness
                            ? "w-6 bg-[#03162F]"
                            : "w-1.5 bg-[#03162F]/25 hover:bg-[#03162F]/45"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* PROMOTIONS PLACEHOLDER */}
        <section>
          <SectionHeading
            eyebrow="Offers"
            title="Promotions"
            href="/customer/businesses"
            linkLabel="Explore"
          />

          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#D4AF37]/10 blur-2xl" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-500 text-[#03162F] shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>

              <h3 className="mt-5 text-lg font-black text-slate-900">
                Promotions will appear here
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Once AEOS promotions are connected, active offers from your
                businesses will automatically become swipeable promotional
                slides here.
              </p>
            </div>
          </div>
        </section>

        {/* GALLERY PLACEHOLDER */}
        <section>
          <SectionHeading
            eyebrow="Discover"
            title="Gallery"
            href="/customer/businesses"
            linkLabel="View businesses"
          />

          <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-[2rem]">
            <GalleryPlaceholder className="h-36 sm:h-44" />
            <GalleryPlaceholder className="h-36 sm:h-44" />
            <GalleryPlaceholder className="h-36 sm:h-44" />
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-900">
              Business gallery coming from AEOS
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              This area is ready for real business images, posts and visual
              updates once the existing gallery source is connected.
            </p>
          </div>
        </section>

        {/* LATEST UPDATES */}
        <section>
          <SectionHeading
            eyebrow="Stay informed"
            title="Latest Updates"
            href="/customer/businesses"
            linkLabel="Explore"
          />

          <div className="space-y-3">
            <UpdatePreview
              icon={<Clock3 className="h-5 w-5" />}
              title="Your latest activity"
              description="Bookings, loan applications and other customer activity are available from your account."
              href="/customer/activity"
            />

            <UpdatePreview
              icon={<BriefcaseBusiness className="h-5 w-5" />}
              title="Discover AE businesses"
              description="Explore businesses and find services, products and opportunities that match your needs."
              href="/customer/businesses"
            />

            <UpdatePreview
              icon={<Package className="h-5 w-5" />}
              title="Your services and orders"
              description="Keep track of the services and orders associated with your customer account."
              href="/customer/services"
            />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#03162F] via-[#09254A] to-indigo-900 p-6 text-white shadow-xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F] shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black">
                One AEOS. Many possibilities.
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Explore the Alessandro Enterprises ecosystem and manage your
                customer experience from one place.
              </p>

              <Link
                href="/customer/businesses"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#03162F] transition hover:-translate-y-0.5"
              >
                Start Exploring
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-xl font-black text-slate-900">{title}</h2>
      </div>

      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-bold text-[#03162F]"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function GalleryPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-slate-200 via-slate-100 to-white ${
        className ?? ""
      }`}
    >
      <div className="absolute inset-0 opacity-50">
        <div className="absolute -left-6 top-4 h-20 w-20 rounded-full bg-blue-300/30 blur-xl" />
        <div className="absolute -right-5 bottom-2 h-24 w-24 rounded-full bg-[#D4AF37]/20 blur-xl" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-slate-300" />
      </div>
    </div>
  );
}

function UpdatePreview({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37] transition-transform duration-300 group-hover:scale-105">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>

      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-slate-600" />
    </Link>
  );
}