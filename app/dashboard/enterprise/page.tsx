import Link from "next/link";
import {
  ArrowRight,
  Activity,
  BarChart3,
  Building2,
  Boxes,
  BriefcaseBusiness,
  ListTree,
  UsersRound,
} from "lucide-react";

import { getConfiguration } from "@/modules/configuration/services/configuration.server.service";
import { getEmployees } from "@/modules/employees/services/employee.service";

const enterpriseSections = [
  {
    title: "Businesses",
    description: "Manage business profiles, operating status and enterprise-wide details.",
    icon: Building2,
    href: "/dashboard/configuration/businesses",
    action: "Manage businesses",
    group: "Business operations",
  },
  {
    title: "Employees",
    description: "Maintain employee records, roles, branches and team assignments.",
    icon: UsersRound,
    href: "/dashboard/employees",
    action: "Open staff directory",
    group: "People",
  },
  {
    title: "Products & services",
    description: "Review and maintain the products and services offered across the enterprise.",
    icon: Boxes,
    href: "/dashboard/catalog",
    action: "Manage catalog",
    group: "Catalog",
  },
  {
    title: "Business content",
    description: "Update business products, services, promotions, gallery images and posts.",
    icon: ListTree,
    href: "/dashboard/enterprise/content",
    action: "Manage content",
    group: "Customer experience",
  },
  {
    title: "Reports",
    description: "Review enterprise performance and business reports.",
    icon: BarChart3,
    href: "/dashboard/reports",
    action: "View reports",
    group: "Insights",
  },
];

export default async function EnterprisePage() {
  const [businessesResult, employeesResult, catalogResult] = await Promise.allSettled([
    getConfiguration("businesses"),
    getEmployees(),
    getConfiguration("enterprise_catalog"),
  ]);

  const businesses = businessesResult.status === "fulfilled" ? businessesResult.value : null;
  const employees = employeesResult.status === "fulfilled" ? employeesResult.value : null;
  const catalog = catalogResult.status === "fulfilled" ? catalogResult.value : null;
  const activeBusinesses = businesses?.filter((row) => row.active === true).length ?? null;
  const activeCatalogItems = catalog?.filter((row) => row.active === true).length ?? null;

  return (
    <main className="w-full min-w-0 space-y-6">
      <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 isolate overflow-hidden rounded-none bg-[#03162F] px-6 py-7 text-white shadow-xl shadow-[#03162F]/10 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.22),transparent_65%)]" />
        <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <Activity className="h-4 w-4" />
              Enterprise workspace
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Enterprise overview</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Coordinate businesses, people, customer-facing content and performance from one workspace.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[390px]">
            <OverviewMetric label="Businesses" value={businesses?.length ?? null} />
            <OverviewMetric label="Active businesses" value={activeBusinesses} />
            <OverviewMetric label="Team members" value={employees?.length ?? null} />
          </div>
        </div>
      </header>

      <section aria-labelledby="enterprise-tools-heading">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A88314]">Workspace tools</p>
            <h2 id="enterprise-tools-heading" className="mt-1 text-xl font-bold tracking-tight text-[#03162F]">
              Choose an enterprise area
            </h2>
          </div>
          <p className="text-xs text-slate-500">Each area opens its dedicated management workspace.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {enterpriseSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.title}
                href={section.href}
                className="group flex min-h-[210px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D4AF37]/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37] transition group-hover:bg-[#0A2852]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {section.group}
                  </span>
                </div>
                <div className="mt-5 flex-1">
                  <h3 className="text-base font-bold text-[#03162F]">{section.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-slate-500">{section.description}</p>
                </div>
                <span className="mt-5 inline-flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-semibold text-[#03162F]">
                  {section.action}
                  <ArrowRight className="h-4 w-4 text-[#A88314] transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F2DF] text-[#8B6A0B]">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-[#03162F]">Enterprise operating flow</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">Keep business information and customer offerings coordinated.</p>
            </div>
          </div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            <WorkflowStep number="01" title="Maintain businesses" detail="Keep business profiles and operating status current." />
            <WorkflowStep number="02" title="Manage the catalog" detail="Keep products, services and customer content aligned." />
            <WorkflowStep number="03" title="Review performance" detail="Use enterprise reports to monitor activity and results." />
          </ol>
        </div>

        <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#FBF8EC] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[#03162F]">
            <Boxes className="h-4 w-4 text-[#9B7910]" />
            <h2 className="text-sm font-bold">Catalog status</h2>
          </div>
          <p className="mt-2 text-sm leading-5 text-slate-600">
            {activeCatalogItems === null
              ? "Catalog status is currently unavailable. Open the catalog workspace to review items."
              : `${activeCatalogItems} active catalog ${activeCatalogItems === 1 ? "item is" : "items are"} available across the enterprise.`}
          </p>
          <Link href="/dashboard/catalog" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#03162F] hover:text-[#8B6A0B]">
            Open products & services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function OverviewMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 sm:px-4">
      <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">{label}</p>
      {value === null && <p className="mt-1 text-[10px] text-slate-400">Could not load</p>}
    </div>
  );
}

function WorkflowStep({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-[10px] font-bold tracking-[0.14em] text-[#A88314]">{number}</p>
      <h3 className="mt-2 text-sm font-bold text-[#03162F]">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </li>
  );
}
