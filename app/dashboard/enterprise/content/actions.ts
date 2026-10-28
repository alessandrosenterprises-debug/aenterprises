"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContentAdmin } from "@/modules/enterprise/services/business-content-admin.service";
import { enqueueFacebookContent } from "@/modules/website/services/facebook-publisher.server";

export type BusinessContentSection = "services" | "products" | "promotions" | "gallery" | "posts";

type SaveBusinessContentInput = {
  section: BusinessContentSection;
  businessId: string;
  id?: string;
  sourceTable?: string;
  values: Record<string, unknown>;
};

const tableBySection = {
  services: "enterprise_catalog",
  products: "enterprise_catalog",
  promotions: "business_promotions",
  gallery: "business_gallery",
  posts: "business_posts",
} as const;

const validSections = new Set<BusinessContentSection>([
  "services",
  "products",
  "promotions",
  "gallery",
  "posts",
]);

function text(values: Record<string, unknown>, key: string) {
  const value = values[key];
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(values: Record<string, unknown>, key: string) {
  return text(values, key) || null;
}

function nullableNumber(values: Record<string, unknown>, key: string) {
  const value = text(values, key);
  if (!value) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${key} must be a valid non-negative number.`);
  return number;
}

function booleanValue(values: Record<string, unknown>, key: string, fallback: boolean) {
  const value = values[key];
  return typeof value === "boolean" ? value : fallback;
}

function nullableDate(values: Record<string, unknown>, key: string) {
  const value = text(values, key);
  if (!value) return null;
  // HTML datetime-local inputs carry no timezone. AEOS operates in Lusaka,
  // so interpret those wall-clock values as Africa/Lusaka (UTC+02:00).
  const localDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value);
  const date = new Date(localDateTime ? `${value.length === 16 ? `${value}:00` : value}+02:00` : value);
  if (Number.isNaN(date.getTime())) throw new Error(`${key} must be a valid date.`);
  return date.toISOString();
}

function buildValues(section: BusinessContentSection, values: Record<string, unknown>, businessId: string, businessSlug: string) {
  if (section === "services" || section === "products") {
    const name = text(values, "name");
    if (!name) throw new Error("Enter a name before saving.");
    if (section === "services" && businessSlug === "mobile-money") {
      return {
        name,
        service_type: text(values, "category") || "cash_in",
        description: nullableText(values, "description"),
        status: text(values, "status").toLowerCase() === "inactive" ? "Inactive" : "Active",
        facebook_auto_publish: booleanValue(values, "publish_to_facebook", true),
        facebook_publish_at: nullableDate(values, "facebook_schedule_at"),
      };
    }
    if (section === "products" && businessSlug === "soft-loans") {
      return {
        name,
        description: nullableText(values, "description"),
        min_amount: nullableNumber(values, "min_amount"),
        max_amount: nullableNumber(values, "max_amount"),
        interest_rate: nullableNumber(values, "interest_rate"),
        repayment_period: nullableNumber(values, "repayment_period"),
        requires_collateral: booleanValue(values, "requires_collateral", false),
        status: text(values, "status").toLowerCase() === "inactive" ? "Inactive" : "Active",
        facebook_auto_publish: booleanValue(values, "publish_to_facebook", true),
        facebook_publish_at: nullableDate(values, "facebook_schedule_at"),
      };
    }
    return {
      business_id: businessId,
      item_type: section === "services" ? "service" : "product",
      name,
      category: nullableText(values, "category"),
      description: nullableText(values, "description"),
      base_price: nullableNumber(values, "base_price"),
      quantity: section === "products" ? nullableNumber(values, "quantity") : null,
      status: text(values, "status").toLowerCase() === "inactive" ? "inactive" : "active",
      image_url: nullableText(values, "image_url"),
      facebook_auto_publish: booleanValue(values, "publish_to_facebook", true),
      facebook_publish_at: nullableDate(values, "facebook_schedule_at"),
    };
  }

  if (section === "promotions") {
    const title = text(values, "title");
    if (!title) throw new Error("Enter a title before saving.");
    return {
      business_id: businessId,
      title,
      description: nullableText(values, "description"),
      image_url: nullableText(values, "image_url"),
      discount_text: nullableText(values, "discount_text"),
      price: nullableNumber(values, "price"),
      start_date: nullableDate(values, "start_date"),
      end_date: nullableDate(values, "end_date"),
      active: booleanValue(values, "active", true),
      published: booleanValue(values, "published", true),
      featured: booleanValue(values, "featured", false),
      facebook_auto_publish: booleanValue(values, "publish_to_facebook", true),
      facebook_publish_at: nullableDate(values, "facebook_schedule_at"),
    };
  }

  if (section === "gallery") {
    const imageUrl = text(values, "image_url");
    if (!imageUrl) throw new Error("Add an image URL before saving this gallery item.");
    return {
      business_id: businessId,
      image_url: imageUrl,
      title: nullableText(values, "title"),
      caption: nullableText(values, "caption"),
      active: booleanValue(values, "active", true),
      is_featured: booleanValue(values, "is_featured", false),
      display_order: nullableNumber(values, "display_order") ?? 0,
    };
  }

  const title = text(values, "title");
  if (!title) throw new Error("Enter a title before saving.");
  return {
    business_id: businessId,
    title,
    content: nullableText(values, "content"),
    image_url: nullableText(values, "image_url"),
    post_type: text(values, "post_type") || "update",
    published: booleanValue(values, "published", true),
    featured: booleanValue(values, "featured", false),
    published_at: nullableDate(values, "published_at") ?? new Date().toISOString(),
    facebook_auto_publish: booleanValue(values, "publish_to_facebook", true),
    facebook_publish_at: nullableDate(values, "facebook_schedule_at"),
  };
}

async function getAuthorizedBusiness(businessId: string) {
  const supabase = await requireBusinessContentAdmin();
  const { data: business, error } = await supabase.from("businesses")
    .select("id, slug, name").eq("id", businessId).eq("active", true).maybeSingle();
  if (error || !business) throw new Error("The selected active business could not be found.");
  return { supabase, business };
}

export async function saveBusinessContentAction(input: SaveBusinessContentInput) {
  if (!validSections.has(input.section) || !input.businessId) throw new Error("Choose a valid business content section.");
  const { supabase, business } = await getAuthorizedBusiness(input.businessId);
  const values = buildValues(input.section, input.values, input.businessId, input.sourceTable === "enterprise_catalog" ? "generic" : business.slug);
  const table = input.sourceTable === "enterprise_catalog"
    ? "enterprise_catalog"
    : input.section === "services" && business.slug === "mobile-money"
      ? "mobile_money_services"
      : input.section === "products" && business.slug === "soft-loans"
        ? "loan_products"
        : tableBySection[input.section];
  const isBusinessScopedTable = table !== "mobile_money_services" && table !== "loan_products";

  let result;
  if (input.id) {
    let query = supabase.from(table).update(values).eq("id", input.id);
    if (isBusinessScopedTable) query = query.eq("business_id", input.businessId);
    result = await query.select("*").maybeSingle();
  } else {
    // The table name is selected dynamically from the content section, so the
    // generated Supabase client cannot correlate this row union with one table.
    result = await supabase.from(table).insert(values as never).select("*").single();
  }
  if (result.error) throw new Error(result.error.message || "Could not save business content.");
  if (!result.data) throw new Error("No matching content item was updated. Refresh and try again.");

  let facebookPublishing: { status: string; scheduledAt?: string; error?: string; duplicate?: boolean } | null = null;
  const shouldPublishToFacebook = savedFacebookAutoPublish(result.data as Record<string, unknown>, input.values);
  const eligibleSection = input.section === "products" || input.section === "services" || input.section === "promotions" || input.section === "posts";
  const saved = result.data as Record<string, unknown>;
  const isPubliclyEligible = input.section === "promotions"
    ? Boolean(saved.active && saved.published && (!saved.end_date || new Date(String(saved.end_date)).getTime() > Date.now()))
    : input.section === "posts"
      ? Boolean(saved.published)
      : String(saved.status ?? "active").toLowerCase() !== "inactive";
  if (shouldPublishToFacebook && eligibleSection && isPubliclyEligible) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const contentType = input.section === "posts" ? "announcement" : input.section === "promotions" ? "promotion" : input.section === "services" ? "service" : "product";
      const title = String(saved.title ?? saved.name ?? "").trim();
      const description = String(saved.description ?? saved.content ?? "").trim();
      const label = input.section === "promotions"
        ? String(saved.discount_text ?? "").trim()
        : input.section === "products" || input.section === "services"
          ? String(saved.category ?? saved.service_type ?? "").trim()
          : "";
      const requestedSchedule = typeof saved.facebook_publish_at === "string" ? saved.facebook_publish_at : "";
      const naturalSchedule = input.section === "promotions" ? saved.start_date : input.section === "posts" ? saved.published_at : null;
      const naturalScheduleDate = naturalSchedule ? new Date(String(naturalSchedule)) : null;
      const futureNaturalSchedule = naturalScheduleDate && Number.isFinite(naturalScheduleDate.getTime()) && naturalScheduleDate.getTime() > Date.now() ? naturalScheduleDate.toISOString() : null;
      const scheduledAt = requestedSchedule ? new Date(requestedSchedule).toISOString() : futureNaturalSchedule;
      const queued = await enqueueFacebookContent({
        contentType,
        contentId: String(saved.id),
        businessId: input.businessId,
        businessName: business.name,
        businessSlug: business.slug,
        title,
        description,
        label,
        imageUrl: typeof saved.image_url === "string" ? saved.image_url : null,
        scheduledAt,
        createdByAuthUserId: user?.id,
      });
      facebookPublishing = { status: String(queued.status), scheduledAt: String(queued.scheduled_at), duplicate: queued.duplicate === true, error: typeof queued.last_error === "string" ? queued.last_error : undefined };
    } catch (caught) {
      // Website content remains saved if Meta or the optional migration is
      // unavailable. The dashboard makes the publishing setup issue visible.
      facebookPublishing = { status: "queue_error", error: caught instanceof Error ? caught.message : "Could not queue this update for Facebook." };
    }
  }

  revalidatePath("/dashboard/enterprise/content");
  revalidatePath("/dashboard/website");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/businesses");
  revalidatePath("/products");
  revalidatePath("/offers");
  revalidatePath("/contact");
  revalidatePath(`/businesses/${business.slug}`);
  revalidatePath(`/dashboard/enterprise/${business.slug}`);
  revalidatePath("/customer");
  revalidatePath(`/customer/businesses/${business.slug}`);
  revalidatePath(`/customer/businesses/${business.slug}/promotions`);
  revalidatePath(`/customer/businesses/${business.slug}/gallery`);
  revalidatePath(`/customer/businesses/${business.slug}/updates`);
  revalidatePath(`/customer/businesses/${business.slug}/services`);
  revalidatePath(`/customer/businesses/${business.slug}/products`);
  revalidatePath("/customer/services");
  revalidatePath("/customer/bookings/new");
  revalidatePath("/customer/orders/new");
  return { ...saved, source_table: table, facebook_publishing: facebookPublishing };
}

function savedFacebookAutoPublish(saved: Record<string, unknown>, inputValues: Record<string, unknown>) {
  return typeof saved.facebook_auto_publish === "boolean"
    ? saved.facebook_auto_publish
    : inputValues.publish_to_facebook !== false;
}

export async function deleteBusinessContentAction(input: { section: BusinessContentSection; businessId: string; id: string; sourceTable?: string }) {
  if (!validSections.has(input.section) || !input.businessId || !input.id) throw new Error("Choose a valid content item.");
  const { supabase, business } = await getAuthorizedBusiness(input.businessId);
  const table = input.sourceTable === "enterprise_catalog"
    ? "enterprise_catalog"
    : input.section === "services" && business.slug === "mobile-money"
      ? "mobile_money_services"
      : input.section === "products" && business.slug === "soft-loans"
        ? "loan_products"
        : tableBySection[input.section];
  let query = supabase.from(table).delete({ count: "exact" }).eq("id", input.id);
  if (table !== "mobile_money_services" && table !== "loan_products") query = query.eq("business_id", input.businessId);
  const { error, count } = await query;
  if (error) throw new Error(error.message || "Could not delete business content.");
  if (count === 0) throw new Error("This content item was not found. Refresh and try again.");
  revalidatePath("/dashboard/enterprise/content");
  revalidatePath("/dashboard/website");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/businesses");
  revalidatePath("/products");
  revalidatePath("/offers");
  revalidatePath("/contact");
  revalidatePath(`/businesses/${business.slug}`);
  revalidatePath(`/dashboard/enterprise/${business.slug}`);
  revalidatePath("/customer");
  revalidatePath(`/customer/businesses/${business.slug}`);
  revalidatePath(`/customer/businesses/${business.slug}/promotions`);
  revalidatePath(`/customer/businesses/${business.slug}/gallery`);
  revalidatePath(`/customer/businesses/${business.slug}/updates`);
  revalidatePath(`/customer/businesses/${business.slug}/services`);
  revalidatePath(`/customer/businesses/${business.slug}/products`);
  revalidatePath("/customer/services");
  revalidatePath("/customer/bookings/new");
  revalidatePath("/customer/orders/new");
  return true;
}
