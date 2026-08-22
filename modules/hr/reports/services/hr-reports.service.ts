import { createClient } from "@/lib/supabase/server";

export interface HRReportData {
  employees: {
    total: number;
    active: number;
    inactive: number;
    newThisPeriod: number;
  };

  departments: {
    total: number;
    breakdown: {
      id: string;
      name: string;
      employeeCount: number;
    }[];
  };

  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
  };

  leave: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };

  documents: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
    noExpiry: number;
  };

  loans: {
    total: number;
    active: number;
    pending: number;
    completed: number;
    outstanding: number;
  };

  payroll: {
    periods: number;
    runs: number;
    employees: number;
    grossPay: number;
    allowances: number;
    deductions: number;
    tax: number;
    netPay: number;
  };
}

function startOfDay(date: Date) {
  const value = new Date(date);

  value.setHours(0, 0, 0, 0);

  return value;
}

function getPeriodStart(period: string) {
  const now = new Date();

  switch (period) {
    case "today": {
      return startOfDay(now);
    }

    case "week": {
      const date = startOfDay(now);
      const day = date.getDay();

      const difference =
        day === 0 ? 6 : day - 1;

      date.setDate(
        date.getDate() - difference
      );

      return date;
    }

    case "quarter": {
      const date = startOfDay(now);
      const quarterStart =
        Math.floor(date.getMonth() / 3) * 3;

      date.setMonth(
        quarterStart,
        1
      );

      return date;
    }

    case "year": {
      const date = startOfDay(now);

      date.setMonth(0, 1);

      return date;
    }

    case "month":
    default: {
      const date = startOfDay(now);

      date.setDate(1);

      return date;
    }
  }
}

function getPeriodEnd() {
  const date = new Date();

  date.setHours(
    23,
    59,
    59,
    999
  );

  return date;
}

export async function getHRReportData(
  period = "month"
): Promise<HRReportData> {
  const supabase = await createClient();

  const periodStart =
    getPeriodStart(period);

  const periodEnd =
    getPeriodEnd();

  const startDate =
    periodStart
      .toISOString()
      .split("T")[0];

  const endDate =
    periodEnd
      .toISOString()
      .split("T")[0];

  const [
    employeesResult,
    departmentsResult,
    attendanceResult,
    leaveResult,
    documentsResult,
    loansResult,
    payrollPeriodsResult,
    payrollRunsResult,
    payrollEntriesResult,
  ] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "id, department_id, is_active, status, date_joined"
      ),

    supabase
      .from("departments")
      .select(
        "id, name"
      )
      .order("name"),

    supabase
      .from("hr_attendance")
      .select(
        "id, employee_id, attendance_date, status"
      )
      .gte(
        "attendance_date",
        startDate
      )
      .lte(
        "attendance_date",
        endDate
      ),

    supabase
      .from("hr_leave_requests")
      .select(
        "id, employee_id, start_date, end_date, status"
      )
      .or(
        `start_date.lte.${endDate},end_date.gte.${startDate}`
      ),

    supabase
      .from("hr_employee_documents")
      .select(
        "id, expiry_date, status"
      ),

    supabase
      .from("hr_employee_loans")
      .select(
        "id, status, outstanding_balance"
      ),

    supabase
      .from("hr_payroll_periods")
      .select("id"),

    supabase
      .from("hr_payroll_runs")
      .select("id"),

    supabase
      .from("hr_payroll_entries")
      .select(
        "employee_id, gross_pay, total_allowances, total_deductions, total_tax, net_pay"
      ),
  ]);

  if (employeesResult.error) {
    throw new Error(
      `Failed to load employees: ${employeesResult.error.message}`
    );
  }

  if (departmentsResult.error) {
    throw new Error(
      `Failed to load departments: ${departmentsResult.error.message}`
    );
  }

  if (attendanceResult.error) {
    throw new Error(
      `Failed to load attendance: ${attendanceResult.error.message}`
    );
  }

  if (leaveResult.error) {
    throw new Error(
      `Failed to load leave: ${leaveResult.error.message}`
    );
  }

  if (documentsResult.error) {
    throw new Error(
      `Failed to load documents: ${documentsResult.error.message}`
    );
  }

  if (loansResult.error) {
    throw new Error(
      `Failed to load loans: ${loansResult.error.message}`
    );
  }

  if (payrollPeriodsResult.error) {
    throw new Error(
      `Failed to load payroll periods: ${payrollPeriodsResult.error.message}`
    );
  }

  if (payrollRunsResult.error) {
    throw new Error(
      `Failed to load payroll runs: ${payrollRunsResult.error.message}`
    );
  }

  if (payrollEntriesResult.error) {
    throw new Error(
      `Failed to load payroll entries: ${payrollEntriesResult.error.message}`
    );
  }

  const employees =
    employeesResult.data ?? [];

  const departments =
    departmentsResult.data ?? [];

  const attendance =
    attendanceResult.data ?? [];

  const leaveRequests =
    leaveResult.data ?? [];

  const documents =
    documentsResult.data ?? [];

  const loans =
    loansResult.data ?? [];

  const payrollPeriods =
    payrollPeriodsResult.data ?? [];

  const payrollRuns =
    payrollRunsResult.data ?? [];

  const payrollEntries =
    payrollEntriesResult.data ?? [];

  /* ==========================================================
     EMPLOYEES
  ========================================================== */

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.is_active === true ||
        employee.status === "Active"
    );

  const inactiveEmployees =
    employees.length -
    activeEmployees.length;

  const newEmployees =
    employees.filter((employee) => {
      if (!employee.date_joined) {
        return false;
      }

      return (
        employee.date_joined >=
          startDate &&
        employee.date_joined <=
          endDate
      );
    }).length;

  /* ==========================================================
     DEPARTMENTS
  ========================================================== */

  const departmentBreakdown =
    departments.map(
      (department) => ({
        id: department.id,
        name: department.name,
        employeeCount:
          employees.filter(
            (employee) =>
              employee.department_id ===
              department.id
          ).length,
      })
    );

  /* ==========================================================
     ATTENDANCE
  ========================================================== */

  const present =
    attendance.filter(
      (record) =>
        record.status?.toLowerCase() ===
        "present"
    ).length;

  const absent =
    attendance.filter(
      (record) =>
        record.status?.toLowerCase() ===
        "absent"
    ).length;

  const late =
    attendance.filter(
      (record) =>
        record.status?.toLowerCase() ===
        "late"
    ).length;

  const attendanceLeave =
    attendance.filter(
      (record) =>
        record.status?.toLowerCase() ===
        "leave"
    ).length;

  /* ==========================================================
     LEAVE
  ========================================================== */

  const pendingLeave =
    leaveRequests.filter(
      (request) =>
        request.status ===
        "Pending"
    ).length;

  const approvedLeave =
    leaveRequests.filter(
      (request) =>
        request.status ===
        "Approved"
    ).length;

  const rejectedLeave =
    leaveRequests.filter(
      (request) =>
        request.status ===
        "Rejected"
    ).length;

  /* ==========================================================
     DOCUMENTS
  ========================================================== */

  const today =
    startOfDay(new Date());

  const thirtyDays =
    new Date(today);

  thirtyDays.setDate(
    thirtyDays.getDate() + 30
  );

  const expiredDocuments =
    documents.filter(
      (document) => {
        if (!document.expiry_date) {
          return false;
        }

        return (
          new Date(
            `${document.expiry_date}T00:00:00`
          ) < today
        );
      }
    ).length;

  const expiringDocuments =
    documents.filter(
      (document) => {
        if (!document.expiry_date) {
          return false;
        }

        const expiry =
          new Date(
            `${document.expiry_date}T00:00:00`
          );

        return (
          expiry >= today &&
          expiry <= thirtyDays
        );
      }
    ).length;

  const noExpiryDocuments =
    documents.filter(
      (document) =>
        !document.expiry_date
    ).length;

  const activeDocuments =
    documents.filter(
      (document) =>
        document.status ===
        "Active" &&
        !(
          document.expiry_date &&
          new Date(
            `${document.expiry_date}T00:00:00`
          ) < today
        )
    ).length;

  /* ==========================================================
     LOANS
  ========================================================== */

  const activeLoans =
    loans.filter(
      (loan) =>
        loan.status === "Active"
    ).length;

  const pendingLoans =
    loans.filter(
      (loan) =>
        loan.status === "Pending"
    ).length;

  const completedLoans =
    loans.filter(
      (loan) =>
        loan.status ===
        "Completed"
    ).length;

  const outstandingLoans =
    loans.reduce(
      (total, loan) =>
        total +
        Number(
          loan.outstanding_balance ?? 0
        ),
      0
    );

  /* ==========================================================
     PAYROLL
  ========================================================== */

  const payrollTotals =
    payrollEntries.reduce(
      (totals, entry) => ({
        grossPay:
          totals.grossPay +
          Number(entry.gross_pay ?? 0),

        allowances:
          totals.allowances +
          Number(
            entry.total_allowances ?? 0
          ),

        deductions:
          totals.deductions +
          Number(
            entry.total_deductions ?? 0
          ),

        tax:
          totals.tax +
          Number(
            entry.total_tax ?? 0
          ),

        netPay:
          totals.netPay +
          Number(entry.net_pay ?? 0),
      }),
      {
        grossPay: 0,
        allowances: 0,
        deductions: 0,
        tax: 0,
        netPay: 0,
      }
    );

  return {
    employees: {
      total: employees.length,
      active: activeEmployees.length,
      inactive: inactiveEmployees,
      newThisPeriod: newEmployees,
    },

    departments: {
      total: departments.length,
      breakdown:
        departmentBreakdown,
    },

    attendance: {
      total: attendance.length,
      present,
      absent,
      late,
      leave: attendanceLeave,
    },

    leave: {
      total: leaveRequests.length,
      pending: pendingLeave,
      approved: approvedLeave,
      rejected: rejectedLeave,
    },

    documents: {
      total: documents.length,
      active: activeDocuments,
      expiring: expiringDocuments,
      expired: expiredDocuments,
      noExpiry: noExpiryDocuments,
    },

    loans: {
      total: loans.length,
      active: activeLoans,
      pending: pendingLoans,
      completed: completedLoans,
      outstanding: outstandingLoans,
    },

    payroll: {
      periods: payrollPeriods.length,
      runs: payrollRuns.length,
      employees:
        new Set(
          payrollEntries.map(
            (entry) =>
              entry.employee_id
          )
        ).size,
      ...payrollTotals,
    },
  };
}