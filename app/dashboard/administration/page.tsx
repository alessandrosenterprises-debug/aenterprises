import Link from "next/link";
import {
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
  KeyRound,
  Activity,
  UserRoundCog,
  Settings2,
} from "lucide-react";

import { getConfiguration } from "@/modules/configuration/services/configuration.service";

const tools = [
  {
    title: "Staff directory",
    description: "Review employee profiles, departments, business assignments, and linked accounts.",
    href: "/dashboard/employees",
    action: "Open staff directory",
    icon: UsersRound,
    group: "People",
  },
  {
    title: "Roles",
    description: "Create and maintain the access roles used across the enterprise.",
    href: "/dashboard/configuration/roles",
    action: "Manage roles",
    icon: ShieldCheck,
    group: "Access control",
  },
  {
    title: "Permissions",
    description: "Maintain permission definitions by platform area and action.",
    href: "/dashboard/configuration/permissions",
    action: "Manage permissions",
    icon: KeyRound,
    group: "Access control",
  },
  {
    title: "Role & staff access",
    description: "Assign permissions to roles and connect active staff accounts to their access role.",
    href: "/dashboard/administration/access",
    action: "Configure access",
    icon: ShieldCheck,
    group: "Access control",
  },
  {
    title: "Activity log",
    description: "Review a dated record of role assignments and permission changes.",
    href: "/dashboard/administration/activity",
    action: "Review activity",
    icon: Activity,
    group: "Governance",
  },
  {
    title: "Security settings",
    description: "Review administrator password and session security controls.",
    href: "/dashboard/settings?section=security",
    action: "Review security settings",
    icon: LockKeyhole,
    group: "Platform security",
  },
];

export default async function AdministrationPage() {
  const [rolesResult, permissionsResult] = await Promise.allSettled([
    getConfiguration("roles"),
    getConfiguration("permissions"),
  ]);

  const rolesCount = rolesResult.status === "fulfilled" ? rolesResult.value.length : null;
  const permissionsCount = permissionsResult.status === "fulfilled" ? permissionsResult.value.length : null;

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1800px] space-y-6">
      <header className="relative isolate overflow-hidden rounded-3xl bg-[#03162F] px-6 py-7 text-white shadow-xl shadow-[#03162F]/10 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.22),transparent_65%)]" />
        <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <Activity className="h-4 w-4" />
              Administration workspace
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Administration</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Manage your team directory, access roles, permission definitions, and administrator security from one workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[330px]">
            <OverviewMetric label="Roles" value={rolesCount} />
            <OverviewMetric label="Permissions" value={permissionsCount} />
          </div>
        </div>
      </header>

      <section aria-labelledby="admin-tools-heading">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A88314]">Workspace tools</p>
            <h2 id="admin-tools-heading" className="mt-1 text-xl font-bold tracking-tight text-[#03162F]">Choose an administration area</h2>
          </div>
          <p className="text-xs text-slate-500">Changes are managed in their dedicated workspaces.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="group flex min-h-[210px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D4AF37]/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37] transition group-hover:bg-[#0A2852]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{tool.group}</span>
                </div>
                <div className="mt-5 flex-1">
                  <h3 className="text-base font-bold text-[#03162F]">{tool.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-slate-500">{tool.description}</p>
                </div>
                <span className="mt-5 inline-flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-semibold text-[#03162F]">
                  {tool.action}
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
              <UserRoundCog className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-[#03162F]">Administration workflow</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">Keep people and access records organized as your team changes.</p>
            </div>
          </div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            <WorkflowStep number="01" title="Maintain roles" detail="Keep role names and responsibilities current." />
            <WorkflowStep number="02" title="Define permissions" detail="Maintain the module actions available to assign." />
            <WorkflowStep number="03" title="Review security" detail="Check administrator password and session settings." />
          </ol>
        </div>

        <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#FBF8EC] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[#03162F]">
            <Settings2 className="h-4 w-4 text-[#9B7910]" />
            <h2 className="text-sm font-bold">Access management</h2>
          </div>
          <p className="mt-2 text-sm leading-5 text-slate-600">
            Configuration changes are restricted to authorized administrators. Role and permission records are managed separately so each change is easy to review.
          </p>
          <Link href="/dashboard/configuration/roles" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#03162F] hover:text-[#8B6A0B]">
            Open access configuration <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function OverviewMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">{label} defined</p>
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
