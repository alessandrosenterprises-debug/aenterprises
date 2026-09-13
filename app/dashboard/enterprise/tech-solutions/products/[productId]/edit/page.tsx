
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import EditProductForm from "./EditProductForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    productId: string;
  }>;
}

interface Business {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  business_id: string;
  item_type: string;
  category: string | null;
  name: string;
  description: string | null;
  base_price: number | null;
  quantity: number | null;
  status: string;
  image_url: string | null;
  attributes: Record<string, unknown> | null;
}

export default async function EditTechSolutionsProductPage({
  params,
}: PageProps) {
  const { productId } = await params;

  const supabase = await createClient();

  // Get Tech Solutions business
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug
    `)
    .ilike("name", "%Tech Solutions%")
    .eq("active", true)
    .maybeSingle();

  if (businessError) {
    console.error(
      "AEOS Tech Solutions business error:",
      JSON.stringify(businessError, null, 2)
    );
  }

  if (!business) {
    redirect("/dashboard/enterprise");
  }

  // Get the specific product
  const { data: product, error: productError } = await supabase
    .from("enterprise_catalog")
    .select(`
      id,
      business_id,
      item_type,
      category,
      name,
      description,
      base_price,
      quantity,
      status,
      image_url,
      attributes
    `)
    .eq("id", productId)
    .eq("business_id", business.id)
    .eq("item_type", "product")
    .maybeSingle();

  if (productError) {
    console.error(
      "AEOS Tech Solutions product error:",
      JSON.stringify(productError, null, 2)
    );
  }

  if (!product) {
    notFound();
  }

  // Explicitly build the objects passed to the client component.
  // This prevents the client form from receiving an undefined product.
  const selectedBusiness: Business = {
    id: business.id,
    name: business.name,
    slug: business.slug,
  };

  const selectedProduct: Product = {
    id: product.id,
    business_id: product.business_id,
    item_type: product.item_type,
    category: product.category,
    name: product.name,
    description: product.description,
    base_price: product.base_price,
    quantity: product.quantity,
    status: product.status,
    image_url: product.image_url,
    attributes: product.attributes,
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
          AEOS • Technology Shop
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#03162F]">
          Edit Product
        </h1>

        <p className="mt-2 max-w-3xl text-slate-500">
          Update this Technology Shop product. Changes are saved to the same
          catalog used by the customer-facing Tech Solutions page.
        </p>
      </div>

      <EditProductForm
        business={selectedBusiness}
        product={selectedProduct}
      />
    </div>
  );
}
