import CustomerHomeClient from "./CustomerHomeClient";
import CustomerNavigation from "@/components/customer/CustomerNavigation";
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

  const { data: businesses, error } = await supabase
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
    .limit(12);

  if (error) {
    console.error("Customer home businesses error:", error);
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-[96px]">
      <CustomerNavigation />

      <CustomerHomeClient
        businesses={(businesses ?? []) as CustomerHomeBusiness[]}
      />
    </main>
  );
}