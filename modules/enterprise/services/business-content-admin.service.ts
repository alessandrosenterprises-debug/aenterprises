import "server-only";

import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function requireBusinessContentAdmin() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("You must be signed in to manage business content.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active, roles(name)")
    .eq("auth_user_id", authData.user.id)
    .eq("active", true)
    .maybeSingle();

  if (profileError) throw new Error("Unable to verify business content permissions.");

  const roleValue = profile?.roles;
  const role = Array.isArray(roleValue) ? roleValue[0] : roleValue;
  const roleName = role && typeof role === "object" && "name" in role ? String(role.name) : "";
  if (!profile || !["Super Administrator", "Enterprise Manager"].includes(roleName)) {
    throw new Error("Only an Enterprise Manager or Super Administrator can manage business content.");
  }

  return createAdminClient();
}
