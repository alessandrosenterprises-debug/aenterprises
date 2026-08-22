import { NextResponse } from "next/server";

import {
  getDepartmentReportData,
  type DepartmentReportPeriod,
} from "@/modules/hr/reports/services/hr-department-report.service";

import { generateDepartmentReportDocx } from "@/modules/hr/reports/services/hr-department-report-docx.service";

const validReportTypes = [
  "department",
  "employees",
  "attendance",
  "leave",
  "documents",
  "loans",
  "payroll",
] as const;

type ReportType =
  (typeof validReportTypes)[number];

const validPeriods = [
  "today",
  "week",
  "month",
  "quarter",
  "year",
  "custom",
] as const;

function isValidReportType(
  value: string
): value is ReportType {
  return validReportTypes.includes(
    value as ReportType
  );
}

function isValidPeriod(
  value: string
): value is DepartmentReportPeriod {
  return validPeriods.includes(
    value as DepartmentReportPeriod
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    /* ========================================================
       REQUEST VALUES
    ======================================================== */

    const departmentId =
      typeof body.departmentId === "string"
        ? body.departmentId
        : "";

    const requestedReportType =
      typeof body.reportType === "string"
        ? body.reportType
        : "department";

    const requestedPeriod =
      typeof body.period === "string"
        ? body.period
        : "month";

    const fromDate =
      typeof body.fromDate === "string" &&
      body.fromDate.trim()
        ? body.fromDate.trim()
        : null;

    const toDate =
      typeof body.toDate === "string" &&
      body.toDate.trim()
        ? body.toDate.trim()
        : null;

    /* ========================================================
       VALIDATION
    ======================================================== */

    if (!departmentId) {
      return NextResponse.json(
        {
          error:
            "Department ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidReportType(
        requestedReportType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid HR report type.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidPeriod(
        requestedPeriod
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid reporting period.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      requestedPeriod === "custom"
    ) {
      if (!fromDate || !toDate) {
        return NextResponse.json(
          {
            error:
              "Both From Date and To Date are required for a custom reporting period.",
          },
          {
            status: 400,
          }
        );
      }

      if (fromDate > toDate) {
        return NextResponse.json(
          {
            error:
              "The From Date cannot be later than the To Date.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* ========================================================
       LOAD COMPLETE DEPARTMENT REPORT
    ======================================================== */

    const report =
      await getDepartmentReportData(
        departmentId,
        requestedPeriod,
        fromDate,
        toDate
      );

    /* ========================================================
       GENERATE DOCX
    ======================================================== */

    const document =
      await generateDepartmentReportDocx(
        report,
        requestedReportType
      );

    /* ========================================================
       FILE NAME
    ======================================================== */

    const safeDepartmentName =
      report.department.name
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "");

    const safeReportType =
      requestedReportType
        .replace(
          /[^a-z0-9]+/gi,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        );

    const filename =
      `Alessandro-Enterprises-${safeDepartmentName}-${safeReportType}-HR-Report-${requestedPeriod}.docx`;

    /* ========================================================
       RETURN DOCX
    ======================================================== */

    return new NextResponse(
      new Uint8Array(document),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Cache-Control":
            "no-store",

          "Content-Length":
            String(
              document.byteLength
            ),
        },
      }
    );
  } catch (error) {
    console.error(
      "HR report generation failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate HR report.",
      },
      {
        status: 500,
      }
    );
  }
}