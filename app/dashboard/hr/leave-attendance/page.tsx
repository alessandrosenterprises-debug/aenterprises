import { createClient } from "@/lib/supabase/server";

import { getEmployees } from "@/modules/employees/services/employee.service";

import { getLeaveTypes } from "@/modules/hr/leave-attendance/services/leave-types.service";

import AttendanceTable from "@/modules/hr/leave-attendance/components/AttendanceTable";

import LeaveRequestsTable from "@/modules/hr/leave-attendance/components/LeaveRequestsTable";

import LeaveTypesTable from "@/modules/hr/leave-attendance/components/LeaveTypesTable";

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  notes: string | null;

  employees?: {
    full_name: string;
    position: string | null;
  } | null;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  notes: string | null;

  employees?: {
    full_name: string;
    position?: string | null;
  } | null;

  hr_leave_types?: {
    name: string;
    is_paid?: boolean;
  } | null;
}

export default async function HRLeaveAttendancePage() {
  const supabase = await createClient();

  const today = new Date()
    .toISOString()
    .split("T")[0];

  /*
   * ============================================================
   * LOAD EMPLOYEES AND LEAVE TYPES
   * ============================================================
   */

  const [employees, leaveTypes] =
    await Promise.all([
      getEmployees(),
      getLeaveTypes(),
    ]);

  /*
   * ============================================================
   * LOAD ATTENDANCE AND LEAVE REQUESTS
   * ============================================================
   */

  const [
    attendanceResult,
    leaveResult,
  ] = await Promise.all([
    supabase
      .from("hr_attendance")
      .select(`
        *,
        employees (
          full_name,
          position
        )
      `)
      .eq("attendance_date", today)
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("hr_leave_requests")
      .select(`
        *,
        employees (
          full_name,
          position
        ),
        hr_leave_types (
          name,
          is_paid
        )
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(50),
  ]);

  /*
   * ============================================================
   * ERROR HANDLING
   * ============================================================
   */

  if (attendanceResult.error) {
    console.error(
      "HR attendance loading error:",
      attendanceResult.error
    );
  }

  if (leaveResult.error) {
    console.error(
      "HR leave requests loading error:",
      leaveResult.error
    );
  }

  /*
   * ============================================================
   * NORMALIZE DATA
   * ============================================================
   */

  const attendance =
    (attendanceResult.data ??
      []) as AttendanceRecord[];

  const leaveRequests =
    (leaveResult.data ??
      []) as LeaveRequest[];

  /*
   * ============================================================
   * ATTENDANCE COUNTS
   *
   * Present includes:
   * - Present
   * - Late
   * - Half Day
   * ============================================================
   */

  const presentCount =
    attendance.filter(
      (record) =>
        record.status === "Present" ||
        record.status === "Late" ||
        record.status === "Half Day"
    ).length;

  const lateCount =
    attendance.filter(
      (record) =>
        record.status === "Late"
    ).length;

  const absentCount =
    attendance.filter(
      (record) =>
        record.status === "Absent"
    ).length;

  const leaveCount =
    attendance.filter(
      (record) =>
        record.status === "Leave"
    ).length;

  /*
   * ============================================================
   * LEAVE COUNTS
   * ============================================================
   */

  const pendingLeaveCount =
    leaveRequests.filter(
      (request) =>
        request.status === "Pending"
    ).length;

  const approvedLeaveCount =
    leaveRequests.filter(
      (request) =>
        request.status === "Approved"
    ).length;

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="space-y-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Leave & Attendance
        </h1>

        <p className="mt-2 text-slate-500">
          Manage employee attendance, leave requests
          and leave types from the HR workspace.
        </p>
      </div>

      {/* =====================================================
          ATTENDANCE SUMMARY
      ===================================================== */}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#03162F]">
            Today&apos;s Attendance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {today}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* PRESENT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Present
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {presentCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Includes late and half-day
            </p>
          </div>

          {/* LATE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Late
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {lateCount}
            </p>
          </div>

          {/* ABSENT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Absent
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {absentCount}
            </p>
          </div>

          {/* ON LEAVE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              On Leave
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {leaveCount}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          ATTENDANCE TABLE
      ===================================================== */}

      <section>
        <AttendanceTable
          attendance={attendance}
          employees={employees}
        />
      </section>

      {/* =====================================================
          LEAVE SUMMARY
      ===================================================== */}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#03162F]">
            Leave Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor employee leave requests and active
            leave types.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* PENDING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Pending Requests
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendingLeaveCount}
            </p>
          </div>

          {/* APPROVED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Approved Requests
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {approvedLeaveCount}
            </p>
          </div>

          {/* ACTIVE LEAVE TYPES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active Leave Types
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {leaveTypes.length}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          LEAVE REQUESTS
      ===================================================== */}

      <section>
        <LeaveRequestsTable
          requests={leaveRequests}
          employees={employees}
          leaveTypes={leaveTypes}
        />
      </section>

      {/* =====================================================
          LEAVE TYPES
      ===================================================== */}

      <section>
  <LeaveTypesTable
    leaveTypes={leaveTypes}
  />
</section>
    </div>
  );
}