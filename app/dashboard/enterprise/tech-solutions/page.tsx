
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  FileText,
  Image,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
}

interface CatalogItem {
  id: string;
  business_id: string;
  item_type: string;
  category: string | null;
  name: string;
  description: string | null;
  base_price: number | null;
  quantity: number | null;
  status: string;
  image_url: string | null;
  attributes: Record<string, unknown> | null;
}

/* -------------------------------------------------------------------------- */
/* TECH SOLUTIONS-SPECIFIC WORKSPACE                                          */
/* -------------------------------------------------------------------------- */

const businessSections = [
  {
    title: "Overview",
    description:
      "View the Alessandro Tech Solutions business workspace and activity.",
    href: "/dashboard/enterprise/tech-solutions",
    icon: LayoutDashboard,
    accent: "from-[#03162F] to-[#174D8C]",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Services",
    description:
      "Create and manage services offered specifically by Tech Solutions.",
    href: "/dashboard/enterprise/tech-solutions/services",
    icon: Wrench,
    accent: "from-violet-500 to-purple-600",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    title: "Products",
    description:
      "Manage Technology Shop products, stock, pricing and availability.",
    href: "/dashboard/enterprise/tech-solutions/products",
    icon: Package,
    accent: "from-amber-400 to-orange-500",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    title: "Gallery",
    description:
      "Manage Tech Solutions images, portfolio content and business gallery.",
    href: "/dashboard/enterprise/tech-solutions/gallery",
    icon: Image,
    accent: "from-cyan-500 to-blue-600",
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
  {
    title: "Posts & Updates",
    description:
      "Publish Tech Solutions news, posts, announcements and updates.",
    href: "/dashboard/enterprise/tech-solutions/posts",
    icon: FileText,
    accent: "from-indigo-500 to-violet-600",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    title: "Promotions",
    description:
      "Create and manage Tech Solutions offers, discounts and promotions.",
    href: "/dashboard/enterprise/tech-solutions/promotions",
    icon: Megaphone,
    accent: "from-orange-500 to-red-500",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    title: "AEOS Banners",
    description:
      "Manage promotional banners displayed to customers through AEOS.",
    href: "/dashboard/enterprise/tech-solutions/banners",
    icon: Bell,
    accent: "from-yellow-400 to-amber-500",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
  {
    title: "Business Settings",
    description:
      "Manage Tech Solutions business information and business-specific settings.",
    href: "/dashboard/enterprise/tech-solutions/settings",
    icon: Settings,
    accent: "from-slate-500 to-slate-700",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
];

/* -------------------------------------------------------------------------- */
/* ENTERPRISE-WIDE OPERATIONS                                                 */
/* -------------------------------------------------------------------------- */

const enterpriseOperations = [
  {
    title: "Enterprise Customers",
    description:
      "Manage the complete Alessandro Enterprises customer base. Customers are enterprise-wide and are associated with a business when they order a product or use a business-specific service.",
    icon: Users,
    accent: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/dashboard/customers",
    action: "Open Customers",
  },
  {
  title: "Bookings",
  description:
    "Manage customer bookings and appointments across Alessandro Enterprises.",
  href: "/dashboard/bookings",
  icon: CalendarDays,
  accent: "from-emerald-500 to-teal-600",
  iconBg: "bg-emerald-50",
  iconColor: "text-emerald-600",
},
  {
    title: "Enterprise Orders",
    description:
      "Manage customer product orders across the Enterprise through the central order management system.",
    icon: ShoppingBag,
    accent: "from-pink-500 to-rose-500",
    iconBg: "bg-pink-50",
    iconColor: "text-pink-600",
    href: "/dashboard/orders",
    action: "Open Orders",
  },
  {
    title: "HR & Employees",
    description:
      "Employees belong to Alessandro Enterprises and are managed centrally by Human Resources rather than by individual business workspaces.",
    icon: BriefcaseBusiness,
    accent: "from-purple-500 to-pink-500",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    href: "/dashboard/hr/employees",
    action: "Open HR",
  },
  {
    title: "Enterprise Reports",
    description:
      "View enterprise performance reporting through the main Dashboard reports system. HR-specific reporting remains available through HR Reports.",
    icon: BarChart3,
    accent: "from-amber-400 to-orange-500",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    href: "/dashboard/reports",
    action: "Open Reports",
  },
];

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default async function TechSolutionsPage() {
  const supabase = await createClient();

  /* ------------------------------------------------------------------------ */
  /* BUSINESS                                                                  */
  /* ------------------------------------------------------------------------ */

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      `
        id,
        name,
        slug,
        description,
        logo_url
      `
    )
    .ilike("name", "%Tech Solutions%")
    .eq("active", true)
    .maybeSingle();

  if (businessError) {
    console.error(
      "AEOS Tech Solutions business error:",
      JSON.stringify(businessError, null, 2)
    );
  }

  if (!business) {
    redirect("/dashboard/enterprise");
  }

  /* ------------------------------------------------------------------------ */
  /* CATALOG                                                                   */
  /* ------------------------------------------------------------------------ */

  const { data: catalogItems, error: catalogError } = await supabase
    .from("enterprise_catalog")
    .select(
      `
        id,
        business_id,
        item_type,
        category,
        name,
        description,
        base_price,
        quantity,
        status,
        image_url,
        attributes
      `
    )
    .eq("business_id", business.id)
    .order("created_at", {
      ascending: false,
    });

  if (catalogError) {
    console.error(
      "AEOS Tech Solutions catalog error:",
      JSON.stringify(catalogError, null, 2)
    );
  }

  const items = (catalogItems ?? []) as CatalogItem[];

  const services = items.filter(
    (item) => item.item_type?.toLowerCase() === "service"
  );

  const products = items.filter(
    (item) => item.item_type?.toLowerCase() === "product"
  );

  const activeItems = items.filter(
    (item) => item.status?.toLowerCase() === "active"
  );

  return (
    <div className="space-y-10 pb-12">
      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                               */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#03162F] via-[#0A2852] to-[#174D8C] px-6 py-8 text-white shadow-xl sm:px-8 lg:px-10 lg:py-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              AEOS • Business Management
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              {business.name}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              Manage Alessandro Tech Solutions services, products and
              customer-facing business content while accessing the
              enterprise-wide customer, booking, order, HR and reporting
              systems from one workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-400/15 px-3 py-1.5 text-xs font-bold text-blue-100">
                Technology
              </span>

              <span className="rounded-full bg-violet-400/15 px-3 py-1.5 text-xs font-bold text-violet-100">
                IT Solutions
              </span>

              <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-bold text-[#F5D978]">
                Alessandro Enterprises
              </span>

              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-100">
                Active
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/20">
              <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                Business Status
              </p>

              <p className="mt-1 text-lg font-black text-white">Active</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* QUICK STATS                                                        */}
      {/* ------------------------------------------------------------------ */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Catalog Items"
          value={items.length}
          subtitle="Services + products"
          icon={Package}
          className="from-blue-500 to-indigo-600"
        />

        <StatCard
          title="Active Items"
          value={activeItems.length}
          subtitle="Currently available"
          icon={LayoutDashboard}
          className="from-emerald-500 to-teal-600"
        />

        <StatCard
          title="Services"
          value={services.length}
          subtitle="Tech Solutions services"
          icon={Wrench}
          className="from-violet-500 to-purple-600"
        />

        <StatCard
          title="Products"
          value={products.length}
          subtitle="Technology Shop"
          icon={ShoppingBag}
          className="from-orange-500 to-red-500"
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* BUSINESS WORKSPACE                                                 */}
      {/* ------------------------------------------------------------------ */}

      <section>
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Tech Solutions Management
          </p>

          <div className="mt-1">
            <h2 className="text-2xl font-black text-[#03162F] sm:text-3xl">
              Business Workspace
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              These tools belong specifically to Alessandro Tech Solutions.
              They control this business's services, products and
              customer-facing content.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {businessSections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                key={section.title}
                href={section.href}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${section.accent}`}
                />

                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${section.iconBg} ${section.iconColor} transition-transform duration-200 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 transition group-hover:bg-slate-100">
                    <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#03162F]" />
                  </div>
                </div>

                <h3 className="mt-5 font-black text-[#03162F]">
                  {section.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {section.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ENTERPRISE OPERATIONS                                              */}
      {/* ------------------------------------------------------------------ */}

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                Alessandro Enterprises
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#03162F] sm:text-3xl">
                Enterprise-Wide Operations
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                These systems belong to the wider Enterprise. They are not
                Tech Solutions-only records and should remain centrally
                managed.
              </p>
            </div>

            <div className="inline-flex w-fit items-center rounded-full bg-[#03162F] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
              Enterprise Level
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2 xl:grid-cols-5">
          {enterpriseOperations.map((operation) => {
            const Icon = operation.icon;

            return (
              <Link
                key={operation.title}
                href={operation.href}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${operation.accent}`}
                />

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${operation.iconBg} ${operation.iconColor} transition-transform duration-200 group-hover:scale-110`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-5 font-black text-[#03162F]">
                  {operation.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {operation.description}
                </p>

                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#03162F]">
                  {operation.action}

                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Reports ownership */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#03162F]">
                Reporting ownership
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Enterprise performance reports are available through the
                Dashboard reports system, while employee and HR-specific
                reporting remains under HR.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/reports"
                className="rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0A2852]"
              >
                Dashboard Reports
              </Link>

              <Link
                href="/dashboard/hr/reports"
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
              >
                HR Reports
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* BUSINESS PROFILE                                                   */}
      {/* ------------------------------------------------------------------ */}

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[320px_1fr]">
          <div className="relative min-h-[240px] overflow-hidden bg-gradient-to-br from-[#03162F] via-[#0A2852] to-[#174D8C]">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#D4AF37]/20 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl" />

            {business.logo_url ? (
              <div className="relative flex h-full min-h-[240px] items-center justify-center p-10">
                <div className="rounded-3xl bg-white/95 p-6 shadow-2xl">
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="max-h-40 max-w-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="relative flex min-h-[240px] items-center justify-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-white/20 bg-white/10 text-5xl font-black text-white shadow-2xl backdrop-blur">
                  TS
                </div>
              </div>
            )}
          </div>

          <div className="p-7 sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              Business Profile
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#03162F] sm:text-3xl">
              {business.name}
            </h2>

            <p className="mt-4 max-w-3xl leading-7 text-slate-600">
              {business.description ||
                "Technology, IT and digital solutions for customers and businesses."}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                Technology
              </span>

              <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                IT Solutions
              </span>

              <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-bold text-[#8A6A00]">
                Alessandro Enterprises
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                Active Business
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SERVICES PREVIEW                                                   */}
      {/* ------------------------------------------------------------------ */}

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">
              Services
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#03162F]">
              Tech Solutions Services
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Services currently configured specifically for this business.
            </p>
          </div>

          <Link
            href="/dashboard/enterprise/tech-solutions/services"
            className="hidden items-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-100 sm:inline-flex"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {services.length === 0 ? (
          <EmptyState message="No Tech Solutions services have been added yet." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.slice(0, 6).map((service) => (
              <CatalogCard key={service.id} item={service} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* PRODUCTS PREVIEW                                                   */}
      {/* ------------------------------------------------------------------ */}

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
              Technology Shop
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#03162F]">
              Tech Solutions Products
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Products currently available in the Technology Shop catalog.
            </p>
          </div>

          <Link
            href="/dashboard/enterprise/tech-solutions/products"
            className="hidden items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700 transition hover:bg-orange-100 sm:inline-flex"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <EmptyState message="No Tech Solutions products have been added yet." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.slice(0, 6).map((product) => (
              <CatalogCard key={product.id} item={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STAT CARD                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof Package;
  className: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${className}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-black text-[#03162F]">{value}</p>

          <p className="mt-1 text-xs font-medium text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${className} text-white shadow-md`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CATALOG CARD                                                               */
/* -------------------------------------------------------------------------- */

function CatalogCard({ item }: { item: CatalogItem }) {
  const price =
    item.base_price !== null
      ? `ZMW ${Number(item.base_price).toLocaleString("en-ZM", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : null;

  const isService = item.item_type.toLowerCase() === "service";

  const isActive = item.status.toLowerCase() === "active";

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div
        className={`h-1 ${
          isService
            ? "bg-gradient-to-r from-violet-500 to-purple-600"
            : "bg-gradient-to-r from-orange-500 to-red-500"
        }`}
      />

      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full items-center justify-center ${
              isService
                ? "bg-gradient-to-br from-violet-50 to-purple-100"
                : "bg-gradient-to-br from-orange-50 to-amber-100"
            }`}
          >
            <span
              className={`text-6xl font-black ${
                isService ? "text-violet-300" : "text-orange-300"
              }`}
            >
              {isService ? "S" : "P"}
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className={`text-[11px] font-black uppercase tracking-[0.15em] ${
                isService ? "text-violet-600" : "text-orange-600"
              }`}
            >
              {item.category || (isService ? "Service" : "Product")}
            </p>

            <h3 className="mt-1 text-lg font-black text-[#03162F]">
              {item.name}
            </h3>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {item.status}
          </span>
        </div>

        {item.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
            {item.description}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            {price ? (
              <p className="font-black text-[#03162F]">{price}</p>
            ) : (
              <p className="text-sm font-medium text-slate-400">
                Price not set
              </p>
            )}
          </div>

          {!isService && item.quantity !== null && (
            <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
              {item.quantity} in stock
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* EMPTY STATE                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Package className="h-6 w-6 text-slate-400" />
      </div>

      <p className="mt-4 font-bold text-[#03162F]">{message}</p>

      <p className="mt-2 text-sm text-slate-500">
        Add items through the Tech Solutions workspace to make them available
        here.
      </p>
    </div>
  );
}
