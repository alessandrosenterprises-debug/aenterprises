
import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import OrderCreationInterface from "./OrderCreationInterface";

export const dynamic = "force-dynamic";

export interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  item_type: string | null;
  base_price: number | null;
  business_id: string;
  status: string | null;
  image_url: string | null;
}

export default async function NewOrderPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/customer/login");
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, full_name, email, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (customerError) {
    console.error("New order customer error:", customerError);
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#06142f] text-white">
        <CustomerNavigation />

        <main className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-xl">
            <h1 className="text-2xl font-bold">
              Customer profile not found
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/60">
              We could not find your customer profile. Please contact
              Alessandro Enterprises for assistance.
            </p>

            <Link
              href="/customer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              <ArrowLeft size={18} />
              Back to Customer Portal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { data: catalogData, error: catalogError } = await supabase
    .from("enterprise_catalog")
    .select(
      `
        id,
        name,
        description,
        item_type,
        base_price,
        business_id,
        status,
        image_url
      `
    )
    .order("name", { ascending: true });

  if (catalogError) {
    console.error("New order catalog error:", catalogError);
  }

  const catalogItems: CatalogItem[] = (catalogData ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    item_type: item.item_type,
    base_price: item.base_price,
    business_id: item.business_id,
    status: item.status,
    image_url: item.image_url,
  }));

  const orderableItems = catalogItems.filter((item) => {
    const type = item.item_type?.trim().toLowerCase();

    const orderable =
      !type ||
      type === "product" ||
      type === "goods" ||
      type === "item" ||
      type === "order" ||
      type === "retail";

    if (!orderable) {
      return false;
    }

    const status = item.status?.trim().toLowerCase();

    if (
      status === "inactive" ||
      status === "disabled" ||
      status === "ended" ||
      status === "archived" ||
      status === "deleted"
    ) {
      return false;
    }

    return true;
  });

  return (
    <OrderCreationInterface
      items={orderableItems}
      customerId={customer.id}
    />
  );
}