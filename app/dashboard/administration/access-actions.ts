"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAccessPermission(permission: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to update enterprise access.");
  const { data: granted, error } = await supabase.rpc("has_permission", { required_permission: permission });
  if (error || !granted) throw new Error("Your current staff role does not have permission to manage enterprise access.");
  return supabase;
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  const supabase = await requireAccessPermission("access.manage_roles");
  const { error } = await supabase.rpc("set_role_permissions", {
    p_role_id: roleId,
    p_permission_ids: permissionIds,
  });
  if (error) {
    if (/granted_by.*does not exist/i.test(error.message)) {
      throw new Error("The database is missing an access-audit field. Apply migration 035_role_permissions_grant_audit.sql in Supabase, then save the role permissions again.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/dashboard/administration/access");
  revalidatePath("/dashboard");
}

export async function updateStaffRole(profileId: string, roleId: string) {
  const supabase = await requireAccessPermission("access.assign_staff");
  const { error } = await supabase.rpc("assign_staff_role", {
    p_profile_id: profileId,
    p_role_id: roleId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/administration/access");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/hr/employees");
  revalidatePath("/dashboard/hr/riders");
  revalidatePath("/dashboard");
}

export async function updateStaffAccount(input: { profileId: string; fullName: string; phone: string; position: string; roleId: string; businessId: string; branchId: string; departmentId: string; storeManagerProfileId: string | null; newPassword?: string }) {
  const supabase = await requireAccessPermission("access.assign_staff");
  const admin = createAdminClient();
  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  const phone = input.phone.trim();
  const position = input.position.trim();
  if (fullName.length < 2 || phone.length < 7 || position.length < 2) throw new Error("Enter a valid name, phone number, and job title.");
  if (!input.businessId || !input.branchId || !input.departmentId) throw new Error("Choose a store, branch, and department.");

  const [{ data: target, error: targetError }, { data: role, error: roleError }, { data: branch, error: branchError }] = await Promise.all([
    supabase.from("profiles").select("id,auth_user_id,email,active,role_id,business_id,branch_id,department_id,store_manager_profile_id,roles(name)").eq("id", input.profileId).maybeSingle(),
    supabase.from("roles").select("id,name,status").eq("id", input.roleId).maybeSingle(),
    admin.from("branches").select("id,business_id,active,manager_profile_id").eq("id", input.branchId).eq("business_id", input.businessId).maybeSingle(),
  ]);
  if (targetError || !target || !target.active) throw new Error("The active staff account could not be found.");
  if (roleError || !role || role.status !== "Active" || ["Customer", "Customer Portal User"].includes(role.name)) throw new Error("Choose an active staff role.");
  if (branchError || !branch || branch.active === false) throw new Error("Choose an active branch belonging to the selected store.");
  const oldRole = Array.isArray(target.roles) ? target.roles[0] : target.roles;
  if (["Super Administrator", "Enterprise Manager"].includes(oldRole?.name ?? "")) throw new Error("Enterprise administrator accounts must be managed by a Super Administrator.");
  const { data: isSuperAdmin } = await supabase.rpc("is_super_administrator");
  if (!isSuperAdmin && ["Super Administrator", "Enterprise Manager"].includes(role.name)) throw new Error("Only a Super Administrator can assign an enterprise administrator role.");

  const { data: roleGrants } = await supabase.from("role_permissions").select("permissions(permission_key)").eq("role_id", role.id);
  const grantsOperationsOpen = (roleGrants ?? []).some((item) => {
    const permission = Array.isArray(item.permissions) ? item.permissions[0] : item.permissions;
    return permission?.permission_key === "operations.open";
  });
  const { data: oldRoleGrants } = target.role_id
    ? await supabase.from("role_permissions").select("permissions(permission_key)").eq("role_id", target.role_id)
    : { data: [] };
  const previouslyCouldSignIn = (oldRoleGrants ?? []).some((item) => {
    const permission = Array.isArray(item.permissions) ? item.permissions[0] : item.permissions;
    return permission?.permission_key === "operations.open";
  });
  const newPassword = input.newPassword ?? "";
  if (grantsOperationsOpen && !previouslyCouldSignIn && newPassword.length < 10) throw new Error("Set a login password of at least 10 characters when promoting staff to a direct-login role.");
  if (newPassword && (!grantsOperationsOpen || newPassword.length < 10)) throw new Error("A new password can only be set for a direct-login manager or department head, and must have at least 10 characters.");

  const branchManager = await admin.from("branches").select("id").eq("manager_profile_id", target.id).maybeSingle();
  if (branchManager.data && !/manager|supervisor/i.test(role.name)) throw new Error("A branch manager must keep a manager or supervisor role.");
  if (branchManager.data && branch.manager_profile_id && branch.manager_profile_id !== target.id) throw new Error("The selected branch already has a manager assigned.");
  const assignedManagerId = grantsOperationsOpen || branchManager.data ? target.id : input.storeManagerProfileId;
  if (!grantsOperationsOpen && !branchManager.data && !assignedManagerId) throw new Error("Choose the department manager for this staff member.");
  if (assignedManagerId !== target.id) {
    const { data: manager } = await supabase.from("profiles").select("id,business_id,branch_id,department_id,active,roles(name,status)").eq("id", assignedManagerId!).eq("active", true).maybeSingle();
    const managerRole = Array.isArray(manager?.roles) ? manager.roles[0] : manager?.roles;
    if (!manager || !/(manager|supervisor|head)/i.test(managerRole?.name ?? "") || (managerRole?.status ?? "Active") !== "Active" || manager.business_id !== input.businessId || manager.branch_id !== input.branchId || manager.department_id !== input.departmentId) {
      throw new Error("Choose an active department manager assigned to this same store, branch, and department.");
    }
  }

  const { data: oldEmployee } = await admin.from("employees").select("id,full_name,phone,position,business_id,branch_id,department_id,store_manager_profile_id").eq("user_id", target.auth_user_id).maybeSingle();
  if (!oldEmployee) throw new Error("The linked employee record is missing; repair that staff record before editing it.");
  if (newPassword) {
    const { error } = await admin.auth.admin.updateUserById(target.auth_user_id, { password: newPassword });
    if (error) throw new Error(`Staff details were not changed because the login password could not be updated: ${error.message}`);
  }
  const { error: employeeError } = await admin.from("employees").update({ full_name: fullName, phone, position, business_id: input.businessId, branch_id: input.branchId, department_id: input.departmentId, store_manager_profile_id: assignedManagerId }).eq("user_id", target.auth_user_id);
  if (employeeError) throw new Error(`The employee record could not be updated: ${employeeError.message}`);
  const { error: profileError } = await admin.from("profiles").update({ display_name: fullName, first_name: fullName.split(" ")[0], last_name: fullName.split(" ").slice(1).join(" ") || null, phone, role_id: role.id, business_id: input.businessId, branch_id: input.branchId, department_id: input.departmentId, store_manager_profile_id: assignedManagerId }).eq("id", target.id);
  if (profileError) {
    await admin.from("employees").update({ full_name: oldEmployee.full_name, phone: oldEmployee.phone, position: oldEmployee.position, business_id: oldEmployee.business_id, branch_id: oldEmployee.branch_id, department_id: oldEmployee.department_id, store_manager_profile_id: oldEmployee.store_manager_profile_id }).eq("user_id", target.auth_user_id);
    throw new Error(`The staff profile could not be updated: ${profileError.message}`);
  }
  if (branchManager.data && branch.manager_profile_id !== target.id) {
    const { error } = await admin.from("branches").update({ manager_profile_id: target.id }).eq("id", input.branchId);
    if (error) throw new Error(`Staff details were updated, but branch manager assignment failed: ${error.message}`);
    await admin.from("branches").update({ manager_profile_id: null }).eq("id", target.branch_id).eq("manager_profile_id", target.id);
  }

  const { data: auth } = await supabase.auth.getUser();
  const { data: actor } = await supabase.from("profiles").select("id").eq("auth_user_id", auth.user?.id ?? "").maybeSingle();
  await admin.from("activity_logs").insert({ actor_profile_id: actor?.id ?? null, actor_auth_user_id: auth.user?.id ?? null, action: "staff_account_updated", resource: "staff_account", resource_id: target.id, summary: `Updated staff account for ${fullName}`, metadata: { role_id: role.id, business_id: input.businessId, branch_id: input.branchId, department_id: input.departmentId, store_manager_profile_id: assignedManagerId } });
  revalidatePath("/dashboard/administration/access");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/hr/employees");
  revalidatePath("/dashboard/hr/riders");
  revalidatePath("/dashboard");
}

export async function deleteStaffAccount(profileId: string) {
  const supabase = await requireAccessPermission("access.assign_staff");
  const admin = createAdminClient();
  const { data: target, error } = await supabase.from("profiles").select("id,auth_user_id,email,display_name,active,roles(name)").eq("id", profileId).maybeSingle();
  if (error || !target || !target.active) throw new Error("The active staff account could not be found.");
  const { data: auth } = await supabase.auth.getUser();
  if (target.auth_user_id === auth.user?.id) throw new Error("You cannot delete your own signed-in staff account.");
  const role = Array.isArray(target.roles) ? target.roles[0] : target.roles;
  if (["Super Administrator", "Enterprise Manager"].includes(role?.name ?? "")) throw new Error("Enterprise administrator accounts cannot be deleted here.");
  const { data: assignedStaff } = await admin.from("employees").select("id").eq("store_manager_profile_id", target.id).eq("is_active", true).neq("user_id", target.auth_user_id).limit(1);
  if (assignedStaff?.length) throw new Error("Reassign this manager’s active staff to another manager before removing their access.");

  const { error: profileError } = await admin.from("profiles").update({ active: false }).eq("id", target.id);
  if (profileError) throw new Error(`The staff login could not be disabled: ${profileError.message}`);
  await admin.from("employees").update({ is_active: false, status: "Inactive" }).eq("user_id", target.auth_user_id);
  await admin.from("staff_operator_pins").delete().eq("profile_id", target.id);
  await admin.from("manager_operations_sessions").update({ status: "closed", closed_at: new Date().toISOString(), active_operator_profile_id: null }).eq("manager_profile_id", target.id).eq("status", "open");
  await admin.from("manager_operations_sessions").update({ active_operator_profile_id: null }).eq("active_operator_profile_id", target.id).eq("status", "open");
  await admin.from("branches").update({ manager_profile_id: null }).eq("manager_profile_id", target.id);
  const { data: actor } = await supabase.from("profiles").select("id").eq("auth_user_id", auth.user?.id ?? "").maybeSingle();
  await admin.from("activity_logs").insert({ actor_profile_id: actor?.id ?? null, actor_auth_user_id: auth.user?.id ?? null, action: "staff_account_deactivated", resource: "staff_account", resource_id: target.id, summary: `Deactivated staff access for ${target.display_name || target.email}`, metadata: { target_auth_user_id: target.auth_user_id, reason: "Staff account deleted from active AEOS access" } });
  revalidatePath("/dashboard/administration/access");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/hr/employees");
  revalidatePath("/dashboard/hr/riders");
  revalidatePath("/dashboard");
}

export async function setStaffOperatorPin(profileId: string, pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error("Enter a four-digit PIN.");
  const supabase = await requireAccessPermission("access.assign_staff");
  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id,auth_user_id,email,active,roles(name)")
    .eq("id", profileId)
    .maybeSingle();
  if (targetError || !target) throw new Error("Staff account could not be found.");
  const role = Array.isArray(target.roles) ? target.roles[0] : target.roles;
  if (!target.active || ["Customer", "Customer Portal User"].includes(role?.name ?? "") || !target.email) {
    throw new Error("Only an active staff account can be assigned a PIN.");
  }
  const { error } = await supabase.rpc("reset_staff_operator_pin", { p_profile_id: target.id, p_pin: pin });
  if (error) throw new Error(error.message || "The staff PIN could not be changed.");

  const admin = createAdminClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: actor } = await supabase.from("profiles").select("id").eq("auth_user_id", auth.user?.id ?? "").maybeSingle();
  await admin.from("activity_logs").insert({
    actor_profile_id: actor?.id ?? null,
    actor_auth_user_id: auth.user?.id ?? null,
    action: "staff_pin_updated",
    resource: "staff_account",
    resource_id: target.id,
    summary: `Updated the staff sign-in PIN for ${target.email}`,
    metadata: { target_auth_user_id: target.auth_user_id },
  });
  revalidatePath("/dashboard/administration/access");
  return { email: target.email };
}

export async function inviteStaffAccount(input: { fullName: string; email: string; phone: string; position: string; roleId: string; pin: string; loginPassword?: string; businessId: string; branchId: string; departmentId: string; storeManagerProfileId: string | null; isBranchManager: boolean }) {
  const supabase = await requireAccessPermission("access.assign_staff");
  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const position = input.position.trim();
  if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.length < 7 || position.length < 2) {
    throw new Error("Enter the staff member’s name, valid work email, phone, and job title.");
  }
  if (!/^\d{4}$/.test(input.pin)) throw new Error("Choose a four-digit staff PIN.");
  if (!input.businessId || !input.branchId || !input.departmentId) throw new Error("Choose the store, branch, and department.");

  const { data: selectedRole, error: roleError } = await supabase
    .from("roles")
    .select("id,name,status")
    .eq("id", input.roleId)
    .maybeSingle();
  if (roleError || !selectedRole || selectedRole.status !== "Active" || ["Customer", "Customer Portal User"].includes(selectedRole.name)) {
    throw new Error("Choose an active staff role.");
  }
  const admin = createAdminClient();
  const { data: branch, error: branchError } = await admin.from("branches").select("id,business_id,active").eq("id", input.branchId).eq("business_id", input.businessId).maybeSingle();
  if (branchError || !branch || branch.active === false) throw new Error("Choose an active branch that belongs to the selected store.");
  if (input.isBranchManager && !/manager|supervisor/i.test(selectedRole.name)) throw new Error("Only a manager or supervisor role can manage a branch.");
  const { data: isSuperAdministrator } = await supabase.rpc("is_super_administrator");
  const { data: privilegedGrants } = await supabase
    .from("role_permissions")
    .select("permissions(permission_key)")
    .eq("role_id", selectedRole.id);
  const grantsSuperAdmin = (privilegedGrants ?? []).some((assignment) => {
    const permission = Array.isArray(assignment.permissions) ? assignment.permissions[0] : assignment.permissions;
    return permission?.permission_key === "access.super_admin";
  });
  const grantsOperationsOpen = (privilegedGrants ?? []).some((assignment) => {
    const permission = Array.isArray(assignment.permissions) ? assignment.permissions[0] : assignment.permissions;
    return permission?.permission_key === "operations.open";
  });
  const loginPassword = input.loginPassword ?? "";
  if (grantsOperationsOpen && loginPassword.length < 10) throw new Error("This department head role can sign in directly. Set a login password of at least 10 characters.");
  if (!grantsOperationsOpen && loginPassword) throw new Error("Only department head and manager roles with direct sign-in access can be assigned a password here.");
  if (!isSuperAdministrator && (selectedRole.name === "Super Administrator" || selectedRole.name === "Enterprise Manager" || grantsSuperAdmin)) {
    throw new Error("Only a Super Administrator can invite staff to an enterprise-level administrator role.");
  }

  const assignedManagerId = input.storeManagerProfileId;
  if (!input.isBranchManager && !grantsOperationsOpen && !assignedManagerId) throw new Error("Choose the department manager for this staff member.");
  if (!input.isBranchManager && assignedManagerId) {
    const { data: manager, error: managerError } = await supabase.from("profiles").select("id,business_id,branch_id,department_id,active,roles(name,status)").eq("id", assignedManagerId).eq("active", true).maybeSingle();
    const managerRole = Array.isArray(manager?.roles) ? manager.roles[0] : manager?.roles;
    if (managerError || !manager || !managerRole?.name || (managerRole.status ?? "Active") !== "Active" || !/(manager|supervisor|head)/i.test(managerRole.name) && managerRole.name !== "Super Administrator") {
      throw new Error("Choose an active manager or department head account.");
    }
    if (manager.business_id !== input.businessId || manager.branch_id !== input.branchId || manager.department_id !== input.departmentId) {
      throw new Error("The selected department manager must match this staff member’s store, branch, and department.");
    }
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (existingProfile) throw new Error("An account already exists with this email.");

  // Staff work inside a manager-opened AEOS session, so create their platform
  // identity and PIN directly here instead of issuing a password setup link.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: grantsOperationsOpen ? loginPassword : randomBytes(32).toString("hex"),
    email_confirm: true,
    user_metadata: { display_name: fullName, full_name: fullName },
  });
  if (createError || !created.user) throw new Error(createError?.message || "Unable to create the staff login.");

  const nameParts = fullName.split(" ");
  const firstName = nameParts.shift() || fullName;
  const lastName = nameParts.join(" ");
  const { data: profile, error: profileError } = await admin.from("profiles").insert({
    auth_user_id: created.user.id,
    first_name: firstName,
    last_name: lastName,
    display_name: fullName,
    email,
    phone,
    role_id: selectedRole.id,
    active: true,
    business_id: input.businessId,
    branch_id: input.branchId,
    department_id: input.departmentId,
    store_manager_profile_id: input.isBranchManager ? null : grantsOperationsOpen ? null : assignedManagerId,
  }).select("id").single();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(profileError?.message || "The staff account could not be completed.");
  }

  const { error: pinError } = await supabase.rpc("reset_staff_operator_pin", { p_profile_id: profile.id, p_pin: input.pin });
  if (pinError) {
    await admin.from("profiles").delete().eq("id", profile.id);
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(pinError.message || "The staff login was created, but the PIN could not be saved.");
  }

  const managerProfileId = input.isBranchManager || grantsOperationsOpen ? profile.id : assignedManagerId;
  if (input.isBranchManager) {
    const { error: branchManagerError } = await admin.from("branches").update({ manager_profile_id: profile.id }).eq("id", input.branchId);
    if (branchManagerError) {
      await admin.from("profiles").delete().eq("id", profile.id);
      await admin.auth.admin.deleteUser(created.user.id);
      throw new Error(`The branch manager could not be assigned: ${branchManagerError.message}`);
    }
    await admin.from("profiles").update({ store_manager_profile_id: profile.id }).eq("id", profile.id);
  } else if (grantsOperationsOpen) {
    const { error: managerAssignmentError } = await admin.from("profiles").update({ store_manager_profile_id: profile.id }).eq("id", profile.id);
    if (managerAssignmentError) {
      await admin.from("profiles").delete().eq("id", profile.id);
      await admin.auth.admin.deleteUser(created.user.id);
      throw new Error(`The department head could not be assigned to their department: ${managerAssignmentError.message}`);
    }
  }

  const { error: employeeError } = await admin.from("employees").insert({
    user_id: created.user.id,
    full_name: fullName,
    phone,
    email,
    position,
    business_id: input.businessId,
    branch_id: input.branchId,
    department_id: input.departmentId,
    store_manager_profile_id: managerProfileId,
    salary: 0,
    date_joined: new Date().toISOString().slice(0, 10),
    is_active: true,
    status: "Active",
  });
  if (employeeError) {
    await admin.from("profiles").delete().eq("id", profile.id);
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(`The staff login was created, but its employee record could not be linked: ${employeeError.message}`);
  }

  const { data: auth } = await supabase.auth.getUser();
  const { data: actor } = await supabase.from("profiles").select("id").eq("auth_user_id", auth.user?.id ?? "").maybeSingle();
  await admin.from("activity_logs").insert({
    actor_profile_id: actor?.id ?? null,
    actor_auth_user_id: auth.user?.id ?? null,
    action: "create",
    resource: "staff_account",
    resource_id: profile.id,
    summary: `Created ${fullName} as ${selectedRole.name}, assigned to a store and branch`,
    metadata: { email, role_id: selectedRole.id, role_name: selectedRole.name, business_id: input.businessId, branch_id: input.branchId, store_manager_profile_id: managerProfileId },
  });

  revalidatePath("/dashboard/administration/access");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/hr/employees");
  revalidatePath("/dashboard/hr/riders");
  revalidatePath("/dashboard");
  return { email, roleName: selectedRole.name };
}
