import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AppErrorReport {
  id: string;
  source: "staff" | "customer";
  route: string;
  message: string;
  digest: string | null;
  status: "Open" | "Resolved";
  created_at: string;
  resolved_at: string | null;
  reporter_auth_user_id: string | null;
  reporterName: string | null;
  reporterContact: string | null;
}

export async function getAppMonitoringData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to view application monitoring.");

  const [{ data: auditAccess }, { data: configurationAdmin }] = await Promise.all([
    supabase.rpc("has_permission", { required_permission: "access.view_audit" }),
    supabase.rpc("is_configuration_admin"),
  ]);
  if (!auditAccess && !configurationAdmin) throw new Error("You do not have permission to view application monitoring.");

  const admin = createAdminClient();
  const [healthResult, errorsResult] = await Promise.all([
    admin.from("businesses").select("id", { count: "exact", head: true }),
    admin.from("app_error_reports").select("id,source,route,message,digest,status,created_at,resolved_at,reporter_auth_user_id").order("created_at", { ascending: false }).limit(150),
  ]);

  const reports = (errorsResult.data ?? []) as Omit<AppErrorReport, "reporterName" | "reporterContact">[];
  const reporterIds = Array.from(new Set(reports.map((report) => report.reporter_auth_user_id).filter((id): id is string => Boolean(id))));
  const [customerResult, staffResult] = reporterIds.length > 0 ? await Promise.all([
    admin.from("customers").select("auth_user_id,full_name,phone,email").in("auth_user_id", reporterIds),
    admin.from("profiles").select("auth_user_id,display_name,email").in("auth_user_id", reporterIds),
  ]) : [{ data: [] }, { data: [] }];
  const reporterMap = new Map<string, { name: string | null; contact: string | null }>();
  for (const customer of customerResult.data ?? []) {
    if (customer.auth_user_id) reporterMap.set(customer.auth_user_id, { name: customer.full_name, contact: customer.phone || customer.email });
  }
  for (const staff of staffResult.data ?? []) {
    if (staff.auth_user_id) reporterMap.set(staff.auth_user_id, { name: staff.display_name, contact: staff.email });
  }

  return {
    databaseOnline: !healthResult.error,
    businessCount: healthResult.count ?? 0,
    errorsConfigured: !errorsResult.error,
    reports: reports.map((report) => ({ ...report, reporterName: reporterMap.get(report.reporter_auth_user_id ?? "")?.name ?? null, reporterContact: reporterMap.get(report.reporter_auth_user_id ?? "")?.contact ?? null })),
    errorMessage: errorsResult.error?.message ?? null,
  };
}
