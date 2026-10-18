"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAccessAdministrator() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to update enterprise access.");
  const { data: profile, error } = await supabase.from("profiles")
    .select("id,roles(name)").eq("auth_user_id", auth.user.id).eq("active", true).maybeSingle();
  if (error || !profile) throw new Error("Your active staff profile could not be verified.");
  const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
  if (role?.name !== "Super Administrator" && role?.name !== "Enterprise Manager") {
    throw new Error("You do not have permission to change enterprise access.");
  }
  return supabase;
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  const supabase = await requireAccessAdministrator();
  const { error } = await supabase.rpc("set_role_permissions", {
    p_role_id: roleId,
    p_permission_ids: permissionIds,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/administration/access");
  revalidatePath("/dashboard");
}

export async function updateStaffRole(profileId: string, roleId: string) {
  const supabase = await requireAccessAdministrator();
  const { error } = await supabase.rpc("assign_staff_role", {
    p_profile_id: profileId,
    p_role_id: roleId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/administration/access");
  revalidatePath("/dashboard");
}
