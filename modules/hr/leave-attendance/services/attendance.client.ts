import { supabase } from "@/lib/supabase/client";

export interface AttendanceInput {
  employee_id: string;
  attendance_date: string;
  check_in?: string | null;
  check_out?: string | null;
  status: string;
  notes?: string | null;
}

export async function createAttendance(
  data: AttendanceInput
) {
  const { data: record, error } = await supabase
    .from("hr_attendance")
    .insert({
      employee_id: data.employee_id,
      attendance_date: data.attendance_date,
      check_in: data.check_in ?? null,
      check_out: data.check_out ?? null,
      status: data.status,
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Attendance create error:",
      error
    );

    throw new Error(error.message);
  }

  return record;
}

export async function updateAttendance(
  id: string,
  data: AttendanceInput
) {
  const { data: record, error } = await supabase
    .from("hr_attendance")
    .update({
      employee_id: data.employee_id,
      attendance_date: data.attendance_date,
      check_in: data.check_in ?? null,
      check_out: data.check_out ?? null,
      status: data.status,
      notes: data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Attendance update error:",
      error
    );

    throw new Error(error.message);
  }

  return record;
}

export async function deleteAttendance(
  id: string
) {
  const { data, error } = await supabase
    .from("hr_attendance")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    console.error(
      "Attendance delete error:",
      error
    );

    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(
      "No attendance record was deleted. Check the DELETE policy or matching record."
    );
  }

  return data[0];
}