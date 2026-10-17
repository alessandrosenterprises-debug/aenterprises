"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSun,
  Clock3,
  FileText,
  Headphones,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Sparkles,
  Store,
  Sun,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CustomerHomeBusiness } from "./page";
import BusinessContentFeed from "@/components/customer/BusinessContentFeed";

interface CustomerHomeClientProps {
  businesses: CustomerHomeBusiness[];
  contactDetails: {
    companyName: string;
    tagline: string;
    phone: string;
    whatsapp: string;
    email: string;
  };
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
  contactDetails,
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
    <div className="min-h-screen w-full overflow-hidden bg-[#F1F5F9]">
      {/* HERO */}
      <section className="relative w-full overflow-hidden bg-[#03162F] px-3 pb-4 pt-4 text-white sm:px-7 sm:pb-6 sm:pt-6">
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

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(350px,1.1fr)] md:gap-7">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-xl sm:mb-3 sm:px-3 sm:text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>AEOS Customer Experience</span>
            </div>

            <h1 className="max-w-3xl font-serif text-[21px] font-bold leading-[1.15] tracking-tight sm:text-3xl">
              Everything you need,
              <span className="block bg-gradient-to-r from-white via-[#D4AF37] to-amber-200 bg-clip-text text-transparent">
                all in one place.
              </span>
            </h1>

            <p className="mt-2 max-w-2xl text-[11px] leading-[1.45] text-slate-300 sm:text-sm sm:leading-6">
              Discover Alessandro Enterprises businesses, services, products,
              bookings and opportunities through one connected customer
              experience.
            </p>

            <div className="mt-3 grid max-w-xl grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
            <Link
              href="/customer/businesses"
              className="group flex min-h-[38px] items-center justify-center gap-1 rounded-xl bg-[#D4AF37] px-2 py-1.5 text-center text-[10px] font-black text-[#03162F] shadow-[0_8px_20px_rgba(212,175,55,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(212,175,55,0.35)] active:scale-[0.97] sm:min-h-[42px] sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs"
            >
              <Store className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span>Explore Businesses</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/"
              className="group flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-white/20 bg-white/10 px-2 py-1.5 text-center text-[10px] font-black text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:bg-white/15 hover:text-[#D4AF37] active:scale-[0.97] sm:min-h-[42px] sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs"
            >
              <span>Visit Website</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2 md:pt-1 sm:gap-3">
            <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
              <HeroQuickLink href={contactDetails.email ? `mailto:${contactDetails.email}` : "/customer/emails"} label="Emails" icon={<Mail className="h-4 w-4" />} />
              <HeroQuickLink href={contactDetails.phone ? `tel:${contactDetails.phone.replace(/\s+/g, "")}` : "/customer/support"} label="Phone" icon={<Phone className="h-4 w-4" />} />
              <HeroQuickLink href={contactDetails.whatsapp ? `https://wa.me/${contactDetails.whatsapp.replace(/\D/g, "").replace(/^0/, "260")}` : "/customer/support"} label="WhatsApp" icon={<MessageCircle className="h-4 w-4" />} external={Boolean(contactDetails.whatsapp)} />
              <HeroQuickLink href="/customer/requests" label="Requests" icon={<FileText className="h-4 w-4" />} />
              <HeroQuickLink href="/customer/support" label="Support" icon={<Headphones className="h-4 w-4" />} />
            </div>
            <LiveWeatherWidget />
            <div className="mt-4 flex min-h-[40px] items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] text-[#E8CA62] sm:mt-8 sm:min-h-[48px]">
              <div className="customer-hero-marquee flex w-max whitespace-nowrap text-sm font-semibold tracking-wide sm:text-lg">
                {[0, 1].map((copy) => (
                  <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-3 px-4 sm:gap-4 sm:px-5">
                    <span className="font-bold text-[#F2D879]">{contactDetails.companyName}</span>
                    <span aria-hidden="true" className="text-white/60">•</span>
                    <span className="text-white">{contactDetails.tagline}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAGE CONTENT */}
      <div className="mx-auto w-full max-w-[760px] space-y-5 bg-[#F1F5F9] px-3 py-5 sm:space-y-7 sm:px-6 sm:py-6">
        {/* QUICK ACTIONS */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37] sm:text-xs sm:tracking-[0.18em]">
                Quick access
              </p>

              <h2 className="mt-1 text-base font-black text-slate-900 sm:text-xl">
                What would you like to do?
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] sm:rounded-3xl sm:p-4"
                >
                  <div
                    className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${action.tone} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2 sm:mb-4 sm:h-11 sm:w-11 sm:rounded-2xl sm:shadow-lg`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  <p className="text-xs font-black text-slate-900 sm:text-sm">
                    {action.title}
                  </p>

                  <p className="mt-1 pr-3 text-[10px] leading-4 text-slate-500 sm:pr-0 sm:text-xs sm:leading-5">
                    {action.description}
                  </p>

                  <ArrowRight className="absolute bottom-3 right-3 h-3.5 w-3.5 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-slate-600 sm:bottom-4 sm:right-4 sm:h-4 sm:w-4" />

                  <div className="pointer-events-none absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-slate-100 opacity-70 transition-transform duration-500 group-hover:scale-150" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* FEATURED BUSINESSES */}
        <section className="mt-6" aria-labelledby="featured-businesses-title">
          <div className="mb-2.5 flex items-end justify-between gap-3 px-1 sm:mb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                Discover
              </p>

              <h2
                id="featured-businesses-title"
                className="mt-0.5 text-base font-black tracking-tight text-[#03162F] sm:text-lg"
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
            <div className="relative overflow-hidden rounded-3xl border border-[#B8941F]/50 bg-gradient-to-br from-[#D4AF37] via-[#E2C45F] to-[#C49A20] shadow-[0_10px_24px_rgba(212,175,55,0.24)] sm:rounded-[28px] sm:shadow-[0_14px_35px_rgba(212,175,55,0.30)]">
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

              <div className="relative p-3 sm:p-6">
                {/* Featured badge */}
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#03162F]/20 bg-[#03162F] px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] text-[#D4AF37] shadow-sm sm:mb-5 sm:px-3 sm:py-1.5 sm:text-[9px] sm:tracking-[0.14em] sm:shadow-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                  Featured Business
                </div>

                <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1.5 sm:grid-cols-[auto_1fr_auto] sm:gap-5">
                  {/* Business Logo */}
                  <div className="flex justify-center sm:justify-start">
                    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-white/90 bg-white shadow-[0_6px_12px_rgba(3,22,47,0.18)] sm:h-28 sm:w-28 sm:rounded-[24px] sm:border-4 sm:shadow-[0_12px_30px_rgba(3,22,47,0.22)]">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-[#03162F]/10 sm:rounded-[20px]"
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
                  <div className="min-w-0 text-left">
                    <p className="mb-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-[#03162F]/60 sm:mb-1 sm:text-[9px] sm:tracking-[0.15em]">
                      Explore
                    </p>

                    <h3 className="max-w-full truncate text-sm font-black tracking-tight text-[#03162F] sm:text-2xl">
                      {activeFeaturedBusiness.name}
                    </h3>

                    {activeFeaturedBusiness.description && (
                      <p className="mt-0.5 line-clamp-1 max-w-xl text-[9px] font-medium leading-3.5 text-[#03162F]/70 sm:mt-2 sm:line-clamp-2 sm:text-sm sm:leading-relaxed">
                        {activeFeaturedBusiness.description}
                      </p>
                    )}

                    <Link
                      href={`/customer/businesses/${activeFeaturedBusiness.slug}`}
                      className="group mt-1.5 inline-flex min-h-[30px] items-center justify-center gap-1.5 rounded-lg bg-[#03162F] px-2.5 py-1.5 text-[9px] font-black text-white shadow-[0_5px_10px_rgba(3,22,47,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#071F40] hover:shadow-[0_12px_22px_rgba(3,22,47,0.32)] active:scale-[0.97] sm:mt-4 sm:min-h-[42px] sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-[10px] sm:shadow-[0_8px_18px_rgba(3,22,47,0.25)]"
                    >
                      Visit Business
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>

                  {/* Slider Controls */}
                  {featuredBusinesses.length > 1 && (
                    <div className="col-span-2 flex items-center justify-center gap-1.5 sm:col-span-1 sm:flex-col sm:gap-2">
                      <button
                        type="button"
                        onClick={goPrevious}
                        aria-label="Previous featured business"
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#03162F]/15 bg-white/85 text-[#03162F] shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-md active:scale-[0.94] sm:h-10 sm:w-10 sm:rounded-xl"
                      >
                        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={goNext}
                        aria-label="Next featured business"
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#03162F]/15 bg-white/85 text-[#03162F] shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-md active:scale-[0.94] sm:h-10 sm:w-10 sm:rounded-xl"
                      >
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Slide indicators */}
                {featuredBusinesses.length > 1 && (
                  <div className="mt-1 flex justify-center gap-1 sm:mt-5 sm:gap-1.5">
                    {featuredBusinesses.map((business, index) => (
                      <button
                        key={business.id}
                        type="button"
                        onClick={() => setActiveBusiness(index)}
                        aria-label={`Show ${business.name}`}
                        aria-current={
                          index === activeBusiness ? "true" : undefined
                        }
                        className={`h-1 rounded-full transition-all duration-300 sm:h-1.5 ${
                          index === activeBusiness
                            ? "w-4 bg-[#03162F] sm:w-6"
                            : "w-1 bg-[#03162F]/25 hover:bg-[#03162F]/45 sm:w-1.5"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* BUSINESS PROMOTIONS */}
        <section>
          <SectionHeading
            eyebrow="Offers"
            title="Promotions"
            href="/customer/businesses"
            linkLabel="Explore"
          />

          <BusinessContentFeed businesses={businesses} kind="promotions" compact />
        </section>

        {/* BUSINESS GALLERY */}
        <section>
          <SectionHeading
            eyebrow="Discover"
            title="Gallery"
            href="/customer/gallery"
            linkLabel="View all photos"
          />

          <BusinessContentFeed businesses={businesses} kind="gallery" compact />
        </section>

        {/* LATEST UPDATES */}
        <section>
          <SectionHeading
            eyebrow="Stay informed"
            title="Latest Updates"
            href="/customer/businesses"
            linkLabel="Explore"
          />

          <div className="mb-4">
            <BusinessContentFeed businesses={businesses} kind="posts" compact />
          </div>
          <div className="space-y-2.5 sm:space-y-3">
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
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#03162F] via-[#09254A] to-indigo-900 p-4 text-white shadow-xl sm:rounded-[2rem] sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-[#03162F] shadow-md sm:h-12 sm:w-12 sm:rounded-2xl sm:shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-black sm:text-lg">
                One AEOS. Many possibilities.
              </h2>

              <p className="mt-1.5 text-xs leading-5 text-slate-300 sm:mt-2 sm:text-sm sm:leading-6">
                Explore the Alessandro Enterprises ecosystem and manage your
                customer experience from one place.
              </p>

              <Link
                href="/customer/businesses"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#03162F] transition hover:-translate-y-0.5 sm:mt-5 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                Start Exploring
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes customerHeroMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .customer-hero-marquee {
          animation: customerHeroMarquee 22s linear infinite;
          will-change: transform;
        }

        .customer-hero-marquee:hover {
          animation-play-state: paused;
        }

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

        @media (prefers-reduced-motion: reduce) {
          .customer-hero-marquee {
            animation-duration: 22s !important;
            animation-iteration-count: infinite !important;
          }
        }
      `}</style>
    </div>
  );
}

function HeroQuickLink({
  href,
  label,
  icon,
  external = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  const className = "group flex min-w-0 flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/[0.07] px-1 py-1.5 text-[8px] font-semibold text-slate-200 transition hover:border-[#D4AF37]/50 hover:bg-white/15 hover:text-white sm:min-w-[58px] sm:gap-1.5 sm:rounded-xl sm:px-2 sm:py-2 sm:text-[10px]";
  const content = <><span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-[#D4AF37] transition group-hover:bg-[#D4AF37] group-hover:text-[#03162F] sm:h-7 sm:w-7 sm:rounded-lg">{icon}</span><span className="truncate">{label}</span></>;

  return external ? (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={className}>{content}</a>
  ) : (
    <Link href={href} aria-label={label} className={className}>{content}</Link>
  );
}

function LiveWeatherWidget() {
  const [weather, setWeather] = useState<{ temperature: number; code: number; wind: number } | null>(null);

  useEffect(() => {
    let active = true;
    const loadWeather = async () => {
      try {
        const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-15.4167&longitude=28.2833&current=temperature_2m,weather_code,wind_speed_10m&timezone=Africa%2FLusaka", { cache: "no-store" });
        if (!response.ok) throw new Error("Weather unavailable");
        const result = await response.json();
        if (active && result.current) {
          setWeather({ temperature: Math.round(result.current.temperature_2m), code: result.current.weather_code, wind: Math.round(result.current.wind_speed_10m) });
        }
      } catch {
        if (active) setWeather(null);
      }
    };

    void loadWeather();
    const interval = window.setInterval(loadWeather, 15 * 60 * 1000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const code = weather?.code ?? -1;
  const WeatherIcon = code === 0 || code === 1 ? Sun : code === 2 ? CloudSun : code === 45 || code === 48 ? CloudFog : code >= 51 && code <= 82 ? CloudRain : code >= 3 ? Cloud : CloudSun;
  const condition = code === 0 ? "Clear skies" : code === 1 ? "Mostly clear" : code === 2 ? "Partly cloudy" : code === 3 ? "Cloudy" : code === 45 || code === 48 ? "Foggy" : code >= 51 && code <= 67 ? "Light rain" : code >= 71 && code <= 77 ? "Snow" : code >= 80 && code <= 82 ? "Showers" : code >= 95 ? "Thunderstorms" : "Checking Lusaka weather";

  return (
    <div className="flex min-h-[64px] min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.07] px-2.5 py-2 sm:min-h-[76px] sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#E8C84E] sm:h-10 sm:w-10 sm:rounded-xl"><WeatherIcon className="h-4 w-4 sm:h-5 sm:w-5" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-300 sm:text-[9px] sm:tracking-[0.15em]">Live weather · Lusaka</p><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" /></div>
        <p className="mt-0.5 truncate text-xs font-semibold text-white">{condition}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{weather ? `Wind ${weather.wind} km/h` : "Current conditions"}</p>
      </div>
      <p className="shrink-0 font-serif text-xl font-bold text-white sm:text-2xl">{weather ? `${weather.temperature}°` : "--°"}</p>
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
    <div className="mb-2.5 flex items-end justify-between sm:mb-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37] sm:text-xs sm:tracking-[0.18em]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-base font-black text-slate-900 sm:text-xl">{title}</h2>
      </div>

      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#03162F] sm:text-xs"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
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
      className="group flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:gap-4 sm:rounded-3xl sm:p-4"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37] transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-2xl">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-xs font-black text-slate-900 sm:text-sm">{title}</h3>

        <p className="mt-1 text-[10px] leading-4 text-slate-500 sm:text-xs sm:leading-5">{description}</p>
      </div>

      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-slate-600 sm:h-4 sm:w-4" />
    </Link>
  );
}
