import { createClient } from "@/lib/supabase/server";

/* ============================================================
   GET CONFIGURATION
   ============================================================ */

export async function getConfiguration(
  table: string
): Promise<Record<string, unknown>[]> {
  const userSupabase = await createClient();

  const {
    data: userData,
    error: authError,
  } = await userSupabase.auth.getUser();

  if (authError) {
    console.error(
      "Configuration authentication error:",
      authError
    );

    throw new Error(
      "Unable to verify the authenticated user."
    );
  }

  if (!userData.user) {
    throw new Error(
      "You must be authenticated to load configuration."
    );
  }

  // Configuration data is also read through the signed-in session so any
  // role and business/branch RLS restrictions remain in force.
  const supabase = userSupabase;

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      `Failed to load configuration table "${table}":`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      error.message ||
        `Failed to load configuration from ${table}.`
    );
  }

  return (data ?? []) as Record<
    string,
    unknown
  >[];
}

export interface CategoryUsageCount {
  products: number;
  services: number;
}

export async function getActiveCategoryNames(): Promise<string[]> {
  const rows = await getConfiguration("categories");
  return rows
    .filter((row) => String(row.status ?? "Active").toLocaleLowerCase() === "active")
    .map((row) => String(row.name ?? "").trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

/** Return catalog usage keyed by a normalized category name. */
export async function getCategoryUsageCounts(): Promise<Map<string, CategoryUsageCount>> {
  const supabase = await createClient();
  const usage = new Map<string, CategoryUsageCount>();
  const pageSize = 1000;

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase
      .from("enterprise_catalog")
      .select("id, category, item_type")
      .order("id", { ascending: true })
      .range(start, start + pageSize - 1);

    if (error) {
      console.error("Failed to load category usage:", error.message);
      throw new Error("Unable to load category usage from the catalog.");
    }

    for (const item of data ?? []) {
      const key = String(item.category ?? "").trim().toLocaleLowerCase();
      if (!key) continue;
      const count = usage.get(key) ?? { products: 0, services: 0 };
      const itemType = String(item.item_type ?? "").trim().toLocaleLowerCase();
      if (itemType === "product" || !itemType) count.products += 1;
      else if (itemType === "service") count.services += 1;
      usage.set(key, count);
    }

    if (!data || data.length < pageSize) break;
  }
  return usage;
}
