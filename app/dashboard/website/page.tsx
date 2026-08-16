import {
  Globe,
  Image,
  Megaphone,
  Eye,
} from "lucide-react";

const websiteSections = [
  {
    title: "Website Posts",
    description:
      "Create and manage posts displayed on the Alessandro Enterprises website.",
    icon: Megaphone,
  },
  {
    title: "Images",
    description:
      "Manage images and promotional media used across the website.",
    icon: Image,
  },
  {
    title: "Website Visits",
    description:
      "Monitor visits and engagement with published website content.",
    icon: Eye,
  },
];

export default function WebsitePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Website CMS
        </h1>

        <p className="mt-1 text-slate-500">
          Manage Alessandro Enterprises website content,
          images and updates.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {websiteSections.map((section) => {
          const Icon = section.icon;

          return (
            <div
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#03162F] text-white">
                <Icon className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-lg font-bold text-[#03162F]">
                {section.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {section.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="py-8 text-center">
          <Globe className="mx-auto h-12 w-12 text-slate-300" />

          <h2 className="mt-4 text-xl font-bold text-[#03162F]">
            Website management
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            The website content management tools will be
            connected to your website posts, images and
            Supabase data here.
          </p>
        </div>
      </div>
    </div>
  );
}