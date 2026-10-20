import { ReactNode } from "react";
import { redirect } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role_id, active, roles(name,status)")
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  const profileRole = Array.isArray(profile?.roles) ? profile.roles[0] : profile?.roles;
  if (!profile || profile.active !== true || !profile.role_id || !profileRole?.name || profileRole.name === "Customer" || (profileRole.status ?? "Active") !== "Active") {
    redirect("/login?account=staff-required");
  }
  const isSuperAdministrator = profileRole?.name === "Super Administrator";
  const { data: assignedPermissions } = profile?.role_id
    ? await supabase.from("role_permissions").select("permissions(permission_key)").eq("role_id", profile.role_id)
    : { data: [] };
  const permissionKeys = (assignedPermissions ?? []).flatMap((assignment) => {
    const permission = Array.isArray(assignment.permissions) ? assignment.permissions[0] : assignment.permissions;
    return permission?.permission_key ? [permission.permission_key] : [];
  });

  return <AppLayout permissionKeys={permissionKeys} isSuperAdministrator={isSuperAdministrator} accessControlEnabled={Boolean(profile.role_id)}>{children}</AppLayout>;
}
