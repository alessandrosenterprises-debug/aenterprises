"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CreateEmployeeInput } from "./employee.client";

async function requireEmployeeManager() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to manage staff records.");
  const { data: allowed, error } = await supabase.rpc("has_permission", { required_permission: "employees.manage" });
  if (error || !allowed) {
    const { data: hrAllowed } = await supabase.rpc("has_permission", { required_permission: "hr.manage" });
    if (!hrAllowed) throw new Error("Your role does not allow staff record changes.");
  }
  return supabase;
}

async function recordActivity(supabase: Awaited<ReturnType<typeof createClient>>, action: string, id: string, summary: string) {
  const { error } = await supabase.rpc("log_enterprise_activity", {
    p_action: action,
    p_resource: "employee",
    p_resource_id: id,
    p_summary: summary,
    p_metadata: {},
  });
  if (error) console.error("Unable to record staff activity:", error.message);
}

export async function createEmployeeAction(employee: CreateEmployeeInput) {
  const supabase = await requireEmployeeManager();
  const { data, error } = await supabase.from("employees").insert({
    ...employee,
    user_id: employee.user_id || null,
    employment_type: employee.employment_type || "Full Time",
    date_joined: employee.date_joined || new Date().toISOString().slice(0, 10),
    status: "Active",
  }).select("id,full_name").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, "create", data.id, `Created staff record for ${data.full_name}`);
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/hr/employees");
  return data;
}

export async function updateEmployeeAction(id: string, employee: CreateEmployeeInput) {
  const supabase = await requireEmployeeManager();
  const { data, error } = await supabase.from("employees").update({
    ...employee,
    user_id: employee.user_id || null,
    employment_type: employee.employment_type || "Full Time",
    updated_at: new Date().toISOString(),
  }).eq("id", id).select("id,full_name").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, "update", data.id, `Updated staff record for ${data.full_name}`);
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/hr/employees");
  return data;
}

export async function deleteEmployeeAction(id: string) {
  const supabase = await requireEmployeeManager();
  const { data, error } = await supabase.from("employees").delete().eq("id", id).select("id,full_name").single();
  if (error) throw new Error(error.message);
  await recordActivity(supabase, "delete", data.id, `Deleted staff record for ${data.full_name}`);
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/hr/employees");
  return data;
}
