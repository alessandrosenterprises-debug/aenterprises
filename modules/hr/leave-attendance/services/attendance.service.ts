import { createClient } from "@/lib/supabase/server";

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;

  employees?: {
    id: string;
    full_name: string;
    position: string | null;
  } | null;
}

export async function getAttendanceByDate(
  date: string
): Promise<AttendanceRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hr_attendance")
    .select(`
      *,
      employees (
        id,
        full_name,
        position
      )
    `)
    .eq("attendance_date", date)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Attendance loading error:",
      error
    );

    return [];
  }

  return (data ?? []) as AttendanceRecord[];
}