import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function requireBusinessContentAdmin() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("You must be signed in to manage business content.");
  }

  const { data: canManageContent, error: permissionError } = await supabase.rpc("has_permission", { required_permission: "businesses.manage" });
  if (permissionError || !canManageContent) throw new Error("Your role does not allow business content changes.");

  // Keep the caller's JWT and effective staff token so database RLS can
  // enforce business and branch assignments on every content operation.
  return supabase;
}
