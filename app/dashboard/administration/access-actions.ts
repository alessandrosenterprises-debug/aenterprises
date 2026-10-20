"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAccessAdministrator() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to update enterprise access.");
  const { data: profile, error } = await supabase.from("profiles")
    .select("id,roles(name,status)").eq("auth_user_id", auth.user.id).eq("active", true).maybeSingle();
  if (error || !profile) throw new Error("Your active staff profile could not be verified.");
  const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
  if ((role?.status ?? "Active") !== "Active" || (role?.name !== "Super Administrator" && role?.name !== "Enterprise Manager")) {
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

export async function inviteStaffAccount(input: { fullName: string; email: string; roleId: string }) {
  const supabase = await requireAccessAdministrator();
  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  const email = input.email.trim().toLowerCase();
  if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter the staff member’s full name and a valid email address.");
  }

  const { data: selectedRole, error: roleError } = await supabase
    .from("roles")
    .select("id,name,status")
    .eq("id", input.roleId)
    .maybeSingle();
  if (roleError || !selectedRole || selectedRole.status !== "Active" || selectedRole.name === "Customer") {
    throw new Error("Choose an active staff role.");
  }
  const { data: isSuperAdministrator } = await supabase.rpc("is_super_administrator");
  const { data: privilegedGrants } = await supabase
    .from("role_permissions")
    .select("permissions(permission_key)")
    .eq("role_id", selectedRole.id);
  const grantsSuperAdmin = (privilegedGrants ?? []).some((assignment) => {
    const permission = Array.isArray(assignment.permissions) ? assignment.permissions[0] : assignment.permissions;
    return permission?.permission_key === "access.super_admin";
  });
  if (!isSuperAdministrator && (selectedRole.name === "Super Administrator" || selectedRole.name === "Enterprise Manager" || grantsSuperAdmin)) {
    throw new Error("Only a Super Administrator can invite staff to an enterprise-level administrator role.");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (existingProfile) throw new Error("An account already exists with this email.");

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://alessandroenterprises.com";
  const admin = createAdminClient();
  const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { display_name: fullName, full_name: fullName },
    redirectTo: new URL("/reset-password", origin).toString(),
  });
  if (inviteError || !invite.user) throw new Error(inviteError?.message || "Unable to send the staff invitation.");

  const nameParts = fullName.split(" ");
  const firstName = nameParts.shift() || fullName;
  const lastName = nameParts.join(" ");
  const { data: profile, error: profileError } = await admin.from("profiles").insert({
    auth_user_id: invite.user.id,
    first_name: firstName,
    last_name: lastName,
    display_name: fullName,
    email,
    role_id: selectedRole.id,
    active: true,
  }).select("id").single();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(invite.user.id);
    throw new Error(profileError?.message || "The staff account could not be completed.");
  }

  const { data: auth } = await supabase.auth.getUser();
  const { data: actor } = await supabase.from("profiles").select("id").eq("auth_user_id", auth.user?.id ?? "").maybeSingle();
  await admin.from("activity_logs").insert({
    actor_profile_id: actor?.id ?? null,
    actor_auth_user_id: auth.user?.id ?? null,
    action: "create",
    resource: "staff_account",
    resource_id: profile.id,
    summary: `Invited ${fullName} as ${selectedRole.name}`,
    metadata: { email, role_id: selectedRole.id, role_name: selectedRole.name },
  });

  revalidatePath("/dashboard/administration/access");
  revalidatePath("/dashboard");
  return { email, roleName: selectedRole.name };
}
