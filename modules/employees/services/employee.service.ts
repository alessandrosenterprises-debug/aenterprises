import { createClient } from "@/lib/supabase/server";

export interface Employee {
  id: string;

  business_id: string | null;

  full_name: string;

  phone: string;

  email: string | null;

  gender: string | null;

  date_of_birth: string | null;

  national_id: string | null;

  address: string | null;

  position: string;

  employment_type: string | null;

  salary: number | null;

  date_joined: string | null;

  notes: string | null;

  is_active: boolean;

  status: string;

  created_at: string;

  updated_at: string;

  branch_id: string | null;
  store_manager_profile_id?: string | null;

  user_id: string | null;

  department_id: string | null;

  businesses?: {
    id: string;
    name: string;
  } | null;

  departments?: {
    id: string;
    name: string;
  } | null;
  branch_name?: string | null;
  store_manager_name?: string | null;
}

export interface EmployeeBranchOption {
  id: string;
  business_id: string;
  name: string;
}

export interface EmployeeManagerOption {
  id: string;
  display_name: string;
  email: string;
  business_id: string | null;
}

export async function getEmployeeAssignmentOptions() {
  const supabase = await createClient();
  const [branchesResult, managersResult, staffAccountsResult, linkedEmployeesResult] = await Promise.all([
    supabase.from("branches").select("id,business_id,name,active").order("name"),
    supabase.from("profiles").select("id,display_name,email,business_id,roles(name,status)").eq("active", true).order("display_name"),
    supabase.from("profiles").select("id,auth_user_id,display_name,email,roles(name,status)").eq("active", true).order("display_name"),
    supabase.from("employees").select("user_id").not("user_id", "is", null),
  ]);
  if (branchesResult.error) throw new Error("Store branches could not be loaded. Check the database connection and branch setup.");
  if (managersResult.error) throw new Error(`Unable to load store managers: ${managersResult.error.message}`);
  const managers = (managersResult.data ?? []).flatMap((profile) => {
    const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
    if (!role?.name || (role.status ?? "Active") !== "Active" || !/(manager|supervisor)/i.test(role.name) && role.name !== "Super Administrator") return [];
    return [{ id: profile.id, display_name: profile.display_name || profile.email, email: profile.email, business_id: profile.business_id }];
  });
  if (staffAccountsResult.error) throw new Error(`Unable to load staff login accounts: ${staffAccountsResult.error.message}`);
  if (linkedEmployeesResult.error) throw new Error(`Unable to load employee account links: ${linkedEmployeesResult.error.message}`);
  const linkedUserIds = new Set((linkedEmployeesResult.data ?? []).map((employee) => employee.user_id).filter(Boolean));
  const accountOptions = (staffAccountsResult.data ?? []).flatMap((profile) => {
    const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
    if (!role?.name || ["Customer", "Customer Portal User"].includes(role.name) || (role.status ?? "Active") !== "Active" || linkedUserIds.has(profile.auth_user_id)) return [];
    return [{ auth_user_id: profile.auth_user_id, display_name: profile.display_name || profile.email, email: profile.email }];
  });
  return { branches: (branchesResult.data ?? []).filter((branch) => branch.active !== false), managers, accountOptions };
}

export async function getEmployees(): Promise<Employee[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select(`
  *,
  businesses (
    id,
    name
  ),
  departments (
    id,
    name
  )
`)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Employees loading error:",
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  const employees = (data ?? []) as unknown as Employee[];
  const branchIds = [...new Set(employees.map((employee) => employee.branch_id).filter((id): id is string => Boolean(id)))];
  const managerIds = [...new Set(employees.map((employee) => employee.store_manager_profile_id).filter((id): id is string => Boolean(id)))];
  const [branchesResult, managersResult] = await Promise.all([
    branchIds.length ? supabase.from("branches").select("id,name").in("id", branchIds) : Promise.resolve({ data: [], error: null }),
    managerIds.length ? supabase.from("profiles").select("id,display_name,email").in("id", managerIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (branchesResult.error) throw new Error(`Unable to load employee branches: ${branchesResult.error.message}`);
  if (managersResult.error) throw new Error(`Unable to load employee store managers: ${managersResult.error.message}`);
  const branchNames = new Map((branchesResult.data ?? []).map((branch) => [branch.id, branch.name]));
  const managerNames = new Map((managersResult.data ?? []).map((manager) => [manager.id, manager.display_name || manager.email]));
  return employees.map((employee) => ({
    ...employee,
    branch_name: employee.branch_id ? branchNames.get(employee.branch_id) ?? null : null,
    store_manager_name: employee.store_manager_profile_id ? managerNames.get(employee.store_manager_profile_id) ?? null : null,
  }));
}
