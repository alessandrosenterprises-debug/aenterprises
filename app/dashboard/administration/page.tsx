import {
  ShieldCheck,
  Users,
  Lock,
  KeyRound,
} from "lucide-react";

const administrationSections = [
  {
    title: "Users",
    description:
      "Manage administrator and platform user accounts.",
    icon: Users,
    href: "/dashboard/customers",
  },
  {
    title: "Roles",
    description:
      "Manage roles and access levels.",
    icon: ShieldCheck,
    href: "/dashboard/configuration/roles",
  },
  {
    title: "Permissions",
    description:
      "Manage system permissions.",
    icon: KeyRound,
    href: "/dashboard/configuration/permissions",
  },
  {
    title: "Security",
    description:
      "Manage platform security and access controls.",
    icon: Lock,
    href: "/dashboard/settings",
  },
];

export default function AdministrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Administration
        </h1>

        <p className="mt-1 text-slate-500">
          Manage users, roles, permissions and platform
          security.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {administrationSections.map((section) => {
          const Icon = section.icon;

          return (
            <a
              key={section.title}
              href={section.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#03162F] text-white group-hover:bg-[#0A2852]">
                  <Icon className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#03162F]">
                    {section.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {section.description}
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}