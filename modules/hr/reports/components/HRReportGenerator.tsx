"use client";

import { useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  ClipboardList,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
}

interface HRReportGeneratorProps {
  departments: Department[];
}

const reportTypes = [
  {
    value: "department",
    label: "Full HR Department Report",
    description:
      "Complete department operations, employees, attendance, leave, documents, loans and payroll.",
  },
  {
    value: "employees",
    label: "Employee Report",
    description:
      "Detailed employee register and employment information.",
  },
  {
    value: "attendance",
    label: "Attendance Report",
    description:
      "Attendance records, check-in/out times, absences, lateness and leave.",
  },
  {
    value: "leave",
    label: "Leave Report",
    description:
      "Leave requests, dates, days, approvals, rejections and reasons.",
  },
  {
    value: "documents",
    label: "Documents & Compliance Report",
    description:
      "Employee documents, issue dates, expiry dates and compliance status.",
  },
  {
    value: "loans",
    label: "Loans & Advances Report",
    description:
      "Employee loans, repayments, outstanding balances and statuses.",
  },
  {
    value: "payroll",
    label: "Payroll Report",
    description:
      "Payroll entries, salaries, allowances, deductions, tax, net pay and overtime.",
  },
];

const periods = [
  {
    value: "today",
    label: "Today",
  },
  {
    value: "week",
    label: "This Week",
  },
  {
    value: "month",
    label: "This Month",
  },
  {
    value: "quarter",
    label: "This Quarter",
  },
  {
    value: "year",
    label: "This Year",
  },
  {
    value: "custom",
    label: "Custom Date Range",
  },
];

export default function HRReportGenerator({
  departments,
}: HRReportGeneratorProps) {
  const [reportType, setReportType] =
    useState("department");

  const [departmentId, setDepartmentId] =
    useState("");

  const [period, setPeriod] =
    useState("month");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [generating, setGenerating] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedReport =
    reportTypes.find(
      (item) =>
        item.value === reportType
    );

  async function generateReport() {
    setError("");
    setSuccess(false);

    if (!departmentId) {
      setError(
        "Please select a department before generating the report."
      );

      return;
    }

    if (
      period === "custom" &&
      (!fromDate || !toDate)
    ) {
      setError(
        "Please select both a From Date and a To Date for the custom reporting range."
      );

      return;
    }

    if (
      period === "custom" &&
      fromDate > toDate
    ) {
      setError(
        "The From Date cannot be later than the To Date."
      );

      return;
    }

    try {
      setGenerating(true);

      const response = await fetch(
        "/api/hr/reports/department",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            reportType,
            departmentId,
            period,
            fromDate:
              period === "custom"
                ? fromDate
                : null,
            toDate:
              period === "custom"
                ? toDate
                : null,
          }),
        }
      );

      if (!response.ok) {
        let message =
          "Failed to generate the HR report.";

        try {
          const data =
            await response.json();

          if (
            data &&
            typeof data.error === "string"
          ) {
            message = data.error;
          }
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      if (!blob.size) {
        throw new Error(
          "The generated report was empty."
        );
      }

      const contentDisposition =
        response.headers.get(
          "Content-Disposition"
        );

      let filename =
        "Alessandro-Enterprises-HR-Report.docx";

      const filenameMatch =
        contentDisposition?.match(
          /filename="([^"]+)"/i
        );

      if (filenameMatch?.[1]) {
        filename =
          filenameMatch[1];
      }

      const url =
        window.URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement("a");

      anchor.href = url;
      anchor.download = filename;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(url);

      setSuccess(true);

      window.setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {
      console.error(
        "HR report generation failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate the HR report."
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="relative overflow-hidden bg-[#03162F] p-6 sm:p-7">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
                <FileText className="h-5 w-5" />
              </div>

              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#D4AF37]">
                HR Report Generator
              </span>
            </div>

            <h2 className="text-2xl font-black text-white">
              Generate Detailed HR Report
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Select exactly what you want to
              report, choose the department and
              reporting period, then generate a
              professionally formatted Word document
              containing the available HR records.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-4 lg:block">
            <BarChart3 className="h-8 w-8 text-[#D4AF37]" />
          </div>
        </div>
      </div>

      {/* =====================================================
          FORM
      ===================================================== */}

      <div className="p-6 sm:p-7">
        <div className="grid gap-5 lg:grid-cols-3">
          {/* =================================================
              REPORT TYPE
          ================================================= */}

          <div>
            <label
              htmlFor="hr-report-type"
              className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
            >
              <ClipboardList className="h-4 w-4 text-[#B8860B]" />

              Report Type
            </label>

            <select
              id="hr-report-type"
              value={reportType}
              onChange={(event) =>
                setReportType(
                  event.target.value
                )
              }
              disabled={generating}
              className="
                h-12
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                font-semibold
                text-slate-900
                outline-none
                transition
                focus:border-[#B8860B]
                focus:ring-2
                focus:ring-[#B8860B]/20
                disabled:cursor-not-allowed
                disabled:bg-slate-50
              "
            >
              {reportTypes.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* =================================================
              DEPARTMENT
          ================================================= */}

          <div>
            <label
              htmlFor="hr-report-department"
              className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
            >
              <Building2 className="h-4 w-4 text-[#B8860B]" />

              Department
            </label>

            <select
              id="hr-report-department"
              value={departmentId}
              onChange={(event) =>
                setDepartmentId(
                  event.target.value
                )
              }
              disabled={generating}
              className="
                h-12
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                font-semibold
                text-slate-900
                outline-none
                transition
                focus:border-[#B8860B]
                focus:ring-2
                focus:ring-[#B8860B]/20
                disabled:cursor-not-allowed
                disabled:bg-slate-50
              "
            >
              <option value="">
                Select a department
              </option>

              {departments.map(
                (department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* =================================================
              DATE RANGE
          ================================================= */}

          <div>
            <label
              htmlFor="hr-report-period"
              className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
            >
              <CalendarDays className="h-4 w-4 text-[#B8860B]" />

              Date Range
            </label>

            <select
              id="hr-report-period"
              value={period}
              onChange={(event) =>
                setPeriod(
                  event.target.value
                )
              }
              disabled={generating}
              className="
                h-12
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                font-semibold
                text-slate-900
                outline-none
                transition
                focus:border-[#B8860B]
                focus:ring-2
                focus:ring-[#B8860B]/20
                disabled:cursor-not-allowed
                disabled:bg-slate-50
              "
            >
              {periods.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* =====================================================
            CUSTOM DATE RANGE
        ===================================================== */}

        {period === "custom" && (
          <div className="mt-5 rounded-2xl border border-[#D4AF37]/30 bg-[#F5EAC7]/30 p-5">
            <div className="mb-4">
              <p className="text-sm font-black text-[#03162F]">
                Custom Reporting Period
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500">
                Select the exact dates that should
                be included in the report.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="hr-report-from-date"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  From Date
                </label>

                <input
                  id="hr-report-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(event) =>
                    setFromDate(
                      event.target.value
                    )
                  }
                  disabled={generating}
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-sm
                    font-semibold
                    text-slate-900
                    outline-none
                    transition
                    focus:border-[#B8860B]
                    focus:ring-2
                    focus:ring-[#B8860B]/20
                    disabled:cursor-not-allowed
                    disabled:bg-slate-50
                  "
                />
              </div>

              <div>
                <label
                  htmlFor="hr-report-to-date"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  To Date
                </label>

                <input
                  id="hr-report-to-date"
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(event) =>
                    setToDate(
                      event.target.value
                    )
                  }
                  disabled={generating}
                  className="
                    h-12
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-sm
                    font-semibold
                    text-slate-900
                    outline-none
                    transition
                    focus:border-[#B8860B]
                    focus:ring-2
                    focus:ring-[#B8860B]/20
                    disabled:cursor-not-allowed
                    disabled:bg-slate-50
                  "
                />
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            SELECTED REPORT DESCRIPTION
        ===================================================== */}

        {selectedReport && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#03162F] text-[#D4AF37]">
              <FileText className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-black text-[#03162F]">
                {selectedReport.label}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {selectedReport.description}
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            GENERATE
        ===================================================== */}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={generateReport}
            disabled={
              generating ||
              departments.length === 0
            }
            className="
              inline-flex
              h-12
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#D4AF37]
              px-7
              text-sm
              font-black
              uppercase
              tracking-[0.03em]
              text-[#03162F]
              shadow-md
              transition
              hover:bg-[#E3C45A]
              hover:shadow-lg
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Generating Report...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />

                Generate DOCX Report
              </>
            )}
          </button>
        </div>

        {/* =====================================================
            EMPTY DEPARTMENTS
        ===================================================== */}

        {departments.length === 0 && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            No departments are currently available.
            Create a department first before
            generating a department report.
          </div>
        )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                !
              </div>

              <div>
                <p className="text-sm font-black text-red-800">
                  Report Generation Failed
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            SUCCESS
        ===================================================== */}

        {success && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-black text-emerald-800">
                  Report Generated Successfully
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  The Word document has been
                  downloaded to your computer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            REPORT CONTENT
        ===================================================== */}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Employee Records",
            "Attendance",
            "Leave & Documents",
            "Loans & Payroll",
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />

                <span className="text-xs font-bold text-slate-700">
                  {item}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}