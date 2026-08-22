import { createClient } from "@/lib/supabase/server";

/* ============================================================
   TYPES
============================================================ */

export interface DepartmentReportData {
  department: {
    id: string;
    name: string;
    description: string | null;
    status: string | null;
  };

  period: {
    key: string;
    label: string;
    start: string;
    end: string;
  };

  totals: {
    employees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    newEmployees: number;

    attendance: number;
    present: number;
    absent: number;
    late: number;
    attendanceLeave: number;

    leaveRequests: number;
    pendingLeave: number;
    approvedLeave: number;
    rejectedLeave: number;

    documents: number;
    expiredDocuments: number;
    expiringDocuments: number;

    loans: number;
    activeLoans: number;
    pendingLoans: number;
    completedLoans: number;
    outstandingLoans: number;

    payrollEmployees: number;
    grossPay: number;
    allowances: number;
    deductions: number;
    tax: number;
    netPay: number;
    overtimeAmount: number;
  };

  employees: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    gender: string | null;
    date_of_birth: string | null;
    national_id: string | null;
    address: string | null;
    position: string | null;
    employment_type: string | null;
    salary: number;
    date_joined: string | null;
    notes: string | null;
    is_active: boolean;
    status: string | null;
  }[];

  attendance: {
    id: string;
    employee_id: string;
    employee_name: string;
    attendance_date: string;
    check_in: string | null;
    check_out: string | null;
    status: string | null;
    notes: string | null;
  }[];

  leave: {
    id: string;
    employee_id: string;
    employee_name: string;
    leave_type_id: string | null;
    start_date: string;
    end_date: string;
    days: number;
    reason: string | null;
    status: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
    notes: string | null;
  }[];

  documents: {
    id: string;
    employee_id: string;
    employee_name: string;
    document_type: string;
    document_name: string;
    description: string | null;
    issue_date: string | null;
    expiry_date: string | null;
    status: string | null;
    notes: string | null;
  }[];

  loans: {
    id: string;
    employee_id: string;
    employee_name: string;
    loan_product_id: string | null;
    loan_type: string | null;
    principal_amount: number;
    interest_rate: number;
    total_payable: number;
    repayment_period: number;
    monthly_installment: number;
    application_date: string | null;
    start_date: string | null;
    amount_paid: number;
    outstanding_balance: number;
    status: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
    notes: string | null;
  }[];

  payroll: {
    id: string;
    employee_id: string;
    employee_name: string;
    payroll_run_id: string;
    basic_salary: number;
    taxable_pay: number;
    gross_pay: number;
    total_allowances: number;
    total_deductions: number;
    total_tax: number;
    net_pay: number;
    days_worked: number;
    days_absent: number;
    unpaid_leave_days: number;
    overtime_hours: number;
    overtime_amount: number;
    status: string | null;
    notes: string | null;
  }[];
}

/* ============================================================
   PERIOD TYPES
============================================================ */

export type DepartmentReportPeriod =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "custom";

/* ============================================================
   HELPERS
============================================================ */

function startOfPeriod(
  period: DepartmentReportPeriod
): Date {
  const now = new Date();

  switch (period) {
    case "today": {
      const date = new Date(now);

      date.setHours(
        0,
        0,
        0,
        0
      );

      return date;
    }

    case "week": {
      const date = new Date(now);

      date.setHours(
        0,
        0,
        0,
        0
      );

      const day = date.getDay();

      const difference =
        day === 0
          ? 6
          : day - 1;

      date.setDate(
        date.getDate() -
          difference
      );

      return date;
    }

    case "quarter": {
      const date = new Date(now);

      date.setHours(
        0,
        0,
        0,
        0
      );

      const quarterStart =
        Math.floor(
          date.getMonth() / 3
        ) * 3;

      date.setMonth(
        quarterStart,
        1
      );

      return date;
    }

    case "year": {
      const date = new Date(now);

      date.setHours(
        0,
        0,
        0,
        0
      );

      date.setMonth(
        0,
        1
      );

      return date;
    }

    case "custom":
      return new Date(now);

    case "month":
    default: {
      const date = new Date(now);

      date.setHours(
        0,
        0,
        0,
        0
      );

      date.setDate(1);

      return date;
    }
  }
}

function endOfPeriod(): Date {
  const date = new Date();

  date.setHours(
    23,
    59,
    59,
    999
  );

  return date;
}

function dateOnly(
  date: Date
): string {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function numberValue(
  value: unknown
): number {
  const number =
    Number(value ?? 0);

  return Number.isFinite(number)
    ? number
    : 0;
}

function isValidDateOnly(
  value: string
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false;
  }

  const parsed =
    new Date(
      `${value}T00:00:00`
    );

  return (
    !Number.isNaN(
      parsed.getTime()
    ) &&
    dateOnly(parsed) === value
  );
}

function periodLabel(
  period: DepartmentReportPeriod,
  startDate?: string,
  endDate?: string
): string {
  switch (period) {
    case "today":
      return "Today";

    case "week":
      return "This Week";

    case "quarter":
      return "This Quarter";

    case "year":
      return "This Year";

    case "custom":
      if (
        startDate &&
        endDate
      ) {
        return `${startDate} to ${endDate}`;
      }

      return "Custom Date Range";

    case "month":
    default:
      return "This Month";
  }
}

/* ============================================================
   DEPARTMENT REPORT
============================================================ */

export async function getDepartmentReportData(
  departmentId: string,
  period: DepartmentReportPeriod = "month",
  customStartDate?: string | null,
  customEndDate?: string | null
): Promise<DepartmentReportData> {
  const supabase =
    await createClient();

  if (!departmentId) {
    throw new Error(
      "Department ID is required."
    );
  }

  /* ==========================================================
     RESOLVE REPORTING PERIOD
  ========================================================== */

  let startDate: string;
  let endDate: string;

  if (period === "custom") {
    if (
      !customStartDate ||
      !customEndDate
    ) {
      throw new Error(
        "Both From Date and To Date are required for a custom reporting period."
      );
    }

    if (
      !isValidDateOnly(
        customStartDate
      )
    ) {
      throw new Error(
        "The From Date is invalid."
      );
    }

    if (
      !isValidDateOnly(
        customEndDate
      )
    ) {
      throw new Error(
        "The To Date is invalid."
      );
    }

    if (
      customStartDate >
      customEndDate
    ) {
      throw new Error(
        "The From Date cannot be later than the To Date."
      );
    }

    startDate =
      customStartDate;

    endDate =
      customEndDate;
  } else {
    const periodStart =
      startOfPeriod(period);

    const periodEnd =
      endOfPeriod();

    startDate =
      dateOnly(periodStart);

    endDate =
      dateOnly(periodEnd);
  }

  const resolvedPeriodLabel =
    periodLabel(
      period,
      startDate,
      endDate
    );

  /* ==========================================================
     LOAD DEPARTMENT
  ========================================================== */

  const departmentResult =
    await supabase
      .from("departments")
      .select(
        "id, name, description, status"
      )
      .eq(
        "id",
        departmentId
      )
      .single();

  if (
    departmentResult.error
  ) {
    throw new Error(
      `Failed to load department: ${departmentResult.error.message}`
    );
  }

  const department =
  departmentResult.data;

console.log(
  "[HR REPORT DEBUG] departmentId:",
  JSON.stringify(departmentId)
);

console.log(
  "[HR REPORT DEBUG] department:",
  JSON.stringify(department, null, 2)
);

/* ==========================================================
   LOAD EMPLOYEES
========================================================== */

  /* ==========================================================
     LOAD EMPLOYEES
  ========================================================== */

 const employeesResult =
  await supabase
    .from("employees")
    .select(
  `
    id,
    full_name,
    phone,
    email,
    gender,
    date_of_birth,
    national_id,
    address,
    position,
    employment_type,
    salary,
    date_joined,
    notes,
    is_active,
    status,
    department_id
  `
)
    .eq(
      "department_id",
      departmentId
    )
    .order(
      "full_name"
    );

  if (
  employeesResult.error
) {
  throw new Error(
    `Failed to load department employees: ${employeesResult.error.message}`
  );
}



const employees =
  (
    employeesResult.data ??
    []
  ).map(
      (employee) => ({
        id: employee.id,

        full_name:
          employee.full_name,

        phone:
          employee.phone,

        email:
          employee.email,

        gender:
          employee.gender,

        date_of_birth:
          employee.date_of_birth,

        national_id:
          employee.national_id,

        address:
          employee.address,

        position:
          employee.position,

        employment_type:
          employee.employment_type,

        salary:
          numberValue(
            employee.salary
          ),

        date_joined:
          employee.date_joined,

        notes:
          employee.notes,

        is_active:
          employee.is_active ===
          true,

        status:
          employee.status,
      })
    );

  const employeeIds =
    employees.map(
      (employee) =>
        employee.id
    );

  /* ==========================================================
     EMPTY DEPARTMENT
  ========================================================== */

  if (
    employeeIds.length ===
    0
  ) {
    return {
      department: {
        id:
          department.id,

        name:
          department.name,

        description:
          department.description,

        status:
          department.status,
      },

      period: {
        key: period,

        label:
          resolvedPeriodLabel,

        start:
          startDate,

        end:
          endDate,
      },

      totals: {
        employees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        newEmployees: 0,

        attendance: 0,
        present: 0,
        absent: 0,
        late: 0,
        attendanceLeave: 0,

        leaveRequests: 0,
        pendingLeave: 0,
        approvedLeave: 0,
        rejectedLeave: 0,

        documents: 0,
        expiredDocuments: 0,
        expiringDocuments: 0,

        loans: 0,
        activeLoans: 0,
        pendingLoans: 0,
        completedLoans: 0,
        outstandingLoans: 0,

        payrollEmployees: 0,
        grossPay: 0,
        allowances: 0,
        deductions: 0,
        tax: 0,
        netPay: 0,
        overtimeAmount: 0,
      },

      employees: [],
      attendance: [],
      leave: [],
      documents: [],
      loans: [],
      payroll: [],
    };
  }

  /* ==========================================================
     LOAD DEPARTMENT DATA
  ========================================================== */

  const [
    attendanceResult,
    leaveResult,
    documentsResult,
    loansResult,
    payrollResult,
  ] = await Promise.all([
    supabase
      .from("hr_attendance")
      .select(
        `
          id,
          employee_id,
          attendance_date,
          check_in,
          check_out,
          status,
          notes
        `
      )
      .in(
        "employee_id",
        employeeIds
      )
      .gte(
        "attendance_date",
        startDate
      )
      .lte(
        "attendance_date",
        endDate
      )
      .order(
        "attendance_date",
        {
          ascending: false,
        }
      ),

    supabase
      .from("hr_leave_requests")
      .select(
        `
          id,
          employee_id,
          leave_type_id,
          start_date,
          end_date,
          days,
          reason,
          status,
          approved_at,
          rejection_reason,
          notes
        `
      )
      .in(
        "employee_id",
        employeeIds
      )
      .or(
        `start_date.lte.${endDate},end_date.gte.${startDate}`
      )
      .order(
        "start_date",
        {
          ascending: false,
        }
      ),

    supabase
      .from(
        "hr_employee_documents"
      )
      .select(
        `
          id,
          employee_id,
          document_type,
          document_name,
          description,
          issue_date,
          expiry_date,
          status,
          notes
        `
      )
      .in(
        "employee_id",
        employeeIds
      )
      .order(
        "expiry_date",
        {
          ascending: true,
        }
      ),

    supabase
      .from(
        "hr_employee_loans"
      )
      .select(
        `
          id,
          employee_id,
          loan_product_id,
          loan_type,
          principal_amount,
          interest_rate,
          total_payable,
          repayment_period,
          monthly_installment,
          application_date,
          start_date,
          amount_paid,
          outstanding_balance,
          status,
          approved_at,
          rejection_reason,
          notes
        `
      )
      .in(
        "employee_id",
        employeeIds
      )
      .order(
        "application_date",
        {
          ascending: false,
        }
      ),

    supabase
      .from(
        "hr_payroll_entries"
      )
      .select(
        `
          id,
          employee_id,
          payroll_run_id,
          basic_salary,
          taxable_pay,
          gross_pay,
          total_allowances,
          total_deductions,
          total_tax,
          net_pay,
          days_worked,
          days_absent,
          unpaid_leave_days,
          overtime_hours,
          overtime_amount,
          status,
          notes
        `
      )
      .in(
        "employee_id",
        employeeIds
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      ),
  ]);

  /* ==========================================================
     ERROR HANDLING
  ========================================================== */

  if (
    attendanceResult.error
  ) {
    throw new Error(
      `Failed to load attendance: ${attendanceResult.error.message}`
    );
  }

  if (
    leaveResult.error
  ) {
    throw new Error(
      `Failed to load leave requests: ${leaveResult.error.message}`
    );
  }

  if (
    documentsResult.error
  ) {
    throw new Error(
      `Failed to load employee documents: ${documentsResult.error.message}`
    );
  }

  if (
    loansResult.error
  ) {
    throw new Error(
      `Failed to load employee loans: ${loansResult.error.message}`
    );
  }

  if (
    payrollResult.error
  ) {
    throw new Error(
      `Failed to load payroll entries: ${payrollResult.error.message}`
    );
  }

  /* ==========================================================
     EMPLOYEE LOOKUP
  ========================================================== */

  const employeeNames =
    new Map(
      employees.map(
        (employee) => [
          employee.id,
          employee.full_name,
        ]
      )
    );

  /* ==========================================================
     ATTENDANCE
  ========================================================== */

  const attendance =
    (
      attendanceResult.data ??
      []
    ).map(
      (record) => ({
        id:
          record.id,

        employee_id:
          record.employee_id,

        employee_name:
          employeeNames.get(
            record.employee_id
          ) ??
          "Unknown Employee",

        attendance_date:
          record.attendance_date,

        check_in:
          record.check_in,

        check_out:
          record.check_out,

        status:
          record.status,

        notes:
          record.notes,
      })
    );

  /* ==========================================================
     LEAVE
  ========================================================== */

  const leave =
    (
      leaveResult.data ??
      []
    ).map(
      (record) => ({
        id:
          record.id,

        employee_id:
          record.employee_id,

        employee_name:
          employeeNames.get(
            record.employee_id
          ) ??
          "Unknown Employee",

        leave_type_id:
          record.leave_type_id,

        start_date:
          record.start_date,

        end_date:
          record.end_date,

        days:
          numberValue(
            record.days
          ),

        reason:
          record.reason,

        status:
          record.status,

        approved_at:
          record.approved_at,

        rejection_reason:
          record.rejection_reason,

        notes:
          record.notes,
      })
    );

  /* ==========================================================
     DOCUMENTS
  ========================================================== */

  const documents =
    (
      documentsResult.data ??
      []
    ).map(
      (record) => ({
        id:
          record.id,

        employee_id:
          record.employee_id,

        employee_name:
          employeeNames.get(
            record.employee_id
          ) ??
          "Unknown Employee",

        document_type:
          record.document_type,

        document_name:
          record.document_name,

        description:
          record.description,

        issue_date:
          record.issue_date,

        expiry_date:
          record.expiry_date,

        status:
          record.status,

        notes:
          record.notes,
      })
    );

  /* ==========================================================
     LOANS
  ========================================================== */

  const loans =
    (
      loansResult.data ??
      []
    ).map(
      (record) => ({
        id:
          record.id,

        employee_id:
          record.employee_id,

        employee_name:
          employeeNames.get(
            record.employee_id
          ) ??
          "Unknown Employee",

        loan_product_id:
          record.loan_product_id,

        loan_type:
          record.loan_type,

        principal_amount:
          numberValue(
            record.principal_amount
          ),

        interest_rate:
          numberValue(
            record.interest_rate
          ),

        total_payable:
          numberValue(
            record.total_payable
          ),

        repayment_period:
          numberValue(
            record.repayment_period
          ),

        monthly_installment:
          numberValue(
            record.monthly_installment
          ),

        application_date:
          record.application_date,

        start_date:
          record.start_date,

        amount_paid:
          numberValue(
            record.amount_paid
          ),

        outstanding_balance:
          numberValue(
            record.outstanding_balance
          ),

        status:
          record.status,

        approved_at:
          record.approved_at,

        rejection_reason:
          record.rejection_reason,

        notes:
          record.notes,
      })
    );

  /* ==========================================================
     PAYROLL
  ========================================================== */

  const payroll =
    (
      payrollResult.data ??
      []
    ).map(
      (entry) => ({
        id:
          entry.id,

        employee_id:
          entry.employee_id,

        employee_name:
          employeeNames.get(
            entry.employee_id
          ) ??
          "Unknown Employee",

        payroll_run_id:
          entry.payroll_run_id,

        basic_salary:
          numberValue(
            entry.basic_salary
          ),

        taxable_pay:
          numberValue(
            entry.taxable_pay
          ),

        gross_pay:
          numberValue(
            entry.gross_pay
          ),

        total_allowances:
          numberValue(
            entry.total_allowances
          ),

        total_deductions:
          numberValue(
            entry.total_deductions
          ),

        total_tax:
          numberValue(
            entry.total_tax
          ),

        net_pay:
          numberValue(
            entry.net_pay
          ),

        days_worked:
          numberValue(
            entry.days_worked
          ),

        days_absent:
          numberValue(
            entry.days_absent
          ),

        unpaid_leave_days:
          numberValue(
            entry.unpaid_leave_days
          ),

        overtime_hours:
          numberValue(
            entry.overtime_hours
          ),

        overtime_amount:
          numberValue(
            entry.overtime_amount
          ),

        status:
          entry.status,

        notes:
          entry.notes,
      })
    );

  /* ==========================================================
     EMPLOYEE STATISTICS
  ========================================================== */

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.is_active ===
          true ||
        employee.status ===
          "Active"
    ).length;

  const inactiveEmployees =
    employees.length -
    activeEmployees;

  const newEmployees =
    employees.filter(
      (employee) => {
        if (
          !employee.date_joined
        ) {
          return false;
        }

        return (
          employee.date_joined >=
            startDate &&
          employee.date_joined <=
            endDate
        );
      }
    ).length;

  /* ==========================================================
     ATTENDANCE STATISTICS
  ========================================================== */

  const present =
    attendance.filter(
      (record) =>
        record.status
          ?.toLowerCase() ===
        "present"
    ).length;

  const absent =
    attendance.filter(
      (record) =>
        record.status
          ?.toLowerCase() ===
        "absent"
    ).length;

  const late =
    attendance.filter(
      (record) =>
        record.status
          ?.toLowerCase() ===
        "late"
    ).length;

  const attendanceLeave =
    attendance.filter(
      (record) =>
        record.status
          ?.toLowerCase() ===
        "leave"
    ).length;

  /* ==========================================================
     LEAVE STATISTICS
  ========================================================== */

  const pendingLeave =
    leave.filter(
      (record) =>
        record.status
          ?.toLowerCase() ===
        "pending"
    ).length;

  const approvedLeave =
    leave.filter(
      (record) =>
        record.status
          ?.toLowerCase() ===
        "approved"
    ).length;

  const rejectedLeave =
    leave.filter(
      (record) =>
        record.status
          ?.toLowerCase() ===
        "rejected"
    ).length;

  /* ==========================================================
     DOCUMENT STATISTICS
  ========================================================== */

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const thirtyDaysFromToday =
    new Date(today);

  thirtyDaysFromToday.setDate(
    thirtyDaysFromToday.getDate() +
      30
  );

  const expiredDocuments =
    documents.filter(
      (document) => {
        if (
          !document.expiry_date
        ) {
          return false;
        }

        const expiry =
          new Date(
            `${document.expiry_date}T00:00:00`
          );

        return (
          expiry < today
        );
      }
    ).length;

  const expiringDocuments =
    documents.filter(
      (document) => {
        if (
          !document.expiry_date
        ) {
          return false;
        }

        const expiry =
          new Date(
            `${document.expiry_date}T00:00:00`
          );

        return (
          expiry >= today &&
          expiry <=
            thirtyDaysFromToday
        );
      }
    ).length;

  /* ==========================================================
     LOAN STATISTICS
  ========================================================== */

  const activeLoans =
    loans.filter(
      (loan) =>
        loan.status
          ?.toLowerCase() ===
        "active"
    ).length;

  const pendingLoans =
    loans.filter(
      (loan) =>
        loan.status
          ?.toLowerCase() ===
        "pending"
    ).length;

  const completedLoans =
    loans.filter(
      (loan) =>
        loan.status
          ?.toLowerCase() ===
        "completed"
    ).length;

  const outstandingLoans =
    loans.reduce(
      (
        total,
        loan
      ) =>
        total +
        loan.outstanding_balance,
      0
    );

  /* ==========================================================
     PAYROLL TOTALS
  ========================================================== */

  const payrollTotals =
    payroll.reduce(
      (
        totals,
        entry
      ) => ({
        grossPay:
          totals.grossPay +
          entry.gross_pay,

        allowances:
          totals.allowances +
          entry.total_allowances,

        deductions:
          totals.deductions +
          entry.total_deductions,

        tax:
          totals.tax +
          entry.total_tax,

        netPay:
          totals.netPay +
          entry.net_pay,

        overtimeAmount:
          totals.overtimeAmount +
          entry.overtime_amount,
      }),
      {
        grossPay: 0,
        allowances: 0,
        deductions: 0,
        tax: 0,
        netPay: 0,
        overtimeAmount: 0,
      }
    );

  /* ==========================================================
     FINAL REPORT
  ========================================================== */

  return {
    department: {
      id:
        department.id,

      name:
        department.name,

      description:
        department.description,

      status:
        department.status,
    },

    period: {
      key:
        period,

      label:
        resolvedPeriodLabel,

      start:
        startDate,

      end:
        endDate,
    },

    totals: {
      employees:
        employees.length,

      activeEmployees,

      inactiveEmployees,

      newEmployees,

      attendance:
        attendance.length,

      present,

      absent,

      late,

      attendanceLeave,

      leaveRequests:
        leave.length,

      pendingLeave,

      approvedLeave,

      rejectedLeave,

      documents:
        documents.length,

      expiredDocuments,

      expiringDocuments,

      loans:
        loans.length,

      activeLoans,

      pendingLoans,

      completedLoans,

      outstandingLoans,

      payrollEmployees:
        new Set(
          payroll.map(
            (entry) =>
              entry.employee_id
          )
        ).size,

      grossPay:
        payrollTotals.grossPay,

      allowances:
        payrollTotals.allowances,

      deductions:
        payrollTotals.deductions,

      tax:
        payrollTotals.tax,

      netPay:
        payrollTotals.netPay,

      overtimeAmount:
        payrollTotals.overtimeAmount,
    },

    employees,

    attendance,

    leave,

    documents,

    loans,

    payroll,
  };
}