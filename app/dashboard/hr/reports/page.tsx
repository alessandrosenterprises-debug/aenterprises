import HRReportGenerator from "@/modules/hr/reports/components/HRReportGenerator";
import HRReportsDashboard from "@/modules/hr/reports/components/HRReportsDashboard";

import { getDepartments } from "@/modules/departments/services/department.service";
import { getHRReportData } from "@/modules/hr/reports/services/hr-reports.service";

interface HRReportsPageProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

const validPeriods = [
  "today",
  "week",
  "month",
  "quarter",
  "year",
];

export default async function HRReportsPage({
  searchParams,
}: HRReportsPageProps) {
  const params = await searchParams;

  const requestedPeriod =
    typeof params.period === "string"
      ? params.period
      : "month";

  const period = validPeriods.includes(
    requestedPeriod
  )
    ? requestedPeriod
    : "month";

  const [
    departments,
    reportData,
  ] = await Promise.all([
    getDepartments(),
    getHRReportData(period),
  ]);

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#03162F] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#D4AF37]">
            HR Reporting Center
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-black text-[#03162F]">
          Human Resources Reports
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Review workforce performance and generate
          detailed department-level Word reports
          containing the recorded HR operations and
          underlying records.
        </p>
      </div>

      {/* =====================================================
          DOCX REPORT GENERATOR
      ===================================================== */}

      <HRReportGenerator
        departments={departments.map(
          (department) => ({
            id: department.id,
            name: department.name,
          })
        )}
      />

      {/* =====================================================
          HR ANALYTICS DASHBOARD
      ===================================================== */}

      <HRReportsDashboard
        data={reportData}
        period={period}
      />
    </div>
  );
}