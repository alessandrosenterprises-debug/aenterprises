import { createClient } from "@/lib/supabase/server";

export interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  default_days: number;
  is_paid: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveTypeInput {
  name: string;
  description?: string | null;
  default_days?: number;
  is_paid?: boolean;
  is_active?: boolean;
}

/* ============================================================
   GET LEAVE TYPES
============================================================ */

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hr_leave_types")
    .select("*")
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Leave types loading error:",
      error
    );

    throw new Error(error.message);
  }

  return (data ?? []) as LeaveType[];
}

/* ============================================================
   CREATE LEAVE TYPE
============================================================ */

export async function createLeaveType(
  data: LeaveTypeInput
): Promise<LeaveType> {
  const supabase = await createClient();

  const { data: leaveType, error } =
    await supabase
      .from("hr_leave_types")
      .insert({
        name: data.name.trim(),
        description:
          data.description?.trim() || null,
        default_days:
          data.default_days ?? 0,
        is_paid:
          data.is_paid ?? true,
        is_active:
          data.is_active ?? true,
      })
      .select("*")
      .single();

  if (error) {
    console.error(
      "Leave type creation error:",
      error
    );

    throw new Error(error.message);
  }

  return leaveType as LeaveType;
}

/* ============================================================
   UPDATE LEAVE TYPE
============================================================ */

export async function updateLeaveType(
  id: string,
  data: LeaveTypeInput
): Promise<LeaveType> {
  const supabase = await createClient();

  const { data: leaveType, error } =
    await supabase
      .from("hr_leave_types")
      .update({
        name: data.name.trim(),
        description:
          data.description?.trim() || null,
        default_days:
          data.default_days ?? 0,
        is_paid:
          data.is_paid ?? true,
        is_active:
          data.is_active ?? true,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

  if (error) {
    console.error(
      "Leave type update error:",
      error
    );

    throw new Error(error.message);
  }

  return leaveType as LeaveType;
}

/* ============================================================
   DELETE LEAVE TYPE
============================================================ */

export async function deleteLeaveType(
  id: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("hr_leave_types")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Leave type deletion error:",
      error
    );

    throw new Error(error.message);
  }
}