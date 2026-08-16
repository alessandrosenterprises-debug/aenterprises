"use client";

import {
  BarChart3,
  CalendarDays,
  Users,
  Briefcase,
  DollarSign,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

interface ReportStats {
  customersAttended: number;
  servicesCompleted: number;
  totalRevenue: number;
}

interface ReportActivity {
  id: string;
  type: "booking";
  title: string;
  created_at: string;
  customerName?: string;
  businessName?: string;
  serviceName?: string;
}

function formatDate(date: string) {
  if (!date) {
    return "";
  }

  const [year, month, day] = date
    .split("-")
    .map(Number);

  const formattedDate = new Date(
    year,
    month - 1,
    day
  );

  return formattedDate.toLocaleDateString(
    "en-ZM",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function formatCurrency(value: number) {
  return `ZMW ${value.toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ReportsPage() {
  const dateInputRef =
    useRef<HTMLInputElement>(null);

  const [selectedDate, setSelectedDate] =
    useState("");

  /*
   * These values are intentionally kept as local
   * presentation state for now.
   *
   * The actual report data connection will be
   * implemented separately once the report queries
   * and business relationships are finalized.
   */
  const reportStats: ReportStats = {
    customersAttended: 0,
    servicesCompleted: 0,
    totalRevenue: 0,
  };

  const reportActivity: ReportActivity[] = [];

  function openDatePicker() {
    const input = dateInputRef.current;

    if (!input) {
      return;
    }

    if (
      typeof input.showPicker === "function"
    ) {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  function handleDateChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setSelectedDate(event.target.value);
  }

  function clearDate() {
    setSelectedDate("");

    if (dateInputRef.current) {
      dateInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#03162F]">
            Reports
          </h1>

          <p className="mt-1 text-slate-500">
            View business performance, customers,
            services and revenue.
          </p>
        </div>

        <div className="relative">
          {/* Native date picker */}
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            tabIndex={-1}
            aria-hidden="true"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openDatePicker}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#0A2852] active:scale-[0.98]"
            >
              <CalendarDays className="h-5 w-5" />

              {selectedDate
                ? formatDate(selectedDate)
                : "Choose Date"}
            </button>

            {selectedDate && (
              <button
                type="button"
                onClick={clearDate}
                aria-label="Clear selected date"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SELECTED DATE */}
      {selectedDate && (
        <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2 text-[#03162F] shadow-sm">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Report Date
              </p>

              <p className="font-semibold text-[#03162F]">
                {formatDate(selectedDate)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearDate}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Clear
          </button>
        </div>
      )}

      {/* REPORT STATISTICS */}
      <div className="grid gap-5 md:grid-cols-3">
        <ReportStatCard
          title="Customers Attended"
          value={reportStats.customersAttended.toString()}
          icon={Users}
        />

        <ReportStatCard
          title="Services Completed"
          value={reportStats.servicesCompleted.toString()}
          icon={Briefcase}
        />

        <ReportStatCard
          title="Total Revenue"
          value={formatCurrency(
            reportStats.totalRevenue
          )}
          icon={DollarSign}
        />
      </div>

      {/* REPORT CONTENT */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {reportActivity.length === 0 ? (
          <div className="py-10 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />

            <h2 className="mt-4 text-xl font-bold text-[#03162F]">
              {selectedDate
                ? `Report for ${formatDate(
                    selectedDate
                  )}`
                : "Reports are ready for data"}
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              {selectedDate
                ? "The selected report date is ready. Once transactions, bookings and completed services are connected to the reporting system, the statistics and activity for this date will appear here."
                : "Once transactions, bookings and services are recorded, detailed reports will be displayed here. Reports will support date and business filtering."}
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#03162F]">
                {selectedDate
                  ? `Report for ${formatDate(
                      selectedDate
                    )}`
                  : "Recent Report Activity"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Activity recorded for the selected
                reporting period.
              </p>
            </div>

            <div className="space-y-3">
              {reportActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-semibold text-[#03162F]">
                    {activity.title}
                  </p>

                  {activity.customerName && (
                    <p className="mt-1 text-sm text-slate-500">
                      Customer:{" "}
                      {activity.customerName}
                    </p>
                  )}

                  {activity.businessName && (
                    <p className="text-sm text-slate-500">
                      Business:{" "}
                      {activity.businessName}
                    </p>
                  )}

                  {activity.serviceName && (
                    <p className="text-sm text-slate-500">
                      Service:{" "}
                      {activity.serviceName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportStatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-[#03162F]">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-[#03162F] p-3 text-white">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}