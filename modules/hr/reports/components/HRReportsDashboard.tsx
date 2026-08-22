"use client";

import {
  Users,
  UserCheck,
  UserPlus,
  Building2,
  CalendarCheck,
  Clock3,
  FileText,
  AlertTriangle,
  HandCoins,
  WalletCards,
  TrendingUp,
  Download,
} from "lucide-react";
import type { HRReportData } from "../services/hr-reports.service";

interface HRReportsDashboardProps {
  data: HRReportData;
  period: string;
}

function formatMoney(value: number) {
  return `ZMW ${value.toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className = "",
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof Users;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-[#03162F]">
            {value}
          </p>

          <p className="mt-2 text-xs font-medium text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-black uppercase tracking-[0.03em] text-[#03162F]">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function HRReportsDashboard({
  data,
  period,
}: HRReportsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* =====================================================
          REPORT HEADER
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl bg-[#03162F] shadow-lg">
        <div className="relative p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#D4AF37]/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5">
                <BarChart3Icon />

                <span className="text-xs font-black uppercase tracking-[0.12em] text-[#D4AF37]">
                  HR Reporting Center
                </span>
              </div>

              <h1 className="text-3xl font-black text-white sm:text-4xl">
                Human Resources Reports
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Workforce, attendance, leave, payroll,
                loans and employee document performance
                in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-black uppercase tracking-[0.04em] text-[#03162F] shadow-lg transition hover:bg-[#E3C45A]"
            >
              <Download className="h-4 w-4" />

              Print Report
            </button>
          </div>

          <div className="relative mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
            <span>Reporting Period:</span>

            <span className="text-[#D4AF37]">
              {period === "today"
                ? "Today"
                : period === "week"
                ? "This Week"
                : period === "quarter"
                ? "This Quarter"
                : period === "year"
                ? "This Year"
                : "This Month"}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          WORKFORCE KPI
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={data.employees.total}
          description="Employees registered in HR"
          icon={Users}
        />

        <StatCard
          title="Active Employees"
          value={data.employees.active}
          description="Currently active workforce"
          icon={UserCheck}
        />

        <StatCard
          title="New Employees"
          value={data.employees.newThisPeriod}
          description="Joined during this period"
          icon={UserPlus}
        />

        <StatCard
          title="Departments"
          value={data.departments.total}
          description="Active company departments"
          icon={Building2}
        />
      </div>

      {/* =====================================================
          WORKFORCE + DEPARTMENTS
      ===================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle
            title="Workforce Overview"
            description="Current employee distribution."
          />

          <div className="space-y-5">
            <ProgressRow
              label="Active Employees"
              value={data.employees.active}
              total={data.employees.total}
            />

            <ProgressRow
              label="Inactive Employees"
              value={data.employees.inactive}
              total={data.employees.total}
            />

            <ProgressRow
              label="New This Period"
              value={data.employees.newThisPeriod}
              total={data.employees.total}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle
            title="Department Breakdown"
            description="Employees by department."
          />

          {data.departments.breakdown.length === 0 ? (
            <EmptyState text="No departments found." />
          ) : (
            <div className="space-y-4">
              {data.departments.breakdown
                .sort(
                  (a, b) =>
                    b.employeeCount -
                    a.employeeCount
                )
                .slice(0, 7)
                .map((department) => (
                  <ProgressRow
                    key={department.id}
                    label={department.name}
                    value={
                      department.employeeCount
                    }
                    total={
                      data.employees.total
                    }
                  />
                ))}
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          ATTENDANCE + LEAVE
      ===================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle
            title="Attendance"
            description="Attendance records for the selected period."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <MiniStat
              icon={CalendarCheck}
              label="Present"
              value={data.attendance.present}
              className="bg-emerald-50 text-emerald-700"
            />

            <MiniStat
              icon={AlertTriangle}
              label="Absent"
              value={data.attendance.absent}
              className="bg-red-50 text-red-700"
            />

            <MiniStat
              icon={Clock3}
              label="Late"
              value={data.attendance.late}
              className="bg-amber-50 text-amber-700"
            />

            <MiniStat
              icon={CalendarCheck}
              label="Leave"
              value={data.attendance.leave}
              className="bg-blue-50 text-blue-700"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle
            title="Leave Management"
            description="Leave request status for the selected period."
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <MiniStat
              icon={Clock3}
              label="Pending"
              value={data.leave.pending}
              className="bg-amber-50 text-amber-700"
            />

            <MiniStat
              icon={CalendarCheck}
              label="Approved"
              value={data.leave.approved}
              className="bg-emerald-50 text-emerald-700"
            />

            <MiniStat
              icon={AlertTriangle}
              label="Rejected"
              value={data.leave.rejected}
              className="bg-red-50 text-red-700"
            />
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                Total Requests
              </span>

              <span className="text-xl font-black text-[#03162F]">
                {data.leave.total}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          DOCUMENTS + LOANS
      ===================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle
            title="Employee Documents"
            description="Document compliance and expiry status."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <MiniStat
              icon={FileText}
              label="Total"
              value={data.documents.total}
              className="bg-slate-50 text-slate-700"
            />

            <MiniStat
              icon={FileText}
              label="Active"
              value={data.documents.active}
              className="bg-emerald-50 text-emerald-700"
            />

            <MiniStat
              icon={Clock3}
              label="Expiring Soon"
              value={data.documents.expiring}
              className="bg-amber-50 text-amber-700"
            />

            <MiniStat
              icon={AlertTriangle}
              label="Expired"
              value={data.documents.expired}
              className="bg-red-50 text-red-700"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle
            title="Loans & Advances"
            description="Employee loan portfolio status."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <MiniStat
              icon={HandCoins}
              label="Total Loans"
              value={data.loans.total}
              className="bg-slate-50 text-slate-700"
            />

            <MiniStat
              icon={TrendingUp}
              label="Active"
              value={data.loans.active}
              className="bg-blue-50 text-blue-700"
            />

            <MiniStat
              icon={Clock3}
              label="Pending"
              value={data.loans.pending}
              className="bg-amber-50 text-amber-700"
            />

            <MiniStat
              icon={WalletCards}
              label="Outstanding"
              value={formatMoney(
                data.loans.outstanding
              )}
              className="bg-red-50 text-red-700"
            />
          </div>
        </section>
      </div>

      {/* =====================================================
          PAYROLL
      ===================================================== */}

      <section className="overflow-hidden rounded-2xl bg-[#03162F] shadow-lg">
        <div className="border-b border-white/10 p-6">
          <SectionTitle
            title="Payroll Summary"
            description="Payroll figures from the HR payroll system."
          />
        </div>

        <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          <PayrollStat
            label="Gross Pay"
            value={formatMoney(
              data.payroll.grossPay
            )}
          />

          <PayrollStat
            label="Allowances"
            value={formatMoney(
              data.payroll.allowances
            )}
          />

          <PayrollStat
            label="Deductions"
            value={formatMoney(
              data.payroll.deductions
            )}
          />

          <PayrollStat
            label="Net Pay"
            value={formatMoney(
              data.payroll.netPay
            )}
            highlight
          />
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3">
          <DarkMetric
            label="Payroll Periods"
            value={data.payroll.periods}
          />

          <DarkMetric
            label="Payroll Runs"
            value={data.payroll.runs}
          />

          <DarkMetric
            label="Employees Processed"
            value={data.payroll.employees}
          />
        </div>
      </section>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.min(
          Math.round(
            (value / total) * 100
          ),
          100
        )
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="truncate text-sm font-semibold text-slate-700">
          {label}
        </span>

        <span className="text-sm font-black text-[#03162F]">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#B8860B] transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  className: string;
}) {
  return (
    <div
      className={`rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />

        <span className="text-sm font-bold">
          {label}
        </span>
      </div>

      <p className="mt-2 text-2xl font-black">
        {value}
      </p>
    </div>
  );
}

function PayrollStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[#03162F] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-black ${
          highlight
            ? "text-[#D4AF37]"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DarkMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
      {text}
    </div>
  );
}

function BarChart3Icon() {
  return (
    <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
  );
}