import { createClient } from "@/lib/supabase/server";
import type { EnterpriseBusinessWorkspaceData } from "../types/business-workspace";

export async function getEnterpriseBusinessWorkspace(
  slug: string
): Promise<EnterpriseBusinessWorkspaceData | null> {
  const supabase = await createClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug, description, logo_url")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (businessError) throw businessError;
  if (!business) return null;

  const [catalogResult, mobileServicesResult, loanApplicationsResult, loanProductsResult, loanTermsResult] = await Promise.all([
    supabase
      .from("enterprise_catalog")
      .select("id, item_type, category, name, description, base_price, quantity, status, image_url, attributes")
      .eq("business_id", business.id),
    slug === "mobile-money"
      ? supabase.from("mobile_money_services").select("id, name, description, service_type, status")
      : Promise.resolve({ data: [], error: null }),
    slug === "soft-loans"
      ? supabase.from("customer_loan_applications").select("id", { count: "exact", head: true })
      : Promise.resolve({ count: 0, error: null }),
    slug === "soft-loans"
      ? supabase.from("loan_products").select("id, name, description, min_amount, max_amount, interest_rate, repayment_period, requires_collateral, status")
      : Promise.resolve({ data: [], error: null }),
    slug === "soft-loans"
      ? supabase.from("loan_product_terms").select("id", { count: "exact", head: true }).eq("active", true)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  if (catalogResult.error) throw catalogResult.error;
  if (mobileServicesResult.error) throw mobileServicesResult.error;
  if (loanApplicationsResult.error) throw loanApplicationsResult.error;
  if (loanProductsResult.error) throw loanProductsResult.error;
  if (loanTermsResult.error) throw loanTermsResult.error;

  return {
    business,
    catalog: catalogResult.data ?? [],
    mobileMoneyServices: mobileServicesResult.data ?? [],
    loanProducts: loanProductsResult.data ?? [],
    mobileMoneyServiceCount: mobileServicesResult.data?.length ?? 0,
    activeMobileMoneyServiceCount: mobileServicesResult.data?.filter((service) => service.status === "Active").length ?? 0,
    loanApplicationCount: loanApplicationsResult.count ?? 0,
    loanProductCount: loanProductsResult.data?.length ?? 0,
    activeLoanProductCount: loanProductsResult.data?.filter((product) => product.status === "Active").length ?? 0,
    activeLoanTermCount: loanTermsResult.count ?? 0,
  };
}
