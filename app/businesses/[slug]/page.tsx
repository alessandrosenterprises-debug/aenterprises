import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

interface BusinessPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BusinessPage({
  params,
}: BusinessPageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, description, logo_url, active, created_at"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error(
      "Business page error:",
      error
    );

    throw error;
  }

  if (!business) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-[#03162F] px-8 py-10 text-white">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#D4AF37]">
              Alessandro Enterprises
            </p>

            <h1 className="text-4xl font-bold">
              {business.name}
            </h1>

            {business.description && (
              <p className="mt-4 max-w-3xl text-slate-300">
                {business.description}
              </p>
            )}
          </div>

          <div className="grid gap-6 p-8 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">
                Business
              </p>

              <p className="mt-1 font-semibold text-[#03162F]">
                {business.name}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">
                Status
              </p>

              <p className="mt-1 font-semibold">
                {business.active
                  ? "Active"
                  : "Inactive"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">
                Slug
              </p>

              <p className="mt-1 font-semibold text-[#03162F]">
                {business.slug}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}