import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** Public, customer-safe catalogue used by the native Soft Loans app. */
export async function GET() {
  try {
    const admin = createAdminClient();
    const [{ data: products, error: productsError }, { data: collaterals, error: collateralError }] = await Promise.all([
      admin.from("loan_products").select("id,name,description,min_amount,max_amount,requires_collateral,status").eq("status", "Active").order("name", { ascending: true }),
      admin.from("collateral_catalogue").select("id,name,description").eq("active", true).order("name", { ascending: true }),
    ]);
    if (productsError) throw productsError;
    if (collateralError) throw collateralError;

    const productIds = (products ?? []).map((product) => product.id);
    const { data: terms, error: termsError } = productIds.length
      ? await admin.from("loan_product_terms").select("id,loan_product_id,period_days,interest_rate,active").in("loan_product_id", productIds).eq("active", true).order("period_days", { ascending: true })
      : { data: [], error: null };
    if (termsError) throw termsError;

    return NextResponse.json({
      products: (products ?? []).map((product) => ({ ...product, terms: (terms ?? []).filter((term) => term.loan_product_id === product.id) })),
      collaterals: collaterals ?? [],
      updatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("Native Soft Loans catalogue error:", error);
    return NextResponse.json({ error: "Loan options are temporarily unavailable. Please retry when your connection is stronger." }, { status: 503 });
  }
}
