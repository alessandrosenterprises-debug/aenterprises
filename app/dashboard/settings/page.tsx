import {
  Settings,
  Building2,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react";

const settingsSections = [
  {
    title: "Company Settings",
    description:
      "Manage Alessandro Enterprises company information.",
    icon: Building2,
    href: "/dashboard/configuration/company-settings",
  },
  {
    title: "Platform Configuration",
    description:
      "Configure departments, branches, products and services.",
    icon: SlidersHorizontal,
    href: "/dashboard/configuration/businesses",
  },
  {
    title: "Security",
    description:
      "Manage roles and permissions.",
    icon: ShieldCheck,
    href: "/dashboard/administration",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Settings
        </h1>

        <p className="mt-1 text-slate-500">
          Configure your Alessandro Enterprises platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;

          return (
            <a
              key={section.title}
              href={section.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#03162F] text-white group-hover:bg-[#0A2852]">
                <Icon className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-lg font-bold text-[#03162F]">
                {section.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {section.description}
              </p>
            </a>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-slate-100 p-3">
            <Settings className="h-6 w-6 text-[#03162F]" />
          </div>

          <div>
            <h2 className="font-bold text-[#03162F]">
              Platform Settings
            </h2>

            <p className="text-sm text-slate-500">
              More platform-wide settings can be added here as
              the system grows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}