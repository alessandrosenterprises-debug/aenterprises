"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

/* ============================================================
   SUPABASE ADMIN CLIENT
   ------------------------------------------------------------
   IMPORTANT:
   This key must ONLY exist on the server.
   Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
   ============================================================ */

function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured."
    );
  }

  return createSupabaseAdminClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
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
    user,
    roleName,
  } = await requireConfigurationAdmin();

  console.log(
    "Configuration create authorization:",
    {
      table,
      userId: user.id,
      roleName,
    }
  );

  /*
   * SECOND:
   * Use the server-only admin client for the database write.
   *
   * This bypasses table RLS because authorization has already
   * been explicitly checked above.
   */
  const supabaseAdmin =
    createAdminClient();

  const {
    data,
    error,
  } = await supabaseAdmin
    .from(table)
    .insert(values)
    .select()
    .single();

  if (error) {
    throwActionError(
      "create",
      table,
      error
    );
  }

  return data;
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
    user,
    roleName,
  } = await requireConfigurationAdmin();

  console.log(
    "Configuration update authorization:",
    {
      table,
      id,
      userId: user.id,
      roleName,
    }
  );

  /*
   * Server-only admin client.
   */
  const supabaseAdmin =
    createAdminClient();

  const {
    data,
    error,
  } = await supabaseAdmin
    .from(table)
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throwActionError(
      "update",
      table,
      error
    );
  }

  return data;
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
    user,
    roleName,
  } = await requireConfigurationAdmin();

  console.log(
    "Configuration delete authorization:",
    {
      table,
      id,
      userId: user.id,
      roleName,
    }
  );

  /*
   * Server-only admin client.
   */
  const supabaseAdmin =
    createAdminClient();

  const {
    error,
  } = await supabaseAdmin
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

  return true;
}