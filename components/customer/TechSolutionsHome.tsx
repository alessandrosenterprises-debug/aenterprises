
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Code2,
  Laptop,
  Monitor,
  Network,
  Package,
  Printer,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
  X,
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
}

const technologyCategories: TechnologyCategory[] = [
  {
    id: "computers-laptops",
    name: "Computers & Laptops",
    description:
      "Laptops, desktops, upgrades, setup, repairs and business computing.",
    icon: Laptop,
    keywords: ["computer", "laptop", "desktop", "pc"],
  },
  {
    id: "phones-tablets",
    name: "Phones & Tablets",
    description:
      "Smartphones, tablets, setup, configuration and support.",
    icon: Smartphone,
    keywords: ["phone", "smartphone", "tablet", "mobile"],
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
  },
  {
    id: "software-applications",
    name: "Software & Applications",
    description:
      "Software setup, applications, licensing and configuration.",
    icon: Monitor,
    keywords: ["software", "application", "app", "licensing", "system"],
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
  },
  {
    id: "printers-printing",
    name: "Printers & Printing",
    description:
      "Printers, scanners, toner, ink, installation and support.",
    icon: Printer,
    keywords: ["printer", "printing", "scanner", "toner", "ink"],
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
  },
  {
    id: "it-support",
    name: "IT Support",
    description:
      "Practical IT support for individuals, businesses and organizations.",
    icon: Settings2,
    keywords: ["it", "support", "technical support", "helpdesk"],
  },
  {
    id: "web-digital-solutions",
    name: "Web & Digital Solutions",
    description:
      "Websites, digital systems and modern technology solutions.",
    icon: Code2,
    keywords: ["web", "website", "digital", "development", "online"],
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
  },
];

const quickLinks = [
  {
    id: "computers-laptops",
    label: "Computers",
    icon: Laptop,
  },
  {
    id: "networking",
    label: "Networking",
    icon: Network,
  },
  {
    id: "it-support",
    label: "IT Support",
    icon: ShieldCheck,
  },
  {
    id: "technology-consultation",
    label: "Consultation",
    icon: Sparkles,
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

export default function TechSolutionsHome({
  business,
}: {
  business: Business;
}) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /*
   * AEOS is the source of truth.
   *
   * The customer app reads active enterprise_catalog records
   * belonging to Alessandro Tech Solutions.
   */
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

    /*
     * Keep the customer-facing Tech Solutions home synchronized
     * with AEOS whenever catalogue records change.
     */
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

  const productsCount = filteredCatalog.filter((item) =>
    item.item_type?.toLowerCase().includes("product")
  ).length;

  const servicesCount = filteredCatalog.filter((item) =>
    item.item_type?.toLowerCase().includes("service")
  ).length;

  return (
    <div className="min-h-screen bg-[#f6f8fc] pb-24 text-[#03162F]">
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-[#17345c] bg-[#03162F] shadow-lg">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#D4AF37]/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative p-5 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
              <BadgeCheck className="h-4 w-4" />
              Alessandro Tech Solutions
            </div>

            <div className="mt-5 max-w-3xl">
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Technology that works for you.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Explore computers, networking, security, software,
                digital solutions, professional services and more.
                Everything is connected to the Alessandro Enterprise
                operating system.
              </p>
            </div>

            {/* Search */}
            <div className="mt-6 max-w-2xl">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm transition focus-within:border-[#D4AF37]/60 focus-within:bg-white/[0.13]">
                <Search className="h-5 w-5 shrink-0 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search technology..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Compact stats */}
            <div className="mt-5 flex flex-wrap gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Products
                </span>
                <span className="ml-2 text-sm font-black text-white">
                  {loading ? "..." : productsCount}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Services
                </span>
                <span className="ml-2 text-sm font-black text-white">
                  {loading ? "..." : servicesCount}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Categories
                </span>
                <span className="ml-2 text-sm font-black text-white">
                  {technologyCategories.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick access */}
        <section className="mt-5">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={`/customer/businesses/${business.slug}/technology/${item.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:shadow-md"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#03162F] to-[#17345c] text-[#D4AF37]">
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="truncate text-xs font-black text-[#03162F]">
                      {item.label}
                    </span>
                  </span>

                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#03162F]" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Categories */}
        <section className="pt-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                Explore technology
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#03162F]">
                What do you need?
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Choose a category to open its dedicated technology
                page.
              </p>
            </div>

            <span className="hidden shrink-0 text-xs font-semibold text-slate-400 sm:block">
              {technologyCategories.length} categories
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {technologyCategories.map((category) => {
              const Icon = category.icon;

              const count = catalog.filter((item) =>
                matchesCategory(item, category)
              ).length;

              return (
                <Link
                  key={category.id}
                  href={`/customer/businesses/${business.slug}/technology/${category.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#D4AF37]/60 hover:shadow-lg"
                >
                  <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#D4AF37]/5 blur-2xl transition group-hover:bg-[#D4AF37]/15" />

                  <div className="relative flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#03162F] to-[#21466f] text-[#D4AF37] shadow-sm transition-transform duration-200 group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </span>

                    <ChevronRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#03162F]" />
                  </div>

                  <h3 className="relative mt-3 text-sm font-black leading-5 text-[#03162F]">
                    {category.name}
                  </h3>

                  <p className="relative mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">
                    {category.description}
                  </p>

                  <div className="relative mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400">
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

        {/* Dedicated areas */}
        <section className="pt-8">
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
              Alessandro Tech Solutions
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#03162F]">
              Shop & Book
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Products and services live on their own dedicated
              pages and stay synchronized with AEOS.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={`/customer/businesses/${business.slug}/products`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:shadow-md"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition group-hover:bg-blue-500/20" />

              <div className="relative flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#03162F] to-[#17345c] text-[#D4AF37]">
                  <Package className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-[#03162F]">
                    Products
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Browse technology products available through AEOS.
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#03162F]" />
              </div>
            </Link>

            <Link
              href={`/customer/businesses/${business.slug}/services`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:shadow-md"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#D4AF37]/10 blur-2xl transition group-hover:bg-[#D4AF37]/20" />

              <div className="relative flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#03162F] to-[#17345c] text-[#D4AF37]">
                  <Wrench className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-[#03162F]">
                    Services
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Browse services from AEOS and book the one you need.
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#03162F]" />
              </div>
            </Link>
          </div>
        </section>

        {/* Trust strip */}
        <section className="pt-8">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#03162F] via-[#0b2342] to-[#03162F] p-5 shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <CheckCircle2 className="h-4 w-4" />

                  <span className="text-[10px] font-black uppercase tracking-[0.16em]">
                    Alessandro standard
                  </span>
                </div>

                <h3 className="mt-1 text-lg font-black text-white">
                  Professional technology. One connected experience.
                </h3>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">
                  Catalogue information comes from AEOS so customers
                  see the same active products and services managed by
                  Alessandro Enterprises.
                </p>
              </div>

              <Link
                href={`/customer/businesses/${business.slug}/services`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-black text-[#03162F] transition hover:bg-[#e3c35c]"
              >
                Explore Services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
