import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const supabase = createAdminClient();

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