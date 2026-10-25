import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Read the real authenticated account independently from a staff PIN session.
  const supabase = await createClient({ includeOperationsSession: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * No authenticated user.
   * Send them to the AEOS login page.
   */
  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: hasSuperAdminAccess }] = await Promise.all([
    supabase
    .from("profiles")
    .select("id, role_id, active, roles(name,status)")
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .maybeSingle(),
    supabase.rpc("has_permission", { required_permission: "access.super_admin" }),
  ]);
  const profileRole = Array.isArray(profile?.roles) ? profile.roles[0] : profile?.roles;
  const profileIsSuperAdmin = profileRole?.name === "Super Administrator" && (profileRole.status ?? "Active") === "Active";
  const authenticatedSuperAdministrator = Boolean(hasSuperAdminAccess) || profileIsSuperAdmin;
  const hasActiveProfileRole = authenticatedSuperAdministrator || Boolean(profile && profile.active === true && profile.role_id && profileRole?.name && !["Customer", "Customer Portal User"].includes(profileRole.name) && (profileRole.status ?? "Active") === "Active");
  if (!hasActiveProfileRole) {
    redirect("/login?account=staff-required");
  }
  const operatorSessionActive = Boolean((await cookies()).get("aeos_ops_token")?.value);
  const isAuthenticatedSuperAdministrator = authenticatedSuperAdministrator;
  const effectiveSupabase = operatorSessionActive && !isAuthenticatedSuperAdministrator ? await createClient() : supabase;
  const { data: effectiveProfiles, error: effectiveProfileError } = await effectiveSupabase.rpc("get_effective_profile");
  // Never fall back to the manager's role if a staff operator session is active
  // but its effective profile cannot be resolved. That would expose manager links.
  const effectiveProfile = operatorSessionActive && !isAuthenticatedSuperAdministrator
    ? effectiveProfileError ? null : effectiveProfiles?.[0] ?? null
    : effectiveProfiles?.[0] ?? profile;
  const effectiveRole = effectiveProfile
    ? ("role_name" in effectiveProfile ? effectiveProfile.role_name : profileRole?.name)
    : null;
  const isSuperAdministrator = effectiveRole === "Super Administrator";
  const isEnterpriseAdministrator = effectiveRole === "Enterprise Manager";
  const { data: assignedPermissions } = effectiveProfile?.role_id
    ? isEnterpriseAdministrator
      ? await effectiveSupabase.from("permissions").select("permission_key").neq("permission_key", "access.super_admin")
      : await effectiveSupabase.from("role_permissions").select("permissions(permission_key)").eq("role_id", effectiveProfile.role_id)
    : { data: [] };
  const permissionKeys = (assignedPermissions ?? []).flatMap((assignment) => {
    if ("permission_key" in assignment) return assignment.permission_key ? [assignment.permission_key] : [];
    const permission = Array.isArray(assignment.permissions) ? assignment.permissions[0] : assignment.permissions;
    return permission?.permission_key ? [permission.permission_key] : [];
  });

  return <AppLayout permissionKeys={permissionKeys} isSuperAdministrator={isSuperAdministrator} accessControlEnabled={Boolean(profile?.role_id) || isSuperAdministrator}>{children}</AppLayout>;
}
