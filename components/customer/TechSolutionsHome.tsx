"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Code2,
  Headphones,
  Laptop,
  Monitor,
  Network,
  Package,
  Phone,
  Printer,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { supabase } from "@/lib/supabase/client";

interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  image_url?: string | null;
}

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  item_type: string | null;
  category: string | null;
  base_price: number | null;
  image_url: string | null;
  business_id: string;
}

interface TechnologyCategory {
  id: string;
  name: string;
  description: string;
  icon: typeof Laptop;
  keywords: string[];
  accent: string;
  bg: string;
}

const technologyCategories: TechnologyCategory[] = [
  {
    id: "computers-laptops",
    name: "Computers & Laptops",
    description:
      "Laptops, desktops, upgrades, setup, repairs and business computing.",
    icon: Laptop,
    keywords: ["computer", "laptop", "desktop", "pc"],
    accent: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "phones-tablets",
    name: "Phones & Tablets",
    description:
      "Smartphones, tablets, setup, configuration and support.",
    icon: Smartphone,
    keywords: ["phone", "smartphone", "tablet", "mobile"],
    accent: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    id: "accessories",
    name: "Accessories",
    description:
      "Chargers, cables, keyboards, mice and everyday technology accessories.",
    icon: Package,
    keywords: [
      "accessory",
      "accessories",
      "charger",
      "cable",
      "keyboard",
      "mouse",
    ],
    accent: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    id: "networking",
    name: "Networking",
    description:
      "Routers, Wi-Fi, connectivity, installation and network support.",
    icon: Network,
    keywords: [
      "network",
      "networking",
      "router",
      "switch",
      "wifi",
      "wireless",
      "ethernet",
    ],
    accent: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    id: "software-applications",
    name: "Software & Applications",
    description:
      "Software setup, applications, licensing and configuration.",
    icon: Monitor,
    keywords: ["software", "application", "app", "licensing", "system"],
    accent: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    id: "repairs-maintenance",
    name: "Repairs & Maintenance",
    description:
      "Diagnostics, repairs, maintenance and technology troubleshooting.",
    icon: Wrench,
    keywords: [
      "repair",
      "maintenance",
      "diagnostic",
      "troubleshooting",
      "fix",
    ],
    accent: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    id: "printers-printing",
    name: "Printers & Printing",
    description:
      "Printers, scanners, toner, ink, installation and support.",
    icon: Printer,
    keywords: ["printer", "printing", "scanner", "toner", "ink"],
    accent: "text-slate-600",
    bg: "bg-slate-100",
  },
  {
    id: "cctv-security",
    name: "CCTV & Security",
    description:
      "CCTV, surveillance, monitoring and security technology.",
    icon: ShieldCheck,
    keywords: [
      "cctv",
      "security",
      "camera",
      "surveillance",
      "monitoring",
    ],
    accent: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    id: "data-storage",
    name: "Data & Storage",
    description:
      "Storage, backups, servers, recovery and infrastructure.",
    icon: Server,
    keywords: [
      "data",
      "storage",
      "backup",
      "server",
      "recovery",
      "hard drive",
    ],
    accent: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    id: "it-support",
    name: "IT Support",
    description:
      "Practical IT support for individuals, businesses and organizations.",
    icon: Settings2,
    keywords: ["it", "support", "technical support", "helpdesk"],
    accent: "text-blue-700",
    bg: "bg-blue-50",
  },
  {
    id: "web-digital-solutions",
    name: "Web & Digital Solutions",
    description:
      "Websites, digital systems and modern technology solutions.",
    icon: Code2,
    keywords: ["web", "website", "digital", "development", "online"],
    accent: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
  },
  {
    id: "technology-consultation",
    name: "Technology Consultation",
    description:
      "Technology guidance to help you choose and implement the right solutions.",
    icon: Sparkles,
    keywords: [
      "consultation",
      "consulting",
      "technology",
      "advice",
      "solution",
    ],
    accent: "text-[#b48b00]",
    bg: "bg-[#D4AF37]/10",
  },
];

const quickActions = [
  {
    id: "support",
    label: "IT Support",
    description: "Get technical help",
    icon: Headphones,
    href: "technology/it-support",
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    id: "consultation",
    label: "Consultation",
    description: "Talk to a specialist",
    icon: Sparkles,
    href: "/customer/technology-consultation",
    gradient: "from-violet-600 to-fuchsia-500",
  },
  {
    id: "repairs",
    label: "Repairs",
    description: "Fix your technology",
    icon: Wrench,
    href: "technology/repairs-maintenance",
    gradient: "from-orange-500 to-rose-500",
  },
  {
    id: "shop",
    label: "Technology Shop",
    description: "Browse products",
    icon: Package,
    href: "products",
    gradient: "from-emerald-500 to-teal-500",
  },
];

function matchesCategory(
  item: CatalogItem,
  category: TechnologyCategory
) {
  const categoryText = [
    item.category,
    item.name,
    item.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return category.keywords.some((keyword) =>
    categoryText.includes(keyword.toLowerCase())
  );
}

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(Number(price))) {
    return null;
  }

  return `ZMW ${Number(price).toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function TechSolutionsHome({
  business,
}: {
  business: Business;
}) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      setLoading(true);

      const { data, error } = await supabase
        .from("enterprise_catalog")
        .select(
          "id, name, description, item_type, category, base_price, image_url, business_id"
        )
        .eq("business_id", business.id)
        .ilike("status", "active")
        .order("name");

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          "Unable to load Tech Solutions catalogue:",
          error
        );
        setCatalog([]);
      } else {
        setCatalog((data ?? []) as CatalogItem[]);
      }

      setLoading(false);
    }

    loadCatalog();

    const channel = supabase
      .channel(`tech-solutions-home-${business.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "enterprise_catalog",
          filter: `business_id=eq.${business.id}`,
        },
        () => {
          loadCatalog();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn(
            "Tech Solutions catalogue realtime synchronization is unavailable."
          );
        }
      });

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [business.id]);

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return catalog;
    }

    return catalog.filter((item) =>
      [
        item.name,
        item.description,
        item.category,
        item.item_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [catalog, search]);

  const products = useMemo(
    () =>
      filteredCatalog.filter((item) =>
        item.item_type?.toLowerCase().includes("product")
      ),
    [filteredCatalog]
  );

  const services = useMemo(
    () =>
      filteredCatalog.filter((item) =>
        item.item_type?.toLowerCase().includes("service")
      ),
    [filteredCatalog]
  );

  const featuredProducts = products.slice(0, 4);
  const featuredServices = services.slice(0, 4);

  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f7fb] pb-24 text-[#03162F]">
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-2xl bg-[#03162F] px-5 py-7 text-white shadow-xl sm:px-7 sm:py-8 lg:px-9 lg:py-9">
  {/* Decorative gradients */}
  <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[#D4AF37]/15 blur-3xl" />

  <div className="relative grid items-center gap-7 lg:grid-cols-[1.35fr_0.65fr]">
    {/* Hero content */}
    <div>
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 backdrop-blur">
        <Sparkles className="h-3.5 w-3.5" />
        Alessandro Tech Solutions
      </div>

      <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.7rem]">
        Technology that keeps your business moving.
      </h1>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
        Get reliable IT support, technology products, repairs, networking,
        software solutions and expert consultation — all from one place.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/customer/businesses/${business.slug}/products`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#03162F] transition hover:-translate-y-0.5 hover:bg-[#e6c45a]"
        >
          Explore Technology
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href="/customer/technology-consultation"
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
        >
          Talk to an Expert
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>

    {/* Compact technology panel */}
    <div className="hidden lg:block">
      <div className="relative ml-auto max-w-[280px] rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: "IT Support",
              icon: ShieldCheck,
              className: "bg-cyan-400/15 text-cyan-200",
            },
            {
              label: "Repairs",
              icon: CheckCircle2,
              className: "bg-orange-400/15 text-orange-200",
            },
            {
              label: "Networking",
              icon: BriefcaseBusiness,
              className: "bg-violet-400/15 text-violet-200",
            },
            {
              label: "Consultation",
              icon: Sparkles,
              className: "bg-emerald-400/15 text-emerald-200",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-xl border border-white/5 bg-[#071f3d]/70 p-3 transition duration-300 hover:-translate-y-1"
              >
                <div
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${item.className}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <p className="text-xs font-semibold text-white">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
</section>

        {/* QUICK ACTIONS */}
        <section className="mt-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              const href = action.href.startsWith("/")
                ? action.href
                : `/customer/businesses/${business.slug}/${action.href}`;

              return (
                <Link
                  key={action.id}
                  href={href}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${action.gradient} opacity-10 blur-2xl transition group-hover:opacity-20`}
                  />

                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-lg`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="relative mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-[#03162F]">
                        {action.label}
                      </h3>

                      <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#03162F]" />
                    </div>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* LIVE STATS */}
        <section className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">
              Products
            </p>
            <p className="mt-1 text-2xl font-black text-blue-900">
              {loading ? "..." : products.length}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-violet-500">
              Services
            </p>
            <p className="mt-1 text-2xl font-black text-violet-900">
              {loading ? "..." : services.length}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">
              Categories
            </p>
            <p className="mt-1 text-2xl font-black text-amber-900">
              {technologyCategories.length}
            </p>
          </div>
        </section>

        {/* SERVICES */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                Get things done
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#03162F] sm:text-3xl">
                Technology services
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Practical technology support for your home, business and
                organization.
              </p>
            </div>

            <Link
              href={`/customer/businesses/${business.slug}/services`}
              className="hidden items-center gap-1 text-xs font-black text-[#03162F] sm:flex"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "IT Support",
                text: "Troubleshooting, setup and technical assistance.",
                icon: Headphones,
                href: `/customer/businesses/${business.slug}/technology/it-support`,
                gradient: "from-blue-600 to-cyan-500",
              },
              {
                title: "Consultation",
                text: "Get expert guidance before choosing a solution.",
                icon: Sparkles,
                href: "/customer/technology-consultation",
                gradient: "from-violet-600 to-fuchsia-500",
              },
              {
                title: "Repairs",
                text: "Diagnostics, maintenance and technology repairs.",
                icon: Wrench,
                href: `/customer/businesses/${business.slug}/technology/repairs-maintenance`,
                gradient: "from-orange-500 to-rose-500",
              },
              {
                title: "Digital Solutions",
                text: "Websites, systems and modern digital services.",
                icon: Code2,
                href: `/customer/businesses/${business.slug}/technology/web-digital-solutions`,
                gradient: "from-emerald-500 to-teal-500",
              },
            ].map((service) => {
              const Icon = service.icon;

              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${service.gradient}`}
                  />

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${service.gradient} text-white shadow-lg transition duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-sm font-black text-[#03162F]">
                    {service.title}
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    {service.text}
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-[#03162F]">
                    Get started
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                Technology shop
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#03162F] sm:text-3xl">
                Featured technology
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Products currently available through AEOS.
              </p>
            </div>

            <Link
              href={`/customer/businesses/${business.slug}/products`}
              className="flex items-center gap-1 text-xs font-black text-[#03162F]"
            >
              Shop all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {featuredProducts.map((product) => {
                const price = formatPrice(product.base_price);

                return (
                  <Link
                    key={product.id}
                    href={`/customer/businesses/${business.slug}/products`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37] shadow-xl">
                          <Laptop className="h-7 w-7" />
                        </div>
                      )}

                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#03162F] shadow-sm">
                        Product
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-black text-[#03162F]">
                        {product.name}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">
                        {product.description ||
                          "Technology product available through Alessandro Tech Solutions."}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-[#03162F]">
                          {price || "Contact us"}
                        </span>

                        <span className="rounded-lg bg-[#03162F] p-2 text-white transition group-hover:bg-[#D4AF37] group-hover:text-[#03162F]">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-600">
                {loading
                  ? "Loading available technology..."
                  : "No products are currently available."}
              </p>

              {!loading && (
                <Link
                  href="/customer/technology-consultation"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-xs font-black text-white"
                >
                  Ask about a product
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </section>

        {/* CATEGORIES */}
        <section className="mt-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
              Explore
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#03162F] sm:text-3xl">
              Find what you need
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Explore technology by category.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {technologyCategories.map((category) => {
              const Icon = category.icon;

              const count = catalog.filter((item) =>
                matchesCategory(item, category)
              ).length;

              return (
                <Link
                  key={category.id}
                  href={`/customer/businesses/${business.slug}/technology/${category.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className={`absolute -right-8 -top-8 h-20 w-20 rounded-full ${category.bg} opacity-80 blur-xl transition group-hover:scale-150`}
                  />

                  <div className="relative flex items-start justify-between">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${category.bg} ${category.accent}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#03162F]" />
                  </div>

                  <h3 className="relative mt-4 text-sm font-black text-[#03162F]">
                    {category.name}
                  </h3>

                  <p className="relative mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">
                    {category.description}
                  </p>

                  <div className="relative mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">
                      {loading
                        ? "Loading..."
                        : `${count} item${count === 1 ? "" : "s"}`}
                    </span>

                    <span className="text-[10px] font-black text-[#D4AF37]">
                      Explore
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* FEATURED SERVICES FROM AEOS */}
        {featuredServices.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                  AEOS services
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#03162F]">
                  Available services
                </h2>
              </div>

              <Link
                href={`/customer/businesses/${business.slug}/services`}
                className="flex items-center gap-1 text-xs font-black text-[#03162F]"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featuredServices.map((service) => (
                <Link
                  key={service.id}
                  href={`/customer/businesses/${business.slug}/services`}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                      <Settings2 className="h-5 w-5" />
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#03162F]" />
                  </div>

                  <h3 className="mt-4 text-sm font-black text-[#03162F]">
                    {service.name}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">
                    {service.description ||
                      "Professional technology service from Alessandro Tech Solutions."}
                  </p>

                  {service.base_price !== null && (
                    <p className="mt-3 text-xs font-black text-violet-600">
                      From {formatPrice(service.base_price)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* WHY US */}
        <section className="mt-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#03162F] via-[#0a2850] to-[#101b3d] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_.9fr]">
            <div>
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <BadgeCheck className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                  The Alessandro standard
                </span>
              </div>

              <h2 className="mt-3 max-w-xl text-3xl font-black tracking-tight text-white">
                Technology support that feels simple.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Whether you need a laptop, network setup, repair, security
                system or a complete digital solution, Tech Solutions gives
                you one place to start.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/customer/technology-consultation"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-black text-[#03162F] transition hover:bg-[#e7c85e]"
                >
                  Talk to a specialist
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href={`/customer/businesses/${business.slug}/services`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                >
                  Browse services
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Reliable",
                  text: "Professional technology support",
                },
                {
                  icon: Zap,
                  title: "Connected",
                  text: "Powered by AEOS",
                },
                {
                  icon: Star,
                  title: "Professional",
                  text: "Solutions for business & home",
                },
                {
                  icon: Phone,
                  title: "Accessible",
                  text: "A simple way to get started",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur transition duration-300 hover:bg-white/[0.1]"
                  >
                    <Icon className="h-5 w-5 text-[#D4AF37]" />

                    <h3 className="mt-4 text-sm font-black text-white">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-[11px] leading-5 text-slate-400">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mt-6 rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-r from-[#fffaf0] via-white to-blue-50 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#b48b00]">
                Not sure where to start?
              </p>

              <h3 className="mt-1 text-xl font-black text-[#03162F]">
                Let&apos;s find the right technology solution.
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Tell us what you need and our team can help you choose the
                right service or product.
              </p>
            </div>

            <Link
              href="/customer/technology-consultation"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-xs font-black text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#0b294e]"
            >
              Start a consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}