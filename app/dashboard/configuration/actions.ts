"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient as createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/* ============================================================
SUPABASE ADMIN CLIENT
---------------------------------------------------------------

IMPORTANT:
This key must ONLY exist on the server.
Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
============================================================ */

function createAdminClient() {
  return createSupabaseAdminClient();
}

async function logConfigurationActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: string,
  table: string,
  recordId: string | null,
) {
  const { error } = await supabase.rpc("log_enterprise_activity", {
    p_action: action,
    p_resource: table,
    p_resource_id: recordId,
    p_summary: `${action} ${table.replaceAll("_", " ")}${recordId ? ` record ${recordId}` : ""}`,
    p_metadata: {},
  });
  if (error) console.error("Unable to record configuration activity:", error.message);
}

async function ensureCategoryNameIsUnique(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nameValue: unknown,
  excludedId?: string,
) {
  const name = String(nameValue ?? "").trim();
  if (!name) throw new Error("Category name is required.");

  const { data, error } = await supabase
    .from("categories")
    .select("id, name");
  if (error) throwActionError("check category name for", "categories", error);

  const duplicate = (data ?? []).some((category) =>
    category.id !== excludedId &&
    String(category.name ?? "").trim().toLocaleLowerCase() === name.toLocaleLowerCase()
  );
  if (duplicate) {
    throw new Error(`A category named “${name}” already exists. Choose a unique name.`);
  }
}

async function validateLoanProductTerm(
  supabase: Awaited<ReturnType<typeof createClient>>,
  values: Record<string, unknown>,
  excludedId?: string,
) {
  const productId = String(values.loan_product_id ?? "").trim();
  const periodDays = Number(values.period_days);
  const interestRate = Number(values.interest_rate);
  if (!productId) throw new Error("Choose the loan product for this term.");
  if (!Number.isInteger(periodDays) || periodDays < 1) throw new Error("Repayment period must be a whole number of at least one day.");
  if (!Number.isFinite(interestRate) || interestRate < 0) throw new Error("Interest rate must be zero or greater.");

  const { data, error } = await supabase
    .from("loan_product_terms")
    .select("id")
    .eq("loan_product_id", productId)
    .eq("period_days", periodDays);
  if (error) throwActionError("check duplicate repayment term for", "loan_product_terms", error);
  if ((data ?? []).some((term) => term.id !== excludedId)) {
    throw new Error("That loan product already has a term with this repayment period.");
  }
}

async function validateLoanProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  values: Record<string, unknown>,
  excludedId?: string,
) {
  const name = String(values.name ?? "").trim();
  if (!name) throw new Error("Enter a loan product name.");
  if (name.length > 120) throw new Error("Loan product names must be 120 characters or fewer.");
  const status = String(values.status ?? "Inactive");
  if (status !== "Active" && status !== "Inactive") throw new Error("Choose Active or Inactive for the product status.");

  const minAmount = values.min_amount === "" || values.min_amount == null ? null : Number(values.min_amount);
  const maxAmount = values.max_amount === "" || values.max_amount == null ? null : Number(values.max_amount);
  if (minAmount !== null && (!Number.isFinite(minAmount) || minAmount < 0)) {
    throw new Error("Minimum loan amount must be zero or greater.");
  }
  if (maxAmount !== null && (!Number.isFinite(maxAmount) || maxAmount < 0)) {
    throw new Error("Maximum loan amount must be zero or greater.");
  }
  if (minAmount !== null && maxAmount !== null && maxAmount < minAmount) {
    throw new Error("Maximum loan amount cannot be less than the minimum amount.");
  }

  const { data, error } = await supabase.from("loan_products").select("id, name");
  if (error) throwActionError("check loan product names in", "loan_products", error);
  if ((data ?? []).some((product) =>
    product.id !== excludedId && String(product.name ?? "").trim().toLocaleLowerCase() === name.toLocaleLowerCase()
  )) {
    throw new Error(`A loan product named “${name}” already exists.`);
  }
}

async function ensureLoanProductHasActiveTerms(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
) {
  const { count, error } = await supabase
    .from("loan_product_terms")
    .select("id", { count: "exact", head: true })
    .eq("loan_product_id", productId)
    .eq("active", true);
  if (error) throwActionError("check active repayment terms in", "loan_product_terms", error);
  if (!count) throw new Error("Add and activate at least one repayment term for this product before offering it to customers.");
}

/* ============================================================
ERROR HELPERS
============================================================ */

function getErrorDetails(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const details =
      error as Record<string, unknown>;

    return {
      message: details.message,
      details: details.details,
      hint: details.hint,
      code: details.code,
    };
  }

  return {
    message:
      error instanceof Error
        ? error.message
        : String(error),
    details: undefined,
    hint: undefined,
    code: undefined,
  };
}

function throwActionError(
  operation: string,
  table: string,
  error: unknown
): never {
  const details =
    getErrorDetails(error);

  console.error(
    `Configuration ${operation} failed for ${table}:`,
    details
  );

  throw new Error(
    typeof details.message === "string" &&
      details.message.length > 0
      ? details.message
      : `Failed to ${operation} ${table}.`
  );
}

/* ============================================================
VERIFY AUTHENTICATED CONFIGURATION ADMIN
============================================================ */

async function requireConfigurationAdmin() {
  /*
   * This client uses the user's normal authenticated
   * Supabase session.
   */
  const supabase = await createClient();

  /*
   * Get the authenticated Supabase user.
   */
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(
      "Configuration auth user error:",
      getErrorDetails(userError)
    );

    throw new Error(
      "Unable to verify the authenticated user."
    );
  }

  const user = userData.user;

  if (!user) {
    throw new Error(
      "You are not authenticated. Please sign in again."
    );
  }

  /*
   * Get the active profile and role.
   */
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      auth_user_id,
      active,
      role_id,
      roles (
        id,
        name
      )
    `)
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Configuration profile lookup error:",
      getErrorDetails(profileError)
    );

    throw new Error(
      "Unable to verify your configuration permissions."
    );
  }

  if (!profile) {
    throw new Error(
      "No active administrator profile was found for your account."
    );
  }

  const role = Array.isArray(profile.roles)
    ? profile.roles[0]
    : profile.roles;

  const roleName =
    role &&
    typeof role === "object" &&
    "name" in role
      ? String(role.name)
      : "";

  const isConfigurationAdmin =
    roleName === "Super Administrator" ||
    roleName === "Enterprise Manager";

  if (!isConfigurationAdmin) {
    throw new Error(
      `Your account does not have configuration administrator permission. Current role: ${
        roleName || "Unknown"
      }.`
    );
  }

  return {
    supabase,
    user,
    profile,
    roleName,
  };
}

/* ============================================================
CREATE
============================================================ */

export async function createConfigurationAction(
  table: string,
  values: Record<string, unknown>
) {
  /*
   * FIRST:
   * Verify the real logged-in user.
   */
  const {
    supabase,
    user,
    roleName,
  } = await requireConfigurationAdmin();

  if (table === "roles") {
    const roleName = String(values.name ?? "").trim();
    if (["Super Administrator", "Enterprise Manager"].includes(roleName)) {
      throw new Error("This is a protected system role name.");
    }
  }

  console.log(
    "Configuration create authorization:",
    {
      table,
      userId: user.id,
      roleName,
    }
  );

  // Keep business writes on the authenticated client so the
  // database's configuration-admin RLS policy remains authoritative.
  // Generate the required business slug because the form intentionally
  // asks only for the business name.
  const insertValues = { ...values };
  if (table === "loan_products") {
    insertValues.name = String(insertValues.name ?? "").trim();
    await validateLoanProduct(supabase, insertValues);
    if (String(insertValues.status ?? "Inactive") === "Active") {
      throw new Error("Create the product as inactive, add and activate its repayment terms, then activate the product.");
    }
  }
  if (table === "categories") {
    insertValues.name = String(insertValues.name ?? "").trim();
    await ensureCategoryNameIsUnique(supabase, insertValues.name);
  }
  if (table === "loan_product_terms") {
    await validateLoanProductTerm(supabase, insertValues);
  }
  if (table === "businesses") {
    const name = String(insertValues.name ?? "").trim();
    if (!name) throw new Error("Business name is required.");

    const baseSlug = name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "business";

    const { data: existingBusinesses, error: slugLookupError } = await supabase
      .from("businesses")
      .select("slug")
      .like("slug", `${baseSlug}%`);

    if (slugLookupError) {
      throwActionError("check business slug for", table, slugLookupError);
    }

    const existingSlugs = new Set(
      (existingBusinesses ?? []).map((business) => business.slug as string)
    );
    let slug = baseSlug;
    let suffix = 2;
    while (existingSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
    insertValues.slug = slug;
  }

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .insert(insertValues)
    .select()
    .single();

  if (error) {
    throwActionError(
      "create",
      table,
      error
    );
  }

  if (table === "branches") {
    revalidatePath("/dashboard/configuration/branches");
  }

  await logConfigurationActivity(supabase, "create", table, String(data.id ?? ""));

  return data;
}

const STARTER_LOAN_PRODUCT_NAMES = [
  "Personal Loan",
  "Business Loan",
  "Salary Advance",
  "Emergency Loan",
  "Education Loan",
  "Agriculture Loan",
  "Asset Finance",
  "Group Loan",
  "SME Working Capital",
] as const;

const STARTER_TERM_DAYS = [7, 14, 30, 60, 90, 180] as const;

/** Add editable, inactive starter products and repayment schedules. */
export async function addStarterLoanProductsAction() {
  const { supabase, user, roleName } = await requireConfigurationAdmin();
  const { data: existingProducts, error: productLookupError } = await supabase
    .from("loan_products")
    .select("id, name");
  if (productLookupError) throwActionError("read starter products from", "loan_products", productLookupError);

  const existingByName = new Map(
    (existingProducts ?? []).map((product) => [String(product.name).trim().toLocaleLowerCase(), product.id as string]),
  );
  let productsAdded = 0;
  let termsAdded = 0;
  const productIds = new Map<string, string>();
  const issues: string[] = [];

  // Create every product before touching the separate terms table. This
  // means a terms-table issue can never leave only the first product behind.
  for (const name of STARTER_LOAN_PRODUCT_NAMES) {
    let productId = existingByName.get(name.toLowerCase());
    if (!productId) {
      const { data: product, error } = await supabase
        .from("loan_products")
        .insert({
          name,
          description: "Draft loan product. Set eligibility, collateral and terms before activation.",
          min_amount: null,
          max_amount: null,
          interest_rate: null,
          repayment_period: null,
          requires_collateral: false,
          status: "Inactive",
        })
        .select("id")
        .single();
      if (error) {
        issues.push(`${name}: ${error.message}`);
        continue;
      }
      if (!product?.id) {
        issues.push(`${name}: no record was returned after creation.`);
        continue;
      }
      productId = product.id;
      productsAdded += 1;
      await logConfigurationActivity(supabase, "create", "loan_products", product.id);
    }

    if (productId) productIds.set(name, productId);
  }

  // Prepare each product's terms independently. A failure is reported while
  // the remaining loan types continue to be populated.
  for (const name of STARTER_LOAN_PRODUCT_NAMES) {
    const productId = productIds.get(name);
    if (!productId) continue;
    const { data: existingTerms, error: termLookupError } = await supabase
      .from("loan_product_terms")
      .select("period_days")
      .eq("loan_product_id", productId);
    if (termLookupError) {
      issues.push(`${name} terms: ${termLookupError.message}`);
      continue;
    }
    const existingDays = new Set((existingTerms ?? []).map((term) => Number(term.period_days)));
    const newTerms = STARTER_TERM_DAYS
      .filter((periodDays) => !existingDays.has(periodDays))
      .map((period_days) => ({
        loan_product_id: productId,
        period_days,
        interest_rate: 0,
        active: false,
      }));

    if (newTerms.length) {
      const { data: insertedTerms, error } = await supabase
        .from("loan_product_terms")
        .insert(newTerms)
        .select("id");
      if (error) {
        issues.push(`${name} terms: ${error.message}`);
        continue;
      }
      termsAdded += insertedTerms?.length ?? newTerms.length;
      for (const term of insertedTerms ?? []) {
        await logConfigurationActivity(supabase, "create", "loan_product_terms", term.id);
      }
    }
  }

  console.info("Starter loan templates added", { userId: user.id, roleName, productsAdded, termsAdded });
  revalidatePath("/dashboard/configuration/loan-products");
  revalidatePath("/dashboard/configuration/loan-terms");
  revalidatePath("/dashboard/loans");
  return { productsAdded, termsAdded, issues };
}

/* ============================================================
UPDATE
============================================================ */

export async function updateConfigurationAction(
  table: string,
  id: string,
  values: Record<string, unknown>
) {
  /*
   * Verify the authenticated configuration administrator first.
   */
  const {
    supabase,
    user,
    roleName,
  } = await requireConfigurationAdmin();

  if (table === "roles") {
    const { data: existingRole, error: roleLookupError } = await supabase
      .from("roles")
      .select("name")
      .eq("id", id)
      .maybeSingle();
    if (roleLookupError) throwActionError("read", table, roleLookupError);
    if (["Super Administrator", "Enterprise Manager"].includes(existingRole?.name ?? "")) {
      throw new Error("This system role is protected and cannot be edited here.");
    }
    if (["Super Administrator", "Enterprise Manager"].includes(String(values.name ?? "").trim())) {
      throw new Error("This is a protected system role name.");
    }
  }

  if (table === "categories") {
    const name = String(values.name ?? "").trim();
    await ensureCategoryNameIsUnique(supabase, name, id);
    values = { ...values, name };
  }
  if (table === "loan_products") {
    values = { ...values, name: String(values.name ?? "").trim() };
    await validateLoanProduct(supabase, values, id);
    if (String(values.status ?? "") === "Active") {
      const { data: currentProduct, error: currentProductError } = await supabase
        .from("loan_products")
        .select("status")
        .eq("id", id)
        .maybeSingle();
      if (currentProductError) throwActionError("read", table, currentProductError);
      if (currentProduct?.status !== "Active") {
        await ensureLoanProductHasActiveTerms(supabase, id);
      }
    }
  }
  if (table === "loan_product_terms") {
    await validateLoanProductTerm(supabase, values, id);
  }

  console.log(
    "Configuration update authorization:",
    {
      table,
      id,
      userId: user.id,
      roleName,
    }
  );

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .update(values)
    .eq("id", id)
    .select("id");

  if (error) {
    throwActionError(
      "update",
      table,
      error
    );
  }

  const updatedIds = data ?? [];

  if (updatedIds.length === 0) {
    throw new Error(
      `No ${table} record was updated. Refresh the page and try again.`
    );
  }

  if (updatedIds.length > 1) {
    throw new Error(
      `More than one ${table} record matched this update. No single record can be returned safely.`
    );
  }

  await logConfigurationActivity(supabase, "update", table, String(updatedIds[0].id));

  return { id: updatedIds[0].id };
}

/* ============================================================
DELETE
============================================================ */

export async function deleteConfigurationAction(
  table: string,
  id: string
) {
  /*
   * Verify the authenticated configuration administrator first.
   */
  const {
    supabase,
    user,
    roleName,
  } = await requireConfigurationAdmin();

  if (table === "loan_products") {
    const { count, error: loanCountError } = await supabase
      .from("customer_loan_applications")
      .select("id", { count: "exact", head: true })
      .eq("loan_product_id", id);
    if (loanCountError) throwActionError("check application history for", table, loanCountError);
    if ((count ?? 0) > 0) {
      throw new Error("This loan product has application history and cannot be deleted. Set it to Inactive to preserve customer records.");
    }
  }

  if (table === "roles") {
    const { data: existingRole, error: roleLookupError } = await supabase
      .from("roles")
      .select("name")
      .eq("id", id)
      .maybeSingle();
    if (roleLookupError) throwActionError("read", table, roleLookupError);
    if (["Super Administrator", "Enterprise Manager"].includes(existingRole?.name ?? "")) {
      throw new Error("This system role is protected and cannot be deleted.");
    }
  }

  if (table === "categories") {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("name")
      .eq("id", id)
      .maybeSingle();
    if (categoryError) throwActionError("read", table, categoryError);
    if (!category) throw new Error("This category no longer exists. Refresh and try again.");

    const categoryName = String(category.name ?? "").trim();
    const { count: usageCount, error: usageError } = await supabase
      .from("enterprise_catalog")
      .select("id", { count: "exact", head: true })
      .ilike("category", categoryName);
    if (usageError) throwActionError("check catalog usage for", table, usageError);
    if ((usageCount ?? 0) > 0) {
      throw new Error("This category is used by catalog items. Set it to Inactive instead of deleting it.");
    }
  }

  console.log(
    "Configuration delete authorization:",
    {
      table,
      id,
      userId: user.id,
      roleName,
    }
  );

  const {
    error,
  } = await supabase
    .from(table)
    .delete()
    .eq("id", id);

  if (error) {
    throwActionError(
      "delete",
      table,
      error
    );
  }

  await logConfigurationActivity(supabase, "delete", table, id);

  return true;
}

/* ============================================================
SAVE COMPANY SETTINGS
---------------------------------------------------------------

Company Settings is a singleton configuration record.

The Customer App support contacts are stored here so that:

AEOS Admin
    ↓
company_settings
    ↓
Customer App

The client component calls this Server Action instead of
importing the server-only configuration service directly.
============================================================ */

export async function saveCompanySettingsAction(
  values: Record<string, unknown>
) {
  /*
   * Verify the authenticated configuration administrator.
   */
  const {
    supabase,
    user,
    roleName,
  } = await requireConfigurationAdmin();

  console.log(
    "Company settings save authorization:",
    {
      userId: user.id,
      roleName,
    }
  );

  /*
   * Server-only admin client.
   */
  const supabaseAdmin =
    createAdminClient();

  /*
   * The company_settings table uses the singleton_key
   * "default" to identify the enterprise-wide settings row.
   */
  const {
    data: existingSettings,
    error: existingError,
  } = await supabaseAdmin
    .from("company_settings")
    .select("id")
    .eq("singleton_key", "default")
    .maybeSingle();

  if (existingError) {
    throwActionError(
      "read",
      "company_settings",
      existingError
    );
  }

  const settingsValues = {
    ...values,
    singleton_key: "default",
    updated_at: new Date().toISOString(),
  };

  /*
   * Update the existing singleton row.
   */
  if (existingSettings?.id) {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("company_settings")
      .update(settingsValues)
      .eq("id", existingSettings.id)
      .select()
      .single();

    if (error) {
      throwActionError(
        "update",
        "company_settings",
        error
      );
    }

    await logConfigurationActivity(supabase, "update", "company_settings", String(data.id));

    return data;
  }

  /*
   * Create the singleton row if it does not exist.
   */
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("company_settings")
    .insert(settingsValues)
    .select()
    .single();

  if (error) {
    throwActionError(
      "create",
      "company_settings",
      error
    );
  }

  await logConfigurationActivity(supabase, "create", "company_settings", String(data.id));

  return data;
}
