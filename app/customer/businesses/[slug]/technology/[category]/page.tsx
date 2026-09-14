import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  Laptop,
  Monitor,
  Network,
  Package,
  Printer,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
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

interface CategoryDefinition {
  name: string;
  description: string;
  icon: typeof Laptop;
  keywords: string[];
}

const technologyCategories: Record<string, CategoryDefinition> = {
  "computers-laptops": {
    name: "Computers & Laptops",
    description:
      "Reliable computers, laptops, upgrades, setup, repairs and technical support for home and business.",
    icon: Laptop,
    keywords: ["computer", "laptop", "desktop", "pc"],
  },

  "phones-tablets": {
    name: "Phones & Tablets",
    description:
      "Smartphones, tablets, accessories, setup, configuration and technical assistance.",
    icon: Smartphone,
    keywords: ["phone", "smartphone", "tablet", "mobile"],
  },

  accessories: {
    name: "Accessories",
    description:
      "Essential technology accessories for computers, phones, networking and everyday digital use.",
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

  networking: {
    name: "Networking",
    description:
      "Professional networking solutions including installation, configuration, connectivity and support.",
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

  "software-applications": {
    name: "Software & Applications",
    description:
      "Software solutions, application setup, configuration, licensing and technical assistance.",
    icon: Monitor,
    keywords: ["software", "application", "app", "licensing", "system"],
  },

  "repairs-maintenance": {
    name: "Repairs & Maintenance",
    description:
      "Professional technology repairs, diagnostics, maintenance and troubleshooting.",
    icon: Wrench,
    keywords: [
      "repair",
      "maintenance",
      "diagnostic",
      "troubleshooting",
      "fix",
    ],
  },

  "printers-printing": {
    name: "Printers & Printing",
    description:
      "Printers, printing equipment, installation, configuration and ongoing support.",
    icon: Printer,
    keywords: ["printer", "printing", "scanner", "toner", "ink"],
  },

  "cctv-security": {
    name: "CCTV & Security",
    description:
      "Security technology solutions including CCTV installation, monitoring and maintenance.",
    icon: ShieldCheck,
    keywords: ["cctv", "security", "camera", "surveillance", "monitoring"],
  },

  "data-storage": {
    name: "Data & Storage",
    description:
      "Data storage, backup, recovery and infrastructure solutions for personal and business use.",
    icon: Server,
    keywords: ["data", "storage", "backup", "server", "recovery", "hard drive"],
  },

  "it-support": {
    name: "IT Support",
    description:
      "Practical IT support for businesses, organizations and individuals.",
    icon: ShieldCheck,
    keywords: ["it", "support", "technical support", "helpdesk", "maintenance"],
  },

  "web-digital-solutions": {
    name: "Web & Digital Solutions",
    description:
      "Websites, digital systems and technology solutions designed for modern businesses.",
    icon: Monitor,
    keywords: ["web", "website", "digital", "development", "online"],
  },

  "technology-consultation": {
    name: "Technology Consultation",
    description:
      "Technology guidance to help you choose, implement and improve the right solutions.",
    icon: Sparkles,
    keywords: ["consultation", "consulting", "technology", "advice", "solution"],
  },
};

function getCategoryRoute(slug: string, category: string) {
  switch (category) {
    case "it-support":
      return `/customer/businesses/${slug}/technology/${category}/support`;

    case "technology-consultation":
      return `/customer/technology-consultation`;

    case "repairs-maintenance":
      return `/customer/businesses/${slug}/technology/${category}/repair`;

    case "accessories":
      return `/customer/businesses/${slug}/technology/${category}/products`;

    default:
      return null;
  }
}

export default async function TechnologyCategoryPage({
  params,
}: PageProps) {
  const { slug, category } = await params;

  const supabase = await createClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      `
        id,
        name,
        slug,
        description,
        logo_url,
        active
      `
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (businessError) {
    console.error(
      "Technology category business loading error:",
      businessError
    );
  }

  if (!business) {
    redirect("/customer/businesses");
  }

  const categoryDefinition = technologyCategories[category];

if (!categoryDefinition) {
  redirect(`/customer/businesses/${slug}`);
}

const specialCategoryRoute = getCategoryRoute(slug, category);

if (specialCategoryRoute) {
  redirect(specialCategoryRoute);
}

  const Icon = categoryDefinition.icon;

  /*
   * These are intentionally separate pages.
   *
   * Products:
   * /technology/[category]/products
   *
   * Services:
   * /technology/[category]/services
   *
   * Gallery:
   * /technology/[category]/gallery
   */
  const basePath = `/customer/businesses/${slug}/technology/${category}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-[#03162F]">
      <CustomerNavigation />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {/* Back */}
        <div className="mb-5">
          <Link
            href={basePath.replace(`/technology/${category}`, "")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#03162F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {business.name}
          </Link>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#03162F] via-[#092544] to-[#0d3550] shadow-lg">
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#D4AF37]/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative p-5 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
              <BadgeCheck className="h-4 w-4" />
              Alessandro Tech Solutions
            </div>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#f1d878] text-[#03162F] shadow-lg">
                <Icon className="h-7 w-7" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {categoryDefinition.name}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {categoryDefinition.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Independent sections */}
        <section className="mt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <CategoryLink
              href={`${basePath}/products`}
              icon={Package}
              title="Products"
              description="Browse available technology products."
              badge="SHOP"
            />

            <CategoryLink
              href={`${basePath}/services`}
              icon={Wrench}
              title="Services"
              description="Explore professional technology services."
              badge="BOOK"
            />

            <CategoryLink
              href={`${basePath}/gallery`}
              icon={ImageIcon}
              title="Gallery"
              description="View our technology work and projects."
              badge="VIEW"
            />
          </div>
        </section>

        {/* Small information strip */}
        <section className="mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#9b7a08]">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-black text-[#03162F]">
                  One connected Tech Solutions experience
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Products and services displayed here are managed through
                  AEOS and are connected to the customer ordering and booking
                  flow.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick action */}
        <section className="mt-6">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#03162F] to-[#0b2f4a] p-5 shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em]">
                    Need help?
                  </span>
                </div>

                <h2 className="mt-1 text-lg font-black text-white">
                  Let&apos;s find the right technology solution.
                </h2>

                <p className="mt-1 text-xs text-slate-300">
                  Our products, services and customer requests stay connected
                  to the Alessandro Enterprise system.
                </p>
              </div>

              <Link
                href={`/customer/businesses/${slug}/apply`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-xs font-black text-[#03162F] transition hover:scale-[1.02] hover:bg-[#e4c45d]"
              >
                Request Assistance
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function CategoryLink({
  href,
  icon: Icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: typeof Package;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/60 hover:shadow-lg"
    >
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#D4AF37]/5 transition duration-300 group-hover:bg-[#D4AF37]/10" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#03162F] to-[#123b5c] text-[#D4AF37]">
            <Icon className="h-5 w-5" />
          </div>

          <span className="rounded-full bg-[#D4AF37]/10 px-2 py-1 text-[9px] font-black tracking-wider text-[#92730b]">
            {badge}
          </span>
        </div>

        <h3 className="mt-4 text-base font-black text-[#03162F]">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#D4AF37]">
            Open page
          </span>

          <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#03162F]" />
        </div>
      </div>
    </Link>
  );
}