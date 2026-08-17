"use client";

import {
  BarChart3,
  CalendarDays,
  Users,
  Briefcase,
  DollarSign,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  getReportData,
  type ReportBusiness,
  type ReportBooking,
  type ReportStats,
} from "./actions";

function getToday() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStartOfMonth() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}-01`;
}

function formatDate(date: string) {
  if (!date) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] = date.split("-").map(Number);

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
  return `ZMW ${value.toLocaleString(
    "en-ZM",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatTime(time: string | null) {
  if (!time) {
    return "";
  }

  const [hours, minutes] =
    time.split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-ZM",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getStatusClass(status: string) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700";

    case "Confirmed":
      return "bg-blue-100 text-blue-700";

    case "Pending":
      return "bg-yellow-100 text-yellow-700";

    case "Cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ReportsPage() {
  const today = getToday();
  const startOfMonth = getStartOfMonth();

  const fromDateInputRef =
  useRef<HTMLInputElement>(null);

const toDateInputRef =
  useRef<HTMLInputElement>(null);

function openDatePicker(
  input: HTMLInputElement | null
) {
  if (!input) return;

  if (typeof input.showPicker === "function") {
    input.showPicker();
  } else {
    input.focus();
    input.click();
  }
}

  /*
   * Filter values.
   *
   * The report now starts with:
   *
   * From Date = first day of current month
   * To Date   = today
   *
   * Users can change either date independently.
   */
  const [
    fromDate,
    setFromDate,
  ] = useState(startOfMonth);

  const [
    toDate,
    setToDate,
  ] = useState(today);

  const [
    businessId,
    setBusinessId,
  ] = useState("");

  /*
   * Report data
   */
  const [
    businesses,
    setBusinesses,
  ] = useState<ReportBusiness[]>([]);

  const [
    bookings,
    setBookings,
  ] = useState<ReportBooking[]>([]);

  const [
    stats,
    setStats,
  ] = useState<ReportStats>({
    totalBookings: 0,
    customersAttended: 0,
    servicesCompleted: 0,
    totalRevenue: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  });

  /*
   * Currently applied filters.
   *
   * These are separate from the inputs so that
   * changing a date does not change the report
   * until Apply Filters is clicked.
   */
  const [
    appliedFromDate,
    setAppliedFromDate,
  ] = useState(startOfMonth);

  const [
    appliedToDate,
    setAppliedToDate,
  ] = useState(today);

  const [
    appliedBusinessId,
    setAppliedBusinessId,
  ] = useState("");

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    error,
    setError,
  ] = useState("");

  /*
   * Load report data from the server.
   */
  async function loadReport(
    nextFromDate: string,
    nextToDate: string,
    nextBusinessId: string
  ) {
    setError("");

    try {
      const result = await getReportData({
        fromDate: nextFromDate,
        toDate: nextToDate,
        businessId:
          nextBusinessId || undefined,
      });

      setBusinesses(
        result.businesses
      );

      setBookings(
        result.bookings
      );

      setStats(
        result.stats
      );
    } catch (err) {
      console.error(
        "Report loading error:",
        err
      );

      setError(
        "Unable to load the report. Please try again."
      );
    }
  }

  /*
   * Initial report.
   *
   * IMPORTANT:
   * This is NOT today → today anymore.
   *
   * It loads:
   * first day of current month → today
   */
  useEffect(() => {
    startTransition(() => {
      void loadReport(
        startOfMonth,
        today,
        ""
      );
    });
  }, []);

  /*
   * Apply the selected date range.
   */
  function handleApplyFilters() {
    setError("");

    if (!fromDate || !toDate) {
      setError(
        "Please select both a From Date and a To Date."
      );

      return;
    }

    if (fromDate > toDate) {
      setError(
        "From Date cannot be later than To Date."
      );

      return;
    }

    /*
     * Save the filters currently being applied.
     */
    setAppliedFromDate(
      fromDate
    );

    setAppliedToDate(
      toDate
    );

    setAppliedBusinessId(
      businessId
    );

    /*
     * Query Supabase using the complete range.
     */
    startTransition(() => {
      void loadReport(
        fromDate,
        toDate,
        businessId
      );
    });
  }

  /*
   * Reset report to:
   *
   * First day of current month → today
   *
   * and all businesses.
   */
  function handleClearFilters() {
    setError("");

    setFromDate(startOfMonth);
    setToDate(today);
    setBusinessId("");

    setAppliedFromDate(
      startOfMonth
    );

    setAppliedToDate(today);

    setAppliedBusinessId("");

    startTransition(() => {
      void loadReport(
        startOfMonth,
        today,
        ""
      );
    });
  }

  /*
   * Find the currently applied business.
   */
  const selectedBusinessName =
    appliedBusinessId
      ? businesses.find(
          (business) =>
            business.id ===
            appliedBusinessId
        )?.name ??
        "Selected Business"
      : "All Businesses";

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Reports
        </h1>

        <p className="mt-1 text-slate-500">
          View business performance,
          customers, services and
          revenue across any date
          range.
        </p>
      </div>

      {/* FILTER PANEL */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-[#03162F] p-2.5 text-white">
            <Filter className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-bold text-[#03162F]">
              Report Filters
            </h2>

            <p className="text-sm text-slate-500">
              Select a From Date and
              To Date to generate a
              report for that period.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {/* FROM DATE */}

         <div>
  <label
    htmlFor="to-date"
    className="mb-2 block text-sm font-semibold text-slate-700"
  >
    To Date
  </label>

  <div
    className="relative cursor-pointer"
    onClick={() =>
      openDatePicker(
        toDateInputRef.current
      )
    }
  >
    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

    <input
      ref={toDateInputRef}
      id="to-date"
      type="date"
      value={toDate}
      min={fromDate || undefined}
      onChange={(event) =>
        setToDate(event.target.value)
      }
      className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-700 outline-none transition focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10"
    />
  </div>
</div>

          {/* TO DATE */}

          <div>
            <label
              htmlFor="to-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              To Date
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                id="to-date"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) =>
                  setToDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-700 outline-none transition focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10"
              />
            </div>
          </div>

          {/* BUSINESS */}

          <div>
            <label
              htmlFor="business"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Business
            </label>

            <select
              id="business"
              value={businessId}
              onChange={(event) =>
                setBusinessId(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10"
            >
              <option value="">
                All Businesses
              </option>

              {businesses.map(
                (business) => (
                  <option
                    key={
                      business.id
                    }
                    value={
                      business.id
                    }
                  >
                    {business.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={
              handleApplyFilters
            }
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BarChart3 className="h-5 w-5" />

            {isPending
              ? "Loading..."
              : "Apply Filters"}
          </button>

          <button
            type="button"
            onClick={
              handleClearFilters
            }
            disabled={isPending}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* ACTIVE REPORT RANGE */}

      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-2.5 text-[#03162F] shadow-sm">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Report Period
            </p>

            <p className="font-semibold text-[#03162F]">
              {formatDate(
                appliedFromDate
              )}{" "}
              —{" "}
              {formatDate(
                appliedToDate
              )}
            </p>
          </div>
        </div>

        <div className="text-sm font-medium text-slate-600">
          {selectedBusinessName}
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <ReportStatCard
          title="Total Bookings"
          value={stats.totalBookings.toString()}
          icon={ClipboardList}
        />

        <ReportStatCard
          title="Customers Attended"
          value={stats.customersAttended.toString()}
          icon={Users}
        />

        <ReportStatCard
          title="Services Completed"
          value={stats.servicesCompleted.toString()}
          icon={Briefcase}
        />

        <ReportStatCard
          title="Total Revenue"
          value={formatCurrency(
            stats.totalRevenue
          )}
          icon={DollarSign}
        />
      </div>

      {/* STATUS SUMMARY */}

      <div className="grid gap-5 sm:grid-cols-3">
        <StatusCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          className="bg-yellow-50 text-yellow-700"
        />

        <StatusCard
          title="Confirmed"
          value={stats.confirmed}
          icon={CheckCircle2}
          className="bg-blue-50 text-blue-700"
        />

        <StatusCard
          title="Cancelled"
          value={stats.cancelled}
          icon={XCircle}
          className="bg-red-50 text-red-700"
        />
      </div>

      {/* BOOKING ACTIVITY */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-[#03162F]">
            Report Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Bookings recorded from{" "}
            <span className="font-semibold">
              {formatDate(
                appliedFromDate
              )}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {formatDate(
                appliedToDate
              )}
            </span>
            .
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="py-16 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />

            <h3 className="mt-4 text-lg font-bold text-[#03162F]">
              No bookings found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              There are no bookings matching
              the selected date range and
              business filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Date
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Business
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Service
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {bookings.map(
                  (booking) => (
                    <tr
                      key={
                        booking.id
                      }
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#03162F]">
                          {formatDate(
                            booking.booking_date
                          )}
                        </div>

                        {booking.booking_time && (
                          <div className="mt-1 text-xs text-slate-500">
                            {formatTime(
                              booking.booking_time
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-[#03162F]">
                          {booking.customers
                            ?.full_name ??
                            "Walk-in / Unknown"}
                        </p>

                        {booking.customers
                          ?.phone && (
                          <p className="mt-1 text-xs text-slate-500">
                            {
                              booking
                                .customers
                                .phone
                            }
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {booking.businesses
                          ?.name ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-[#03162F]">
                          {booking
                            .enterprise_catalog
                            ?.name ??
                            "Booking"}
                        </p>

                        {booking
                          .enterprise_catalog
                          ?.item_type && (
                          <p className="mt-1 text-xs capitalize text-slate-500">
                            {
                              booking
                                .enterprise_catalog
                                .item_type
                            }
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {
                            booking.status
                          }
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-[#03162F]">
                          {formatCurrency(
                            Number(
                              booking.amount ??
                                0
                            )
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            booking.payment_status
                          }
                        </p>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
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
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 truncate text-2xl font-bold text-[#03162F]">
            {value}
          </p>
        </div>

        <div className="shrink-0 rounded-xl bg-[#03162F] p-3 text-white">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  title,
  value,
  icon: Icon,
  className,
}: {
  title: string;
  value: number;
  icon: typeof Clock;
  className: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#03162F]">
            {value}
          </p>
        </div>

        <div
          className={`rounded-xl p-3 ${className}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
