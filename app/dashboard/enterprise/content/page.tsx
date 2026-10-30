import BusinessContentWorkspace, { type ManagedBusiness, type ManagedContentRecord, type ManagedContentSeed } from "@/modules/enterprise/components/BusinessContentWorkspace";
import { requireBusinessContentAdmin } from "@/modules/enterprise/services/business-content-admin.service";
import type { BusinessContentSection } from "./actions";

export const dynamic = "force-dynamic";

function normalizeCatalogRecord(record: Record<string, unknown>): ManagedContentRecord {
  return {
    ...record,
    id: String(record.id),
    business_id: String(record.business_id),
    name: String(record.name ?? ""),
    title: String(record.name ?? ""),
    category: String(record.category ?? ""),
    description: String(record.description ?? ""),
    content: String(record.description ?? ""),
    item_type: String(record.item_type ?? "product"),
    base_price: record.base_price == null ? "" : String(record.base_price),
    quantity: record.quantity == null ? "" : String(record.quantity),
    status: String(record.status ?? "active"),
    image_url: String(record.image_url ?? ""),
    source_table: "enterprise_catalog",
  };
}

export default async function BusinessContentAdminPage({ searchParams }: { searchParams: Promise<{ business?: string; section?: string }> }) {
  const requested = await searchParams;
  const supabase = await requireBusinessContentAdmin();
  const [businessResult, catalogResult, promotionResult, galleryResult, postResult, mobileServiceResult, loanProductResult] = await Promise.all([
    supabase.from("businesses").select("id,name,slug,description,logo_url").eq("active", true).order("name"),
    supabase.from("enterprise_catalog").select("*").order("created_at", { ascending: false }),
    supabase.from("business_promotions").select("*").order("created_at", { ascending: false }),
    supabase.from("business_gallery").select("*").order("display_order").order("created_at", { ascending: false }),
    supabase.from("business_posts").select("*").order("published_at", { ascending: false }),
    supabase.from("mobile_money_services").select("*").order("name"),
    supabase.from("loan_products").select("*").order("created_at", { ascending: false }),
  ]);

  // The business list is required to use this workspace. Individual content
  // sources are optional so a transient table/network failure doesn't crash
  // the entire Server Component render (and turn a successful save into #441).
  if (businessResult.error) throw new Error(`Could not load businesses: ${businessResult.error.message}`);

  const contentLoadErrors: Partial<Record<BusinessContentSection, string>> = {};
  if (catalogResult.error) {
    contentLoadErrors.services = "Some service records could not be refreshed.";
    contentLoadErrors.products = "Some product records could not be refreshed.";
  }
  if (promotionResult.error) contentLoadErrors.promotions = "Promotion records could not be refreshed.";
  if (galleryResult.error) contentLoadErrors.gallery = "Gallery records could not be refreshed.";
  if (postResult.error) contentLoadErrors.posts = "Post records could not be refreshed.";
  if (mobileServiceResult.error) contentLoadErrors.services = "Some service records could not be refreshed.";
  if (loanProductResult.error) contentLoadErrors.products = "Some product records could not be refreshed.";

  const businesses = (businessResult.data ?? []) as ManagedBusiness[];
  const seed: ManagedContentSeed = { services: {}, products: {}, promotions: {}, gallery: {}, posts: {} };
  const businessBySlug = new Map(businesses.map((business) => [business.slug, business]));

  for (const business of businesses) {
    seed.services[business.id] = [];
    seed.products[business.id] = [];
    seed.promotions[business.id] = [];
    seed.gallery[business.id] = [];
    seed.posts[business.id] = [];
  }

  for (const record of (catalogResult.data ?? []) as Record<string, unknown>[]) {
    const businessId = String(record.business_id ?? "");
    const business = businesses.find((entry) => entry.id === businessId);
    if (!business) continue;
    const itemType = String(record.item_type ?? "").toLowerCase();
    const section = itemType === "service" ? "services" : itemType === "product" || (business.slug === "elite-fashion" && !itemType) ? "products" : null;
    if (section) seed[section][businessId].push(normalizeCatalogRecord(record));
  }

  const mobileMoneyBusiness = businessBySlug.get("mobile-money");
  if (mobileMoneyBusiness) {
    for (const record of (mobileServiceResult.data ?? []) as Record<string, unknown>[]) {
      seed.services[mobileMoneyBusiness.id].push({
        ...record,
        id: String(record.id),
        business_id: mobileMoneyBusiness.id,
        name: String(record.name ?? ""),
        title: String(record.name ?? ""),
        category: String(record.service_type ?? ""),
        description: String(record.description ?? ""),
        item_type: "service",
        status: String(record.status ?? "Active"),
        image_url: "",
        source_table: "mobile_money_services",
      });
    }
  }

  const softLoansBusiness = businessBySlug.get("soft-loans");
  if (softLoansBusiness) {
    for (const record of (loanProductResult.data ?? []) as Record<string, unknown>[]) {
      seed.products[softLoansBusiness.id].push({
        ...record,
        id: String(record.id),
        business_id: softLoansBusiness.id,
        name: String(record.name ?? ""),
        title: String(record.name ?? ""),
        category: "Loan Product",
        item_type: "loan_product",
        status: String(record.status ?? "Active"),
        image_url: "",
        source_table: "loan_products",
      });
    }
  }

  for (const record of (promotionResult.data ?? []) as Record<string, unknown>[]) {
    const key = String(record.business_id ?? "");
    if (seed.promotions[key]) seed.promotions[key].push(record as ManagedContentRecord);
  }
  for (const record of (galleryResult.data ?? []) as Record<string, unknown>[]) {
    const key = String(record.business_id ?? "");
    if (seed.gallery[key]) seed.gallery[key].push(record as ManagedContentRecord);
  }
  for (const record of (postResult.data ?? []) as Record<string, unknown>[]) {
    const key = String(record.business_id ?? "");
    if (seed.posts[key]) seed.posts[key].push(record as ManagedContentRecord);
  }

  const requestedBusinessId = businesses.find((business) => business.slug === requested.business)?.id;
  const availableSections: BusinessContentSection[] = ["services", "products", "promotions", "gallery", "posts"];
  const requestedSection = availableSections.includes(requested.section as BusinessContentSection) ? requested.section as BusinessContentSection : undefined;
  return <BusinessContentWorkspace businesses={businesses} initialContent={seed} initialBusinessId={requestedBusinessId} initialSection={requestedSection} contentLoadErrors={contentLoadErrors} />;
}
