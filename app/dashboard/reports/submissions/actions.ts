"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const path = "/dashboard/reports/submissions";

async function workspaceAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to access department reports.");
  const [{ data: profile }, { data: canSubmit }, { data: canReview }] = await Promise.all([
    supabase.from("profiles").select("id, active").eq("auth_user_id", user.id).eq("active", true).maybeSingle(),
    supabase.rpc("has_permission", { required_permission: "reports.submit" }),
    supabase.rpc("has_permission", { required_permission: "reports.review" }),
  ]);
  if (!profile) throw new Error("An active staff profile is required to access this page.");
  if (!canSubmit && !canReview) throw new Error("Your role does not have access to department reports.");
  return { supabase, profile, canSubmit: Boolean(canSubmit), canReview: Boolean(canReview) };
}

export async function getDepartmentReportWorkspace() {
  const { supabase, profile, canSubmit, canReview } = await workspaceAccess();
  const [{ data: departments, error: departmentsError }, { data: reports, error: reportsError }] = await Promise.all([
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("enterprise_reports")
      .select("id, reporter_profile_id, department_id, concerned_person, report_type, priority, title, details, status, reviewed_by_profile_id, review_note, reviewed_at, created_at, department:departments!enterprise_reports_department_id_fkey(id,name), reporter:profiles!enterprise_reports_reporter_profile_id_fkey(id,display_name,first_name,last_name,email), reviewer:profiles!enterprise_reports_reviewed_by_profile_id_fkey(id,display_name,first_name,last_name,email)")
      .order("created_at", { ascending: false }).limit(500),
  ]);
  if (departmentsError) throw new Error("Departments could not be loaded. Check staff access and try again.");
  if (reportsError) throw new Error("Department reports could not be loaded. Apply database migration 044 and try again.");
  return { profileId: profile.id as string, canSubmit, canReview, departments: departments ?? [], reports: reports ?? [] };
}

const reportTypes = ["General", "Incident", "Customer concern", "Staff matter", "Finance", "Operations", "Safety", "Suggestion"];
const priorities = ["Low", "Normal", "High", "Urgent"];

export async function submitDepartmentReport(input: {
  departmentId: string; concernedPerson: string; reportType: string; priority: string; title: string; details: string;
}) {
  const { supabase, profile, canSubmit } = await workspaceAccess();
  if (!canSubmit) throw new Error("Your role cannot submit department reports.");
  if (!input.departmentId || !reportTypes.includes(input.reportType) || !priorities.includes(input.priority)
    || input.title.trim().length < 4 || input.details.trim().length < 10) {
    throw new Error("Choose a department and report type, then provide a clear title and at least 10 characters of detail.");
  }
  const { error } = await supabase.from("enterprise_reports").insert({
    reporter_profile_id: profile.id,
    department_id: input.departmentId,
    concerned_person: input.concernedPerson.trim() || null,
    report_type: input.reportType,
    priority: input.priority,
    title: input.title.trim(),
    details: input.details.trim(),
  });
  if (error) throw new Error("Your report could not be submitted. Check the selected department and try again.");
  revalidatePath(path);
  return { success: true };
}

export async function reviewDepartmentReport(input: { reportId: string; status: "In review" | "Returned" | "Resolved"; note: string }) {
  const { supabase, canReview } = await workspaceAccess();
  if (!canReview) throw new Error("Your role cannot review department reports.");
  if (!input.reportId || !["In review", "Returned", "Resolved"].includes(input.status)) throw new Error("Choose a valid report update.");
  if (["Returned", "Resolved"].includes(input.status) && input.note.trim().length < 3) throw new Error("Add a note before returning or resolving a report.");
  const { error } = await supabase.rpc("review_enterprise_report", {
    p_report_id: input.reportId,
    p_status: input.status,
    p_note: input.note.trim() || null,
  });
  if (error) throw new Error(error.message || "The report update could not be saved.");
  revalidatePath(path);
  return { success: true };
}
