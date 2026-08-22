import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { createClient } from "@/lib/supabase/server";

import type { DepartmentReportData } from "./hr-department-report.service";

const NAVY = "03162F";
const GOLD = "B8860B";
const LIGHT_GRAY = "F3F4F6";
const DARK_GRAY = "374151";
const WHITE = "FFFFFF";

/* ============================================================
   REPORT TYPES
============================================================ */

export type HRReportType =
  | "department"
  | "employees"
  | "attendance"
  | "leave"
  | "documents"
  | "loans"
  | "payroll";

/* ============================================================
   REPORT TYPE LABELS
============================================================ */

function reportTypeLabel(
  reportType: HRReportType
) {
  switch (reportType) {
    case "employees":
      return "EMPLOYEE REPORT";

    case "attendance":
      return "ATTENDANCE REPORT";

    case "leave":
      return "LEAVE MANAGEMENT REPORT";

    case "documents":
      return "DOCUMENTS & COMPLIANCE REPORT";

    case "loans":
      return "LOANS & ADVANCES REPORT";

    case "payroll":
      return "PAYROLL REPORT";

    case "department":
    default:
      return "DEPARTMENT OPERATIONS REPORT";
  }
}

function reportTypeDescription(
  reportType: HRReportType
) {
  switch (reportType) {
    case "employees":
      return "Detailed employee register and employment information.";

    case "attendance":
      return "Attendance records, check-in/out times, absences, lateness and leave.";

    case "leave":
      return "Leave requests, dates, days, approvals, rejections and reasons.";

    case "documents":
      return "Employee documents, issue dates, expiry dates and compliance status.";

    case "loans":
      return "Employee loans, repayments, outstanding balances and statuses.";

    case "payroll":
      return "Payroll entries, salaries, allowances, deductions, tax, net pay and overtime.";

    case "department":
    default:
      return "Complete department operations, employees, attendance, leave, documents, loans and payroll.";
  }
}

/* ============================================================
   HELPERS
============================================================ */

function money(value: number) {
  return `ZMW ${Number(value ?? 0).toLocaleString(
    "en-ZM",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function date(
  value: string | null | undefined
) {
  if (!value) return "—";

  const parsed = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(
    "en-ZM",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function dateTime(
  value: string | null | undefined
) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(
    "en-ZM",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function cell(
  text: string,
  options?: {
    bold?: boolean;
    color?: string;
    fill?: string;
  }
) {
  return new TableCell({
    shading: options?.fill
      ? {
          type: ShadingType.CLEAR,
          fill: options.fill,
        }
      : undefined,

    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold:
              options?.bold ?? false,
            color:
              options?.color ??
              DARK_GRAY,
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function headerCell(text: string) {
  return cell(text, {
    bold: true,
    color: WHITE,
    fill: NAVY,
  });
}

function makeTable(
  headers: string[],
  rows: string[][]
) {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },

    rows: [
      new TableRow({
        children:
          headers.map(headerCell),
      }),

      ...rows.map(
        (row) =>
          new TableRow({
            children:
              row.map((value) =>
                cell(value)
              ),
          })
      ),
    ],
  });
}

function metricTable(
  metrics: Array<{
    label: string;
    value: string | number;
  }>
) {
  const rows: TableRow[] = [];

  for (
    let index = 0;
    index < metrics.length;
    index += 2
  ) {
    const first =
      metrics[index];

    const second =
      metrics[index + 1];

    rows.push(
      new TableRow({
        children: [
          cell(first.label, {
            bold: true,
            fill: LIGHT_GRAY,
          }),

          cell(
            String(first.value),
            {
              bold: true,
              color: NAVY,
            }
          ),

          second
            ? cell(second.label, {
                bold: true,
                fill: LIGHT_GRAY,
              })
            : cell(""),

          second
            ? cell(
                String(
                  second.value
                ),
                {
                  bold: true,
                  color: NAVY,
                }
              )
            : cell(""),
        ],
      })
    );
  }

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows,
  });
}

function sectionTitle(
  title: string,
  description?: string
) {
  const result: Paragraph[] = [
    new Paragraph({
      text: title,
      heading:
        HeadingLevel.HEADING_1,
      spacing: {
        before: 360,
        after: 120,
      },
      thematicBreak: true,
    }),
  ];

  if (description) {
    result.push(
      new Paragraph({
        children: [
          new TextRun({
            text: description,
            color: DARK_GRAY,
            size: 20,
          }),
        ],
        spacing: {
          after: 180,
        },
      })
    );
  }

  return result;
}

function employeeName(
  report: DepartmentReportData,
  employeeId: string
) {
  return (
    report.employees.find(
      (employee) =>
        employee.id ===
        employeeId
    )?.full_name ??
    "Unknown Employee"
  );
}

/* ============================================================
   COMPANY LOGO
============================================================ */

type LogoType =
  | "png"
  | "jpg"
  | "gif"
  | "bmp";

interface CompanyLogo {
  data: Uint8Array;
  type: LogoType;
}

async function getCompanyLogo(): Promise<
  CompanyLogo | null
> {
  try {
    const supabase =
      await createClient();

    const result =
      await supabase
        .from("company_settings")
        .select("logo_url")
        .eq(
          "singleton_key",
          "default"
        )
        .maybeSingle();

    if (
      result.error ||
      !result.data?.logo_url
    ) {
      return null;
    }

    const logoUrl =
      String(
        result.data.logo_url
      ).trim();

    if (!logoUrl) {
      return null;
    }

    const response =
      await fetch(logoUrl, {
        cache: "no-store",
      });

    if (!response.ok) {
      console.warn(
        "Unable to download company logo:",
        response.status
      );

      return null;
    }

    const contentType =
      response.headers
        .get("content-type")
        ?.toLowerCase() ?? "";

    let type: LogoType =
      "png";

    if (
      contentType.includes(
        "jpeg"
      ) ||
      contentType.includes(
        "jpg"
      )
    ) {
      type = "jpg";
    } else if (
      contentType.includes("gif")
    ) {
      type = "gif";
    } else if (
      contentType.includes("bmp")
    ) {
      type = "bmp";
    } else {
      type = "png";
    }

    const buffer =
      await response.arrayBuffer();

    if (!buffer.byteLength) {
      return null;
    }

    return {
      data: new Uint8Array(
        buffer
      ),
      type,
    };
  } catch (error) {
    console.warn(
      "Failed to load company logo:",
      error
    );

    return null;
  }
}

/* ============================================================
   EMPLOYEE REPORT
============================================================ */

function addEmployeeReport(
  children: Array<
    Paragraph | Table
  >,
  report: DepartmentReportData
) {
  children.push(
    ...sectionTitle(
      "1. Employee Register",
      "Complete employee listing for the selected department."
    )
  );

  children.push(
    metricTable([
      {
        label: "Total Employees",
        value:
          report.totals
            .employees,
      },
      {
        label: "Active Employees",
        value:
          report.totals
            .activeEmployees,
      },
      {
        label: "Inactive Employees",
        value:
          report.totals
            .inactiveEmployees,
      },
      {
        label: "New Employees",
        value:
          report.totals
            .newEmployees,
      },
    ])
  );

  if (!report.employees.length) {
    children.push(
      new Paragraph({
        text:
          "No employees were found in this department.",
      })
    );

    return;
  }

  children.push(
    makeTable(
      [
        "Employee",
        "Position",
        "Employment Type",
        "Phone",
        "Email",
        "Joined",
        "Status",
      ],
      report.employees.map(
        (employee) => [
          employee.full_name,
          employee.position ??
            "—",
          employee.employment_type ??
            "—",
          employee.phone ??
            "—",
          employee.email ??
            "—",
          date(
            employee.date_joined
          ),
          employee.status ??
            (employee.is_active
              ? "Active"
              : "Inactive"),
        ]
      )
    )
  );
}

/* ============================================================
   ATTENDANCE REPORT
============================================================ */

function addAttendanceReport(
  children: Array<
    Paragraph | Table
  >,
  report: DepartmentReportData
) {
  children.push(
    ...sectionTitle(
      "1. Attendance Operations",
      "Attendance records captured during the selected reporting period."
    )
  );

  children.push(
    metricTable([
      {
        label: "Total Records",
        value:
          report.totals
            .attendance,
      },
      {
        label: "Present",
        value:
          report.totals
            .present,
      },
      {
        label: "Absent",
        value:
          report.totals
            .absent,
      },
      {
        label: "Late",
        value:
          report.totals
            .late,
      },
      {
        label: "Leave",
        value:
          report.totals
            .attendanceLeave,
      },
    ])
  );

  if (!report.attendance.length) {
    children.push(
      new Paragraph({
        text:
          "No attendance records were recorded during this reporting period.",
      })
    );

    return;
  }

  children.push(
    makeTable(
      [
        "Employee",
        "Date",
        "Check In",
        "Check Out",
        "Status",
        "Notes",
      ],
      report.attendance.map(
        (record) => [
          employeeName(
            report,
            record.employee_id
          ),
          date(
            record.attendance_date
          ),
          dateTime(
            record.check_in
          ),
          dateTime(
            record.check_out
          ),
          record.status ??
            "—",
          record.notes ??
            "—",
        ]
      )
    )
  );
}

/* ============================================================
   LEAVE REPORT
============================================================ */

function addLeaveReport(
  children: Array<
    Paragraph | Table
  >,
  report: DepartmentReportData
) {
  children.push(
    ...sectionTitle(
      "1. Leave Management",
      "Leave requests and approval activity associated with department employees."
    )
  );

  children.push(
    metricTable([
      {
        label: "Total Requests",
        value:
          report.totals
            .leaveRequests,
      },
      {
        label: "Pending",
        value:
          report.totals
            .pendingLeave,
      },
      {
        label: "Approved",
        value:
          report.totals
            .approvedLeave,
      },
      {
        label: "Rejected",
        value:
          report.totals
            .rejectedLeave,
      },
    ])
  );

  if (!report.leave.length) {
    children.push(
      new Paragraph({
        text:
          "No leave requests were recorded during this reporting period.",
      })
    );

    return;
  }

  children.push(
    makeTable(
      [
        "Employee",
        "Start",
        "End",
        "Days",
        "Status",
        "Reason",
      ],
      report.leave.map(
        (record) => [
          employeeName(
            report,
            record.employee_id
          ),
          date(
            record.start_date
          ),
          date(
            record.end_date
          ),
          String(
            record.days
          ),
          record.status ??
            "—",
          record.reason ??
            "—",
        ]
      )
    )
  );
}

/* ============================================================
   DOCUMENT REPORT
============================================================ */

function addDocumentsReport(
  children: Array<
    Paragraph | Table
  >,
  report: DepartmentReportData
) {
  children.push(
    ...sectionTitle(
      "1. Employee Documents",
      "Employee document register and compliance information."
    )
  );

  children.push(
    metricTable([
      {
        label: "Total Documents",
        value:
          report.totals
            .documents,
      },
      {
        label: "Expired",
        value:
          report.totals
            .expiredDocuments,
      },
      {
        label:
          "Expiring Within 30 Days",
        value:
          report.totals
            .expiringDocuments,
      },
    ])
  );

  if (!report.documents.length) {
    children.push(
      new Paragraph({
        text:
          "No employee documents were found.",
      })
    );

    return;
  }

  children.push(
    makeTable(
      [
        "Employee",
        "Document",
        "Type",
        "Issue Date",
        "Expiry Date",
        "Status",
      ],
      report.documents.map(
        (document) => [
          employeeName(
            report,
            document.employee_id
          ),
          document.document_name ??
            "—",
          document.document_type ??
            "—",
          date(
            document.issue_date
          ),
          date(
            document.expiry_date
          ),
          document.status ??
            "—",
        ]
      )
    )
  );
}

/* ============================================================
   LOAN REPORT
============================================================ */

function addLoansReport(
  children: Array<
    Paragraph | Table
  >,
  report: DepartmentReportData
) {
  children.push(
    ...sectionTitle(
      "1. Loans & Advances",
      "Employee loan and advance portfolio associated with the department."
    )
  );

  children.push(
    metricTable([
      {
        label: "Total Loans",
        value:
          report.totals
            .loans,
      },
      {
        label: "Active",
        value:
          report.totals
            .activeLoans,
      },
      {
        label: "Pending",
        value:
          report.totals
            .pendingLoans,
      },
      {
        label: "Completed",
        value:
          report.totals
            .completedLoans,
      },
      {
        label:
          "Outstanding Balance",
        value: money(
          report.totals
            .outstandingLoans
        ),
      },
    ])
  );

  if (!report.loans.length) {
    children.push(
      new Paragraph({
        text:
          "No loans or advances were found for this department.",
      })
    );

    return;
  }

  children.push(
    makeTable(
      [
        "Employee",
        "Loan Type",
        "Principal",
        "Total Payable",
        "Installment",
        "Paid",
        "Outstanding",
        "Status",
      ],
      report.loans.map(
        (loan) => [
          employeeName(
            report,
            loan.employee_id
          ),
          loan.loan_type ??
            "—",
          money(
            loan.principal_amount
          ),
          money(
            loan.total_payable
          ),
          money(
            loan.monthly_installment
          ),
          money(
            loan.amount_paid
          ),
          money(
            loan.outstanding_balance
          ),
          loan.status ??
            "—",
        ]
      )
    )
  );
}

/* ============================================================
   PAYROLL REPORT
============================================================ */

function addPayrollReport(
  children: Array<
    Paragraph | Table
  >,
  report: DepartmentReportData
) {
  children.push(
    ...sectionTitle(
      "1. Payroll Operations",
      "Detailed payroll records associated with department employees."
    )
  );

  children.push(
    metricTable([
      {
        label:
          "Employees Processed",
        value:
          report.totals
            .payrollEmployees,
      },
      {
        label: "Gross Pay",
        value: money(
          report.totals
            .grossPay
        ),
      },
      {
        label: "Allowances",
        value: money(
          report.totals
            .allowances
        ),
      },
      {
        label: "Deductions",
        value: money(
          report.totals
            .deductions
        ),
      },
      {
        label: "Tax",
        value: money(
          report.totals.tax
        ),
      },
      {
        label: "Net Pay",
        value: money(
          report.totals
            .netPay
        ),
      },
      {
        label: "Overtime",
        value: money(
          report.totals
            .overtimeAmount
        ),
      },
    ])
  );

  if (!report.payroll.length) {
    children.push(
      new Paragraph({
        text:
          "No payroll entries were found for this department.",
      })
    );

    return;
  }

  children.push(
    makeTable(
      [
        "Employee",
        "Basic Salary",
        "Taxable Pay",
        "Gross",
        "Allowances",
        "Deductions",
        "Tax",
        "Net Pay",
      ],
      report.payroll.map(
        (entry) => [
          employeeName(
            report,
            entry.employee_id
          ),
          money(
            entry.basic_salary
          ),
          money(
            entry.taxable_pay
          ),
          money(
            entry.gross_pay
          ),
          money(
            entry.total_allowances
          ),
          money(
            entry.total_deductions
          ),
          money(
            entry.total_tax
          ),
          money(
            entry.net_pay
          ),
        ]
      )
    )
  );

  children.push(
    new Paragraph({
      spacing: {
        before: 150,
      },
      children: [
        new TextRun({
          text:
            "Payroll attendance and overtime details:",
          bold: true,
          color: NAVY,
          size: 20,
        }),
      ],
    })
  );

  children.push(
    makeTable(
      [
        "Employee",
        "Days Worked",
        "Days Absent",
        "Unpaid Leave",
        "Overtime Hours",
        "Overtime Amount",
        "Status",
      ],
      report.payroll.map(
        (entry) => [
          employeeName(
            report,
            entry.employee_id
          ),
          String(
            entry.days_worked
          ),
          String(
            entry.days_absent
          ),
          String(
            entry.unpaid_leave_days
          ),
          String(
            entry.overtime_hours
          ),
          money(
            entry.overtime_amount
          ),
          entry.status ??
            "—",
        ]
      )
    )
  );
}

/* ============================================================
   FULL DEPARTMENT REPORT
============================================================ */

function addFullDepartmentReport(
  children: Array<
    Paragraph | Table
  >,
  report: DepartmentReportData
) {
  /* ==========================================================
     EXECUTIVE SUMMARY
  ========================================================== */

  children.push(
    ...sectionTitle(
      "1. Executive Summary",
      "Summary of workforce and operational activity for the selected department."
    )
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text:
            `This report provides a detailed operational record for the ${report.department.name} department of Alessandro Enterprises. ` +
            `It covers employees, attendance, leave, employee documentation, loans and advances, and payroll activity ` +
            `for the reporting period of ${report.period.label}.`,
          size: 20,
          color: DARK_GRAY,
        }),
      ],
      spacing: {
        after: 180,
      },
    })
  );

  children.push(
    metricTable([
      {
        label: "Total Employees",
        value:
          report.totals
            .employees,
      },
      {
        label: "Active Employees",
        value:
          report.totals
            .activeEmployees,
      },
      {
        label: "Inactive Employees",
        value:
          report.totals
            .inactiveEmployees,
      },
      {
        label:
          "Attendance Records",
        value:
          report.totals
            .attendance,
      },
      {
        label: "Leave Requests",
        value:
          report.totals
            .leaveRequests,
      },
      {
        label:
          "Employee Documents",
        value:
          report.totals
            .documents,
      },
      {
        label: "Loans",
        value:
          report.totals
            .loans,
      },
      {
        label:
          "Payroll Employees",
        value:
          report.totals
            .payrollEmployees,
      },
    ])
  );

  /* ==========================================================
     EMPLOYEES
  ========================================================== */

  children.push(
    ...sectionTitle(
      "2. Employee Register",
      "Complete employee listing for the selected department."
    )
  );

  if (!report.employees.length) {
    children.push(
      new Paragraph({
        text:
          "No employees were found in this department.",
      })
    );
  } else {
    children.push(
      makeTable(
        [
          "Employee",
          "Position",
          "Employment Type",
          "Phone",
          "Email",
          "Joined",
          "Status",
        ],
        report.employees.map(
          (employee) => [
            employee.full_name,
            employee.position ??
              "—",
            employee.employment_type ??
              "—",
            employee.phone ??
              "—",
            employee.email ??
              "—",
            date(
              employee.date_joined
            ),
            employee.status ??
              (employee.is_active
                ? "Active"
                : "Inactive"),
          ]
        )
      )
    );
  }

  /* ==========================================================
     ATTENDANCE
  ========================================================== */

  children.push(
    ...sectionTitle(
      "3. Attendance Operations",
      "Attendance records captured during the selected reporting period."
    )
  );

  children.push(
    metricTable([
      {
        label: "Total Records",
        value:
          report.totals
            .attendance,
      },
      {
        label: "Present",
        value:
          report.totals
            .present,
      },
      {
        label: "Absent",
        value:
          report.totals
            .absent,
      },
      {
        label: "Late",
        value:
          report.totals
            .late,
      },
      {
        label: "Leave",
        value:
          report.totals
            .attendanceLeave,
      },
    ])
  );

  if (report.attendance.length) {
    children.push(
      makeTable(
        [
          "Employee",
          "Date",
          "Check In",
          "Check Out",
          "Status",
          "Notes",
        ],
        report.attendance.map(
          (record) => [
            employeeName(
              report,
              record.employee_id
            ),
            date(
              record.attendance_date
            ),
            dateTime(
              record.check_in
            ),
            dateTime(
              record.check_out
            ),
            record.status ??
              "—",
            record.notes ??
              "—",
          ]
        )
      )
    );
  } else {
    children.push(
      new Paragraph({
        text:
          "No attendance records were recorded during this reporting period.",
      })
    );
  }

  /* ==========================================================
     LEAVE
  ========================================================== */

  children.push(
    ...sectionTitle(
      "4. Leave Management",
      "Leave requests and approval activity associated with department employees."
    )
  );

  children.push(
    metricTable([
      {
        label: "Total Requests",
        value:
          report.totals
            .leaveRequests,
      },
      {
        label: "Pending",
        value:
          report.totals
            .pendingLeave,
      },
      {
        label: "Approved",
        value:
          report.totals
            .approvedLeave,
      },
      {
        label: "Rejected",
        value:
          report.totals
            .rejectedLeave,
      },
    ])
  );

  if (report.leave.length) {
    children.push(
      makeTable(
        [
          "Employee",
          "Start",
          "End",
          "Days",
          "Status",
          "Reason",
        ],
        report.leave.map(
          (record) => [
            employeeName(
              report,
              record.employee_id
            ),
            date(
              record.start_date
            ),
            date(
              record.end_date
            ),
            String(
              record.days
            ),
            record.status ??
              "—",
            record.reason ??
              "—",
          ]
        )
      )
    );
  } else {
    children.push(
      new Paragraph({
        text:
          "No leave requests were recorded during this reporting period.",
      })
    );
  }

  /* ==========================================================
     DOCUMENTS
  ========================================================== */

  children.push(
    ...sectionTitle(
      "5. Employee Documents",
      "Employee document register and compliance information."
    )
  );

  children.push(
    metricTable([
      {
        label:
          "Total Documents",
        value:
          report.totals
            .documents,
      },
      {
        label: "Expired",
        value:
          report.totals
            .expiredDocuments,
      },
      {
        label:
          "Expiring Within 30 Days",
        value:
          report.totals
            .expiringDocuments,
      },
    ])
  );

  if (report.documents.length) {
    children.push(
      makeTable(
        [
          "Employee",
          "Document",
          "Type",
          "Issue Date",
          "Expiry Date",
          "Status",
        ],
        report.documents.map(
          (document) => [
            employeeName(
              report,
              document.employee_id
            ),
            document.document_name ??
              "—",
            document.document_type ??
              "—",
            date(
              document.issue_date
            ),
            date(
              document.expiry_date
            ),
            document.status ??
              "—",
          ]
        )
      )
    );
  } else {
    children.push(
      new Paragraph({
        text:
          "No employee documents were found.",
      })
    );
  }

  /* ==========================================================
     LOANS
  ========================================================== */

  children.push(
    ...sectionTitle(
      "6. Loans & Advances",
      "Employee loan and advance portfolio associated with the department."
    )
  );

  children.push(
    metricTable([
      {
        label: "Total Loans",
        value:
          report.totals
            .loans,
      },
      {
        label: "Active",
        value:
          report.totals
            .activeLoans,
      },
      {
        label: "Pending",
        value:
          report.totals
            .pendingLoans,
      },
      {
        label: "Completed",
        value:
          report.totals
            .completedLoans,
      },
      {
        label:
          "Outstanding Balance",
        value: money(
          report.totals
            .outstandingLoans
        ),
      },
    ])
  );

  if (report.loans.length) {
    children.push(
      makeTable(
        [
          "Employee",
          "Loan Type",
          "Principal",
          "Total Payable",
          "Installment",
          "Paid",
          "Outstanding",
          "Status",
        ],
        report.loans.map(
          (loan) => [
            employeeName(
              report,
              loan.employee_id
            ),
            loan.loan_type ??
              "—",
            money(
              loan.principal_amount
            ),
            money(
              loan.total_payable
            ),
            money(
              loan.monthly_installment
            ),
            money(
              loan.amount_paid
            ),
            money(
              loan.outstanding_balance
            ),
            loan.status ??
              "—",
          ]
        )
      )
    );
  } else {
    children.push(
      new Paragraph({
        text:
          "No loans or advances were found for this department.",
      })
    );
  }

  /* ==========================================================
     PAYROLL
  ========================================================== */

  children.push(
    ...sectionTitle(
      "7. Payroll Operations",
      "Detailed payroll records associated with department employees."
    )
  );

  children.push(
    metricTable([
      {
        label:
          "Employees Processed",
        value:
          report.totals
            .payrollEmployees,
      },
      {
        label: "Gross Pay",
        value: money(
          report.totals
            .grossPay
        ),
      },
      {
        label: "Allowances",
        value: money(
          report.totals
            .allowances
        ),
      },
      {
        label: "Deductions",
        value: money(
          report.totals
            .deductions
        ),
      },
      {
        label: "Tax",
        value: money(
          report.totals.tax
        ),
      },
      {
        label: "Net Pay",
        value: money(
          report.totals
            .netPay
        ),
      },
      {
        label: "Overtime",
        value: money(
          report.totals
            .overtimeAmount
        ),
      },
    ])
  );

  if (report.payroll.length) {
    children.push(
      makeTable(
        [
          "Employee",
          "Basic Salary",
          "Taxable Pay",
          "Gross",
          "Allowances",
          "Deductions",
          "Tax",
          "Net Pay",
        ],
        report.payroll.map(
          (entry) => [
            employeeName(
              report,
              entry.employee_id
            ),
            money(
              entry.basic_salary
            ),
            money(
              entry.taxable_pay
            ),
            money(
              entry.gross_pay
            ),
            money(
              entry.total_allowances
            ),
            money(
              entry.total_deductions
            ),
            money(
              entry.total_tax
            ),
            money(
              entry.net_pay
            ),
          ]
        )
      )
    );

    children.push(
      new Paragraph({
        spacing: {
          before: 150,
        },
        children: [
          new TextRun({
            text:
              "Payroll attendance and overtime details:",
            bold: true,
            color: NAVY,
            size: 20,
          }),
        ],
      })
    );

    children.push(
      makeTable(
        [
          "Employee",
          "Days Worked",
          "Days Absent",
          "Unpaid Leave",
          "Overtime Hours",
          "Overtime Amount",
          "Status",
        ],
        report.payroll.map(
          (entry) => [
            employeeName(
              report,
              entry.employee_id
            ),
            String(
              entry.days_worked
            ),
            String(
              entry.days_absent
            ),
            String(
              entry.unpaid_leave_days
            ),
            String(
              entry.overtime_hours
            ),
            money(
              entry.overtime_amount
            ),
            entry.status ??
              "—",
          ]
        )
      )
    );
  } else {
    children.push(
      new Paragraph({
        text:
          "No payroll entries were found for this department.",
      })
    );
  }

  /* ==========================================================
     MANAGEMENT OBSERVATIONS
  ========================================================== */

  children.push(
    ...sectionTitle(
      "8. Management Observations",
      "Automatically generated observations based on the recorded HR data."
    )
  );

  const observations: string[] =
    [];

  if (
    report.totals
      .inactiveEmployees > 0
  ) {
    observations.push(
      `${report.totals.inactiveEmployees} employee(s) are currently inactive and may require management review.`
    );
  }

  if (
    report.totals.absent > 0
  ) {
    observations.push(
      `${report.totals.absent} absence record(s) were recorded during the reporting period.`
    );
  }

  if (
    report.totals.late > 0
  ) {
    observations.push(
      `${report.totals.late} late attendance record(s) were recorded and may require attendance review.`
    );
  }

  if (
    report.totals
      .pendingLeave > 0
  ) {
    observations.push(
      `${report.totals.pendingLeave} leave request(s) remain pending approval.`
    );
  }

  if (
    report.totals
      .expiredDocuments > 0
  ) {
    observations.push(
      `${report.totals.expiredDocuments} employee document(s) have expired and should be reviewed.`
    );
  }

  if (
    report.totals
      .expiringDocuments > 0
  ) {
    observations.push(
      `${report.totals.expiringDocuments} employee document(s) will expire within 30 days.`
    );
  }

  if (
    report.totals
      .outstandingLoans > 0
  ) {
    observations.push(
      `The department has ${money(
        report.totals
          .outstandingLoans
      )} in outstanding employee loan balances.`
    );
  }

  if (
    report.payroll.length >
    0
  ) {
    observations.push(
      `Payroll records show ${money(
        report.totals.netPay
      )} in total net pay for the records included in this report.`
    );
  }

  if (!observations.length) {
    observations.push(
      "No significant exceptions were identified from the available HR records for this reporting period."
    );
  }

  for (
    const observation of observations
  ) {
    children.push(
      new Paragraph({
        bullet: {
          level: 0,
        },
        children: [
          new TextRun({
            text: observation,
            size: 20,
            color: DARK_GRAY,
          }),
        ],
        spacing: {
          after: 100,
        },
      })
    );
  }
}

/* ============================================================
   REPORT GENERATOR
============================================================ */

export async function generateDepartmentReportDocx(
  report: DepartmentReportData,
  reportType: HRReportType = "department"
): Promise<Buffer> {
  const children: Array<
    Paragraph | Table
  > = [];

  const companyLogo =
    await getCompanyLogo();

  /* ==========================================================
     COVER LOGO
  ========================================================== */

  if (companyLogo) {
    children.push(
      new Paragraph({
        alignment:
          AlignmentType.CENTER,
        spacing: {
          before: 200,
          after: 120,
        },
        children: [
          new ImageRun({
            type:
              companyLogo.type,
            data:
              companyLogo.data,
            transformation: {
              width: 110,
              height: 110,
            },
          }),
        ],
      })
    );
  }

  /* ==========================================================
     COMPANY NAME
  ========================================================== */

  children.push(
    new Paragraph({
      alignment:
        AlignmentType.CENTER,
      spacing: {
        before:
          companyLogo
            ? 60
            : 500,
        after: 80,
      },
      children: [
        new TextRun({
          text:
            "ALESSANDRO ENTERPRISES",
          bold: true,
          color: GOLD,
          size: 34,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment:
        AlignmentType.CENTER,
      spacing: {
        after: 40,
      },
      children: [
        new TextRun({
          text:
            "THE NAME THAT COVERS ALL",
          bold: true,
          color: NAVY,
          size: 18,
        }),
      ],
    })
  );

  /* ==========================================================
     HR TITLE
  ========================================================== */

  children.push(
    new Paragraph({
      alignment:
        AlignmentType.CENTER,
      spacing: {
        before: 300,
        after: 100,
      },
      children: [
        new TextRun({
          text:
            "HUMAN RESOURCES",
          bold: true,
          color: NAVY,
          size: 30,
        }),
      ],
    })
  );

  /* ==========================================================
     REPORT TYPE
  ========================================================== */

  children.push(
    new Paragraph({
      alignment:
        AlignmentType.CENTER,
      spacing: {
        after: 80,
      },
      children: [
        new TextRun({
          text:
            reportTypeLabel(
              reportType
            ),
          bold: true,
          color: GOLD,
          size: 26,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment:
        AlignmentType.CENTER,
      spacing: {
        after: 40,
      },
      children: [
        new TextRun({
          text:
            reportTypeDescription(
              reportType
            ),
          color: DARK_GRAY,
          size: 17,
        }),
      ],
    })
  );

  /* ==========================================================
     DEPARTMENT
  ========================================================== */

  children.push(
    new Paragraph({
      alignment:
        AlignmentType.CENTER,
      spacing: {
        before: 80,
        after: 300,
      },
      children: [
        new TextRun({
          text:
            report.department.name,
          bold: true,
          color: NAVY,
          size: 28,
        }),
      ],
    })
  );

  /* ==========================================================
     REPORT PERIOD
  ========================================================== */

  children.push(
    metricTable([
      {
        label:
          "Reporting Period",
        value:
          report.period.label,
      },
      {
        label: "Period Start",
        value: date(
          report.period.start
        ),
      },
      {
        label: "Period End",
        value: date(
          report.period.end
        ),
      },
      {
        label:
          "Report Generated",
        value:
          new Date().toLocaleString(
            "en-ZM"
          ),
      },
    ])
  );

  /* ==========================================================
     SELECT REPORT CONTENT
  ========================================================== */

  switch (reportType) {
    case "employees":
      addEmployeeReport(
        children,
        report
      );
      break;

    case "attendance":
      addAttendanceReport(
        children,
        report
      );
      break;

    case "leave":
      addLeaveReport(
        children,
        report
      );
      break;

    case "documents":
      addDocumentsReport(
        children,
        report
      );
      break;

    case "loans":
      addLoansReport(
        children,
        report
      );
      break;

    case "payroll":
      addPayrollReport(
        children,
        report
      );
      break;

    case "department":
    default:
      addFullDepartmentReport(
        children,
        report
      );
      break;
  }

  /* ==========================================================
     FINAL NOTE
  ========================================================== */

  children.push(
    new Paragraph({
      alignment:
        AlignmentType.CENTER,
      spacing: {
        before: 500,
        after: 100,
      },
      children: [
        new TextRun({
          text:
            "CONFIDENTIAL — INTERNAL HR MANAGEMENT DOCUMENT",
          bold: true,
          color: GOLD,
          size: 18,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment:
        AlignmentType.CENTER,
      children: [
        new TextRun({
          text:
            "Alessandro Enterprises • Human Resources",
          color: DARK_GRAY,
          size: 16,
        }),
      ],
    })
  );

  /* ==========================================================
     DOCX
  ========================================================== */

  const document =
    new Document({
      creator:
        "Alessandro Enterprises",

      title:
        `${report.department.name} ${reportTypeLabel(
          reportType
        )}`,

      subject:
        reportTypeDescription(
          reportType
        ),

      description:
        "Generated from Alessandro Enterprises HR records.",

      styles: {
        default: {
          document: {
            run: {
              font: "Arial",
              size: 20,
            },
          },
        },
      },

      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },

          headers: {
            default:
              new Header({
                children: [
                  new Paragraph({
                    alignment:
                      AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text:
                          "ALESSANDRO ENTERPRISES",
                        bold: true,
                        color: GOLD,
                        size: 14,
                      }),
                    ],
                  }),
                ],
              }),
          },

          footers: {
            default:
              new Footer({
                children: [
                  new Paragraph({
                    alignment:
                      AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text:
                          "Confidential HR Report",
                        color:
                          DARK_GRAY,
                        size: 14,
                      }),
                    ],
                  }),
                ],
              }),
          },

          children,
        },
      ],
    });

  return Packer.toBuffer(
    document
  );
}