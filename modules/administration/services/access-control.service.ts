import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AccessRole {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface AccessPermission {
  id: string;
  permission_key: string;
  module: string;
  action: string;
  name: string;
  description: string | null;
}

export interface StaffAccount {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  email: string;
  role_id: string | null;
  role_name: string | null;
  active: boolean;
}

export async function getAccessControlData() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to manage enterprise access.");

  const { data: viewer, error: viewerError } = await supabase
    .from("profiles")
    .select("id, roles(name)")
    .eq("auth_user_id", auth.user.id)
    .eq("active", true)
    .maybeSingle();
  if (viewerError || !viewer) throw new Error("Your active staff profile could not be verified.");
  const viewerRole = Array.isArray(viewer.roles) ? viewer.roles[0] : viewer.roles;
  if (viewerRole?.name !== "Super Administrator" && viewerRole?.name !== "Enterprise Manager") {
    throw new Error("You do not have access to manage enterprise roles.");
  }

  const [rolesResult, permissionsResult, assignmentsResult, staffResult] = await Promise.all([
    supabase.from("roles").select("id,name,description,status").order("name"),
    supabase.from("permissions").select("id,permission_key,module,action,name,description").order("module").order("name"),
    supabase.from("role_permissions").select("role_id,permission_id"),
    supabase.from("profiles").select("id,auth_user_id,display_name,email,role_id,active,roles(name)").eq("active", true).order("email"),
  ]);

  const firstError = [rolesResult.error, permissionsResult.error, assignmentsResult.error, staffResult.error].find(Boolean);
  if (firstError) throw new Error(`Unable to load access settings: ${firstError.message}`);

  const staff: StaffAccount[] = (staffResult.data ?? []).map((profile) => {
    const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
    return {
      id: profile.id,
      auth_user_id: profile.auth_user_id,
      display_name: profile.display_name,
      email: profile.email,
      role_id: profile.role_id,
      role_name: role?.name ?? null,
      active: profile.active,
    };
  }).filter((account) => account.role_name !== "Customer");

  return {
    roles: (rolesResult.data ?? []) as AccessRole[],
    permissions: (permissionsResult.data ?? []) as AccessPermission[],
    assignments: assignmentsResult.data ?? [],
    staff,
    viewerRoleName: String(viewerRole?.name ?? ""),
  };
}

export async function getRecentAccessActivity(limit = 100) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to view administration activity.");
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id,action,resource,resource_id,summary,metadata,created_at,profiles(display_name,email)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Unable to load activity history: ${error.message}`);
  return data ?? [];
}
