import { supabase } from "@/lib/supabase/client";

export interface LeaveTypeInput {
  name: string;
  description?: string | null;
  default_days?: number;
  is_paid?: boolean;
  is_active?: boolean;
}

export async function createLeaveType(
  data: LeaveTypeInput
) {
  const { data: leaveType, error } = await supabase
    .from("hr_leave_types")
    .insert({
      name: data.name,
      description: data.description ?? null,
      default_days: data.default_days ?? 0,
      is_paid: data.is_paid ?? true,
      is_active: data.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Leave type create error:",
      error
    );

    throw new Error(error.message);
  }

  return leaveType;
}

export async function updateLeaveType(
  id: string,
  data: LeaveTypeInput
) {
  const { data: leaveType, error } = await supabase
    .from("hr_leave_types")
    .update({
      name: data.name,
      description: data.description ?? null,
      default_days: data.default_days ?? 0,
      is_paid: data.is_paid ?? true,
      is_active: data.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Leave type update error:",
      error
    );

    throw new Error(error.message);
  }

  return leaveType;
}

export async function deleteLeaveType(
  id: string
) {
  const { error } = await supabase
    .from("hr_leave_types")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Leave type delete error:",
      error
    );

    throw new Error(error.message);
  }
}