import { supabase } from "@/lib/supabase/client";

export interface LeaveRequestInput {
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason?: string | null;
  status?: string;
  rejection_reason?: string | null;
  notes?: string | null;
}

export async function createLeaveRequest(
  data: LeaveRequestInput
) {
  const { data: request, error } = await supabase
    .from("hr_leave_requests")
    .insert({
      employee_id: data.employee_id,
      leave_type_id: data.leave_type_id,
      start_date: data.start_date,
      end_date: data.end_date,
      days: data.days,
      reason: data.reason ?? null,
      status: data.status ?? "Pending",
      rejection_reason:
        data.rejection_reason ?? null,
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Leave request create error:",
      error
    );

    throw new Error(error.message);
  }

  return request;
}

export async function updateLeaveRequest(
  id: string,
  data: LeaveRequestInput
) {
  const { data: request, error } = await supabase
    .from("hr_leave_requests")
    .update({
      employee_id: data.employee_id,
      leave_type_id: data.leave_type_id,
      start_date: data.start_date,
      end_date: data.end_date,
      days: data.days,
      reason: data.reason ?? null,
      status: data.status ?? "Pending",
      rejection_reason:
        data.rejection_reason ?? null,
      notes: data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Leave request update error:",
      error
    );

    throw new Error(error.message);
  }

  return request;
}

export async function approveLeaveRequest(
  id: string
) {
  const { data, error } = await supabase
    .from("hr_leave_requests")
    .update({
      status: "Approved",
      approved_at: new Date().toISOString(),
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Leave request approval error:",
      error
    );

    throw new Error(error.message);
  }

  return data;
}

export async function rejectLeaveRequest(
  id: string,
  rejectionReason: string
) {
  const { data, error } = await supabase
    .from("hr_leave_requests")
    .update({
      status: "Rejected",
      rejection_reason: rejectionReason,
      approved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Leave request rejection error:",
      error
    );

    throw new Error(error.message);
  }

  return data;
}

export async function deleteLeaveRequest(
  id: string
) {
  const { data, error } = await supabase
    .from("hr_leave_requests")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Leave request delete error:",
      error
    );

    throw new Error(error.message);
  }

  return data;
}