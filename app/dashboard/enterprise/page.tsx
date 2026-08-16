import {
  Building2,
  Users,
  Package,
  BarChart3,
} from "lucide-react";

const enterpriseSections = [
  {
    title: "Businesses",
    description:
      "Manage all businesses operating under Alessandro Enterprises.",
    icon: Building2,
    href: "/dashboard/configuration/businesses",
  },
  {
    title: "Employees",
    description:
      "Manage employees, staff and enterprise team members.",
    icon: Users,
    href: "/dashboard/employees",
  },
  {
    title: "Products",
    description:
      "Manage products and services across the enterprise.",
    icon: Package,
    href: "/dashboard/products",
  },
  {
    title: "Reports",
    description:
      "View enterprise performance and business reports.",
    icon: BarChart3,
    href: "/dashboard/reports",
  },
];

export default function EnterprisePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Enterprise
        </h1>

        <p className="mt-1 text-slate-500">
          Manage Alessandro Enterprises from one central
          administration area.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {enterpriseSections.map((section) => {
          const Icon = section.icon;

          return (
            <a
              key={section.title}
              href={section.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#0A2852] hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white transition-colors group-hover:bg-[#0A2852]">
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