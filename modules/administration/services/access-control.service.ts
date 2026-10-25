import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  business_id: string | null;
  branch_id: string | null;
  department_id: string | null;
  store_manager_profile_id: string | null;
  phone: string | null;
  position: string | null;
}

export interface StaffBranchOption { id: string; business_id: string; name: string; }
export interface StaffBusinessOption { id: string; name: string; }
export interface StaffDepartmentOption { id: string; name: string; }

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

  const admin = createAdminClient();
  const [rolesResult, permissionsResult, assignmentsResult, staffResult, businessesResult, branchesResult, departmentsResult, employeeRecordsResult] = await Promise.all([
    supabase.from("roles").select("id,name,description,status").order("name"),
    supabase.from("permissions").select("id,permission_key,module,action,name,description").order("module").order("name"),
    supabase.from("role_permissions").select("role_id,permission_id"),
    supabase.from("profiles").select("id,auth_user_id,display_name,email,phone,role_id,active,business_id,branch_id,department_id,store_manager_profile_id,roles(name)").eq("active", true).order("email"),
    supabase.from("businesses").select("id,name").eq("active", true).order("name"),
    admin.from("branches").select("id,business_id,name,active").order("name"),
    supabase.from("departments").select("id,name").order("name"),
    admin.from("employees").select("user_id,position,phone"),
  ]);

  const firstError = [rolesResult.error, permissionsResult.error, assignmentsResult.error, staffResult.error, businessesResult.error, branchesResult.error, departmentsResult.error, employeeRecordsResult.error].find(Boolean);
  if (firstError) throw new Error(`Unable to load access settings: ${firstError.message}`);

  const employeeByUserId = new Map((employeeRecordsResult.data ?? []).filter((employee) => employee.user_id).map((employee) => [employee.user_id!, employee]));
  const staff: StaffAccount[] = (staffResult.data ?? []).map((profile) => {
    const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
    const employee = employeeByUserId.get(profile.auth_user_id);
    return {
      id: profile.id,
      auth_user_id: profile.auth_user_id,
      display_name: profile.display_name,
      email: profile.email,
      role_id: profile.role_id,
      role_name: role?.name ?? null,
      active: profile.active,
      business_id: profile.business_id,
      branch_id: profile.branch_id,
      department_id: profile.department_id,
      store_manager_profile_id: profile.store_manager_profile_id,
      phone: profile.phone ?? employee?.phone ?? null,
      position: employee?.position ?? null,
    };
  }).filter((account) => !["Customer", "Customer Portal User"].includes(account.role_name ?? ""));
  const operationsPermissionId = (permissionsResult.data ?? []).find((permission) => permission.permission_key === "operations.open")?.id;
  const directLoginRoleIds = operationsPermissionId
    ? (assignmentsResult.data ?? []).filter((assignment) => assignment.permission_id === operationsPermissionId).map((assignment) => assignment.role_id)
    : [];

  return {
    roles: (rolesResult.data ?? []) as AccessRole[],
    permissions: (permissionsResult.data ?? []) as AccessPermission[],
    assignments: assignmentsResult.data ?? [],
    staff,
    businesses: (businessesResult.data ?? []) as StaffBusinessOption[],
    branches: (branchesResult.data ?? []).filter((branch) => branch.active !== false) as StaffBranchOption[],
    departments: (departmentsResult.data ?? []) as StaffDepartmentOption[],
    storeManagers: staff.filter((account) => directLoginRoleIds.includes(account.role_id ?? "")),
    directLoginRoleIds,
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
