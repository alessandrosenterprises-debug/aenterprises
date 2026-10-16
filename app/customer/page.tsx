import CustomerHomeClient from "./CustomerHomeClient";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export interface CustomerHomeBusiness {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
}

export default async function CustomerHomePage() {
  const supabase = await createClient();

  const [{ data: businesses, error }, { data: settings }] = await Promise.all([
    supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug,
      description,
      logo_url
    `)
    .eq("active", true)
    .order("name")
    .limit(12),
    supabase
      .from("company_settings")
      .select("company_name, tagline, phone, whatsapp, email")
      .eq("singleton_key", "default")
      .maybeSingle<{ company_name: string | null; tagline: string | null; phone: string | null; whatsapp: string | null; email: string | null }>(),
  ]);

  if (error) {
    console.error("Customer home businesses error:", error);
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-[96px]">


      <CustomerHomeClient
        businesses={(businesses ?? []) as CustomerHomeBusiness[]}
        contactDetails={{
          companyName: settings?.company_name?.trim() || "Alessandro Enterprises",
          tagline: settings?.tagline?.trim() || "The Name That Covers All",
          phone: settings?.phone?.trim() || "",
          whatsapp: settings?.whatsapp?.trim() || "",
          email: settings?.email?.trim() || "",
        }}
      />
    </main>
  );
}
