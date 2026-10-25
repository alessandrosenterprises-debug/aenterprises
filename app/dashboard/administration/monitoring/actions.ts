"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveAppError(reportId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(reportId)) throw new Error("Invalid issue reference.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to update application issues.");
  const [{ data: allowed }, { data: configurationAdmin }] = await Promise.all([
    supabase.rpc("has_permission", { required_permission: "access.view_audit" }),
    supabase.rpc("is_configuration_admin"),
  ]);
  if (!allowed && !configurationAdmin) throw new Error("You do not have permission to update application issues.");

  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
  const { error } = await createAdminClient().from("app_error_reports").update({ status: "Resolved", resolved_by: profile?.id ?? null, resolved_at: new Date().toISOString() }).eq("id", reportId);
  if (error) throw new Error("The issue could not be marked resolved.");
  revalidatePath("/dashboard/administration/monitoring");
}
