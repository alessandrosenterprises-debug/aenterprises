import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email?: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "is_super_admin"
  );

  if (error) {
    console.error("Super Admin check failed:", error);
    return false;
  }

  return data === true;
}

export async function hasPermission(
  module: string,
  action: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "has_permission",
    {
      requested_module: module,
      requested_action: action,
    }
  );

  if (error) {
    console.error(
      `Permission check failed for ${module}.${action}:`,
      error
    );

    return false;
  }

  return data === true;
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const superAdmin = await isSuperAdmin();

  if (!superAdmin) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function requirePermission(
  module: string,
  action: string
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const allowed = await hasPermission(
    module,
    action
  );

  if (!allowed) {
    throw new Error("Forbidden");
  }

  return user;
}