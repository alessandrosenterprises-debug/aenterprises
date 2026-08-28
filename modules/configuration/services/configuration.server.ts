import { createClient } from "@/lib/supabase/server";

/* ============================================================
   GET CONFIGURATION
   ============================================================ */

export async function getConfiguration(
  table: string
) {
  const supabase = await createClient();

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
      `Supabase loading configuration from ${table} error:`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      error.message ||
        error.details ||
        `Failed to load configuration from ${table}.`
    );
  }

  return data ?? [];
}

/* ============================================================
   CREATE CONFIGURATION
   Uses the server-side Supabase client so the authenticated
   user's session is available to RLS policies.
   ============================================================ */

export async function createConfiguration(
  table: string,
  values: Record<string, unknown>
) {
  console.warn(
    `createConfiguration("${table}") is using the legacy generic configuration API.`
  );

  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .insert(values)
    .select()
    .single();

  if (error) {
    console.error(
      `Supabase creating configuration in ${table} error:`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      error.message ||
        error.details ||
        `Failed to create configuration in ${table}.`
    );
  }

  return data;
}

/* ============================================================
   UPDATE CONFIGURATION
   ============================================================ */

export async function updateConfiguration(
  table: string,
  id: string,
  values: Record<string, unknown>
) {
  console.warn(
    `updateConfiguration("${table}") is using the legacy generic configuration API.`
  );

  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      `Supabase updating configuration in ${table} error:`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      error.message ||
        error.details ||
        `Failed to update configuration in ${table}.`
    );
  }

  return data;
}

/* ============================================================
   DELETE CONFIGURATION
   ============================================================ */

export async function deleteConfiguration(
  table: string,
  id: string
) {
  console.warn(
    `deleteConfiguration("${table}") is using the legacy generic configuration API.`
  );

  const supabase = await createClient();

  const {
    error,
  } = await supabase
    .from(table)
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      `Supabase deleting configuration in ${table} error:`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      error.message ||
        error.details ||
        `Failed to delete configuration in ${table}.`
    );
  }

  return true;
}