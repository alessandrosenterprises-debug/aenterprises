"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Bell,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";

import {
  updateBooking,
  type BookingPayload,
} from "@/modules/bookings/services/booking.client";

import type { Booking } from "@/modules/bookings/services/booking.service";

interface OperationsCenterProps {
  bookings: Booking[];
}

function formatMoney(amount: number) {
  return `ZMW ${Number(amount ?? 0).toFixed(2)}`;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-ZM",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatTime(time: string | null) {
  if (!time) return "Time not set";

  return time.slice(0, 5);
}

function getToday() {
  return new Date().toLocaleDateString(
    "en-CA",
    {
      timeZone: "Africa/Lusaka",
    }
  );
}

function statusClass(status: string) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700";

    case "Confirmed":
      return "bg-blue-100 text-blue-700";

    case "Cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function OperationsCenter({
  bookings,
}: OperationsCenterProps) {
  const router = useRouter();

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const today = getToday();

  const pendingBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "Pending"
      ),
    [bookings]
  );

  const todaysBookings = useMemo(
    () =>
      bookings
        .filter(
          (booking) =>
            booking.booking_date === today &&
            booking.status !== "Cancelled"
        )
        .sort((a, b) =>
          (a.booking_time ?? "").localeCompare(
            b.booking_time ?? ""
          )
        ),
    [bookings, today]
  );

  async function changeStatus(
    status: BookingPayload["status"]
  ) {
    if (!selectedBooking) return;

    setSaving(true);
    setError("");

    try {
      await updateBooking(
        selectedBooking.id,
        {
          status,
        }
      );

      setSelectedBooking(null);

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update booking."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#03162F]">
                Operations Center
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Handle incoming customer activity without
                leaving the dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/customers"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#03162F] transition hover:bg-slate-50"
              >
                <UserPlus className="h-4 w-4" />
                Add Customer
              </Link>

              <Link
                href="/dashboard/notifications"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#03162F] transition hover:bg-slate-50"
              >
                <Bell className="h-4 w-4" />
                Notifications
              </Link>

              <Link
                href="/dashboard/bookings"
                className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A2852]"
              >
                <CalendarDays className="h-4 w-4" />
                All Bookings
              </Link>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Requests
                </p>

                <p className="mt-2 text-3xl font-bold text-[#03162F]">
                  {pendingBookings.length}
                </p>
              </div>

              <div className="rounded-xl bg-yellow-100 p-3 text-yellow-700">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Today's Bookings
                </p>

                <p className="mt-2 text-3xl font-bold text-[#03162F]">
                  {todaysBookings.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/customers"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#03162F] hover:bg-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Walk-in Customer
                </p>

                <p className="mt-2 font-semibold text-[#03162F]">
                  Register a customer
                </p>
              </div>

              <div className="rounded-xl bg-green-100 p-3 text-green-700">
                <UserPlus className="h-5 w-5" />
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/notifications"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#03162F] hover:bg-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Notifications
                </p>

                <p className="mt-2 font-semibold text-[#03162F]">
                  Check incoming alerts
                </p>
              </div>

              <div className="rounded-xl bg-[#03162F] p-3 text-white">
                <Bell className="h-5 w-5" />
              </div>
            </div>
          </Link>
        </div>

        {/* MAIN WORK AREA */}
        <div className="grid gap-6 border-t border-slate-200 p-6 lg:grid-cols-2">
          {/* INCOMING */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#03162F]">
                  Incoming Bookings
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Requests waiting for a response.
                </p>
              </div>

              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                {pendingBookings.length} pending
              </span>
            </div>

            <div className="space-y-3">
              {pendingBookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />

                  <p className="mt-3 font-semibold text-[#03162F]">
                    All caught up
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    There are no pending bookings.
                  </p>
                </div>
              ) : (
                pendingBookings
                  .slice(0, 5)
                  .map((booking) => (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={() => {
                        setError("");
                        setSelectedBooking(
                          booking
                        );
                      }}
                      className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#03162F] hover:bg-slate-50"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white">
                        <CalendarDays className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#03162F]">
                          {booking.customers
                            ?.full_name ??
                            "Walk-in Customer"}
                        </p>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          {booking.businesses
                            ?.name ??
                            "Business"}{" "}
                          •{" "}
                          {booking
                            .enterprise_catalog
                            ?.name ??
                            "Booking"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            booking.booking_date
                          )}{" "}
                          •{" "}
                          {formatTime(
                            booking.booking_time
                          )}
                        </p>
                      </div>

                      <div className="hidden text-right sm:block">
                        <p className="font-bold text-[#03162F]">
                          {formatMoney(
                            booking.amount
                          )}
                        </p>

                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#03162F]" />
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* TODAY */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#03162F]">
                  Today's Schedule
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Appointments and bookings for today.
                </p>
              </div>

              <Link
                href="/dashboard/bookings"
                className="text-sm font-semibold text-[#03162F] hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {todaysBookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />

                  <p className="mt-3 font-semibold text-[#03162F]">
                    No bookings today
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Today's schedule is clear.
                  </p>
                </div>
              ) : (
                todaysBookings
                  .slice(0, 5)
                  .map((booking) => (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={() => {
                        setError("");
                        setSelectedBooking(
                          booking
                        );
                      }}
                      className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
                    >
                      <div className="w-16 shrink-0 text-center">
                        <p className="text-sm font-bold text-[#03162F]">
                          {formatTime(
                            booking.booking_time
                          )}
                        </p>
                      </div>

                      <div className="h-10 w-px bg-slate-200" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#03162F]">
                          {booking.customers
                            ?.full_name ??
                            "Walk-in Customer"}
                        </p>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          {booking
                            .enterprise_catalog
                            ?.name ??
                            "Booking"}
                        </p>
                      </div>

                      <span
                        className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${statusClass(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BOOKING DETAIL MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03162F]/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Booking Details
                </p>

                <h2 className="mt-1 text-2xl font-bold text-[#03162F]">
                  {selectedBooking.customers
                    ?.full_name ??
                    "Walk-in Customer"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedBooking(null)
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Business
                  </p>

                  <p className="mt-1 font-semibold text-[#03162F]">
                    {selectedBooking.businesses
                      ?.name ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Service
                  </p>

                  <p className="mt-1 font-semibold text-[#03162F]">
                    {selectedBooking
                      .enterprise_catalog
                      ?.name ?? "Booking"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Date
                  </p>

                  <p className="mt-1 font-semibold text-[#03162F]">
                    {formatDate(
                      selectedBooking.booking_date
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Time
                  </p>

                  <p className="mt-1 font-semibold text-[#03162F]">
                    {formatTime(
                      selectedBooking.booking_time
                    )}
                  </p>
                </div>
              </div>

              {selectedBooking.customers?.phone && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Customer Phone
                  </p>

                  <p className="mt-1 font-semibold text-[#03162F]">
                    {selectedBooking.customers.phone}
                  </p>
                </div>
              )}

              {selectedBooking.employees && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Employee
                  </p>

                  <p className="mt-1 font-semibold text-[#03162F]">
                    {selectedBooking.employees.full_name}
                  </p>
                </div>
              )}

              {selectedBooking.notes && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Notes
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                <div>
                  <p className="text-sm text-slate-500">
                    Amount
                  </p>

                  <p className="text-xl font-bold text-[#03162F]">
                    {formatMoney(
                      selectedBooking.amount
                    )}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                    selectedBooking.status
                  )}`}
                >
                  {selectedBooking.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 p-6">
              {selectedBooking.status ===
                "Pending" && (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      changeStatus("Cancelled")
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      changeStatus("Confirmed")
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-2.5 font-semibold text-white transition hover:bg-[#0A2852] disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {saving
                      ? "Updating..."
                      : "Confirm Booking"}
                  </button>
                </>
              )}

              {selectedBooking.status ===
                "Confirmed" && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    changeStatus("Completed")
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {saving
                    ? "Updating..."
                    : "Mark Completed"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}