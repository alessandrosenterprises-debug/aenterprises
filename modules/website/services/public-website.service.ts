import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { defaultWebsiteSettings, type CompanySettings, type WebsiteSettings } from "@/modules/configuration/services/configuration.service";
import { demoBusinesses, demoOffers, demoProducts, demoUpdates } from "@/modules/website/data/demo-content";

export type PublicBusiness = { id: string; name: string; slug: string; description: string | null; logo_url: string | null; is_demo: boolean };
export type PublicCatalogItem = { id: string; business_id: string; name: string; description: string | null; category: string | null; item_type: string; base_price: number | null; image_url: string | null; is_demo: boolean; min_amount?: number | null; max_amount?: number | null; interest_rate?: number | null; repayment_period?: number | null; requires_collateral?: boolean };
export type PublicOffer = { id: string; business_id: string; title: string; description: string | null; discount_text: string | null; image_url: string | null; end_date: string | null; is_demo: boolean };
export type PublicUpdate = { id: string; business_id: string; title: string; content: string | null; image_url: string | null; published_at: string | null; is_demo: boolean };
export type PublicGalleryImage = { id: string; business_id: string; image_url: string; title: string | null; caption: string | null; is_featured: boolean; is_demo: false };

export type PublicWebsiteData = {
  website: WebsiteSettings;
  company: Pick<CompanySettings, "company_name" | "tagline" | "description" | "logo_url" | "phone" | "whatsapp" | "email" | "address" | "city" | "country">;
  businesses: PublicBusiness[];
  products: PublicCatalogItem[];
  offers: PublicOffer[];
  updates: PublicUpdate[];
  gallery: PublicGalleryImage[];
  connectionIssues: string[];
};

const defaultCompany = {
  company_name: "Alessandro Enterprises", tagline: "One Vision, Many Possibilities", description: null,
  logo_url: null, phone: null, whatsapp: null, email: null, address: null, city: null, country: null,
};

/**
 * Public pages read their public-facing fields on the server with the AEOS
 * service client. This avoids asking visitors to sign in for data whose RLS
 * policies intentionally protect the management tables. No privileged data
 * or client is sent to the browser.
 */
export const getPublicWebsiteData = cache(async function getPublicWebsiteData(): Promise<PublicWebsiteData> {
  const supabase = createAdminClient();
  const connectionIssues: string[] = [];
  const [platformResult, companyResult, businessesResult] = await Promise.all([
    supabase.from("platform_settings").select("website").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("company_settings").select("company_name,tagline,description,logo_url,phone,whatsapp,email,address,city,country").eq("active", true).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("businesses").select("id,name,slug,description,logo_url").eq("active", true).order("name"),
  ]);
  if (platformResult.error) connectionIssues.push(`Website settings: ${platformResult.error.message}`);
  if (companyResult.error) connectionIssues.push(`Company profile: ${companyResult.error.message}`);
  if (businessesResult.error) connectionIssues.push(`Business directory: ${businessesResult.error.message}`);

  const platform = platformResult.data;
  const company = companyResult.data ?? defaultCompany;
  const liveBusinesses = businessesResult.data ?? [];
  const knownBusinessSlugs = new Set(liveBusinesses.map((business) => business.slug));
  const businesses: PublicBusiness[] = [
    ...liveBusinesses.map((business) => ({ ...business, is_demo: false })),
    ...demoBusinesses.filter((business) => !knownBusinessSlugs.has(business.slug)),
  ];
  const businessIds = liveBusinesses.map((business) => business.id);
  const website: WebsiteSettings = { ...defaultWebsiteSettings, ...((platform?.website as Partial<WebsiteSettings> | null) ?? {}) };
  const now = new Date().toISOString();

  const [catalogResult, offersResult, updatesResult, galleryResult, loanProductsResult, mobileMoneyServicesResult] = await Promise.all([
    website.show_products && businessIds.length
      ? supabase.from("enterprise_catalog").select("id,business_id,name,description,category,item_type,base_price,image_url,status").in("business_id", businessIds).ilike("status", "active").in("item_type", ["product", "Product", "service", "Service"]).order("created_at", { ascending: false }).limit(48)
      : Promise.resolve({ data: [], error: null }),
    website.show_promotions && businessIds.length
      ? supabase.from("business_promotions").select("id,business_id,title,description,discount_text,image_url,end_date,active,published,start_date").in("business_id", businessIds).eq("active", true).eq("published", true).or(`start_date.is.null,start_date.lte.${now}`).or(`end_date.is.null,end_date.gte.${now}`).order("created_at", { ascending: false }).limit(24)
      : Promise.resolve({ data: [], error: null }),
    businessIds.length
      ? supabase.from("business_posts").select("id,business_id,title,content,image_url,published_at,published").in("business_id", businessIds).eq("published", true).or(`published_at.is.null,published_at.lte.${now}`).order("published_at", { ascending: false }).limit(24)
      : Promise.resolve({ data: [], error: null }),
    businessIds.length
      ? supabase.from("business_gallery").select("id,business_id,image_url,title,caption,is_featured,active,display_order").in("business_id", businessIds).eq("active", true).order("display_order").order("created_at", { ascending: false }).limit(96)
      : Promise.resolve({ data: [], error: null }),
    website.show_products && liveBusinesses.some((business) => business.slug === "soft-loans")
      ? supabase.from("loan_products").select("id,name,description,min_amount,max_amount,interest_rate,repayment_period,requires_collateral,status").ilike("status", "active").order("created_at", { ascending: false }).limit(48)
      : Promise.resolve({ data: [], error: null }),
    website.show_products && liveBusinesses.some((business) => business.slug === "mobile-money")
      ? supabase.from("mobile_money_services").select("id,name,description,service_type,status").ilike("status", "active").order("name").limit(48)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (catalogResult.error) connectionIssues.push(`Published catalogue: ${catalogResult.error.message}`);
  if (offersResult.error) connectionIssues.push(`Published offers: ${offersResult.error.message}`);
  if (updatesResult.error) connectionIssues.push(`Published updates: ${updatesResult.error.message}`);
  if (galleryResult.error) connectionIssues.push(`Published gallery: ${galleryResult.error.message}`);
  if (loanProductsResult.error) connectionIssues.push(`Loan products: ${loanProductsResult.error.message}`);
  if (mobileMoneyServicesResult.error) connectionIssues.push(`Mobile money services: ${mobileMoneyServicesResult.error.message}`);

  const liveProducts: PublicCatalogItem[] = (catalogResult.data ?? []).map((item) => ({ ...item, is_demo: false }));
  const loansBusiness = liveBusinesses.find((business) => business.slug === "soft-loans");
  if (loansBusiness) liveProducts.push(...(loanProductsResult.data ?? []).map((item) => ({
    id: item.id, business_id: loansBusiness.id, name: item.name, description: item.description, category: "Loan product", item_type: "loan_product", base_price: null, image_url: null, is_demo: false,
    min_amount: item.min_amount, max_amount: item.max_amount, interest_rate: item.interest_rate, repayment_period: item.repayment_period, requires_collateral: item.requires_collateral,
  })));
  const moneyBusiness = liveBusinesses.find((business) => business.slug === "mobile-money");
  if (moneyBusiness) liveProducts.push(...(mobileMoneyServicesResult.data ?? []).map((item) => ({ id: item.id, business_id: moneyBusiness.id, name: item.name, description: item.description, category: item.service_type, item_type: "service", base_price: null, image_url: null, is_demo: false })));
  const liveOffers = (offersResult.data ?? []).map((offer) => ({ ...offer, is_demo: false }));
  const liveUpdates = (updatesResult.data ?? []).map((update) => ({ ...update, is_demo: false }));
  const liveGallery: PublicGalleryImage[] = (galleryResult.data ?? []).map((image) => ({ ...image, is_demo: false }));
  const businessIdForDemo = new Map(demoBusinesses.map((business) => [business.id, businesses.find((item) => item.slug === business.slug)?.id ?? business.id]));
  const demoItemBusinessId = (id: string) => businessIdForDemo.get(id) ?? id;
  const withDemoBusiness = <T extends { business_id: string }>(rows: T[]) => rows.map((row) => ({ ...row, business_id: demoItemBusinessId(row.business_id) }));
  const liveBusinessIdsWithoutContent = (rows: { business_id: string }[]) => new Set(liveBusinesses.map((business) => business.id).filter((id) => !rows.some((row) => row.business_id === id)));
  const displayBusinessIds = new Set(businesses.map((business) => business.id));
  const demoProductsForEmptyBusinesses = withDemoBusiness(demoProducts).filter((row) => liveBusinessIdsWithoutContent(liveProducts).has(row.business_id));
  const demoOffersForEmptyBusinesses = withDemoBusiness(demoOffers).filter((row) => liveBusinessIdsWithoutContent(liveOffers).has(row.business_id));
  const demoUpdatesForEmptyBusinesses = withDemoBusiness(demoUpdates).filter((row) => liveBusinessIdsWithoutContent(liveUpdates).has(row.business_id));

  return {
    website,
    company,
    businesses: website.show_businesses ? businesses : [],
    products: website.show_products ? [...liveProducts, ...demoProductsForEmptyBusinesses].filter((row) => displayBusinessIds.has(row.business_id)) : [],
    offers: website.show_promotions ? [...liveOffers, ...demoOffersForEmptyBusinesses].filter((row) => displayBusinessIds.has(row.business_id)) : [],
    updates: [...liveUpdates, ...demoUpdatesForEmptyBusinesses].filter((row) => displayBusinessIds.has(row.business_id)),
    gallery: liveGallery.filter((image) => displayBusinessIds.has(image.business_id)),
    connectionIssues,
  };
});
