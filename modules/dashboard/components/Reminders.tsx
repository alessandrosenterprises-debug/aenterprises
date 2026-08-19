"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Settings,
} from "lucide-react";

interface ReminderBooking {
  id: string;
  booking_date: string;
  booking_time: string | null;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  payment_status:
    | "Pending"
    | "Partial"
    | "Paid"
    | "Refunded";
  amount: number;
  customers?: {
    full_name: string;
  } | null;
  businesses?: {
    name: string;
  } | null;
}

interface ReminderBusiness {
  id: string;
  name: string;
  active: boolean;
}

interface RemindersProps {
  bookings: ReminderBooking[];
  businesses?: ReminderBusiness[];
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-ZM",
    {
      day: "numeric",
      month: "short",
    }
  );
}

function formatTime(time: string | null) {
  if (!time) return "";

  return time.slice(0, 5);
}

export default function Reminders({
  bookings,
  businesses = [],
}: RemindersProps) {
  const pendingBookings = bookings.filter(
    (booking) => booking.status === "Pending"
  );

  const upcomingBookings = bookings
    .filter(
      (booking) =>
        booking.status === "Confirmed"
    )
    .slice(0, 3);

  const unpaidCompletedBookings = bookings.filter(
    (booking) =>
      booking.status === "Completed" &&
      booking.payment_status !== "Paid"
  );

  const inactiveBusinesses = businesses.filter(
    (business) => !business.active
  );

  const reminders = [
    ...pendingBookings
      .slice(0, 3)
      .map((booking) => ({
        key: `pending-${booking.id}`,
        type: "pending",
        icon: Clock,
        title: "Booking needs confirmation",
        description:
          booking.customers?.full_name ??
          "Customer booking",
        detail: `${formatDate(
          booking.booking_date
        )}${
          booking.booking_time
            ? ` • ${formatTime(
                booking.booking_time
              )}`
            : ""
        }`,
        href: "/dashboard/bookings",
      })),

    ...upcomingBookings.map((booking) => ({
      key: `upcoming-${booking.id}`,
      type: "upcoming",
      icon: CalendarClock,
      title: "Upcoming booking",
      description:
        booking.customers?.full_name ??
        "Customer booking",
      detail: `${formatDate(
        booking.booking_date
      )}${
        booking.booking_time
          ? ` • ${formatTime(
              booking.booking_time
            )}`
          : ""
      }`,
      href: "/dashboard/bookings",
    })),

    ...unpaidCompletedBookings
      .slice(0, 2)
      .map((booking) => ({
        key: `payment-${booking.id}`,
        type: "payment",
        icon: CreditCard,
        title: "Payment needs attention",
        description:
          booking.customers?.full_name ??
          "Completed booking",
        detail: `${booking.payment_status} payment`,
        href: "/dashboard/bookings",
      })),

    ...inactiveBusinesses
      .slice(0, 2)
      .map((business) => ({
        key: `business-${business.id}`,
        type: "business",
        icon: Settings,
        title: "Business is inactive",
        description: business.name,
        detail: "Review business status",
        href: "/dashboard/configuration/businesses",
      })),
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#03162F]">
              Reminders & Attention
            </h2>

            {reminders.length > 0 && (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                {reminders.length}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Things that may need your attention today.
          </p>
        </div>

        <AlertCircle className="h-5 w-5 text-[#D4AF37]" />
      </div>

      {reminders.length === 0 ? (
        <div className="rounded-xl border border-green-100 bg-green-50 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />

            <div>
              <p className="font-semibold text-green-800">
                Everything looks good
              </p>

              <p className="mt-1 text-sm text-green-700">
                There are no outstanding reminders right now.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.slice(0, 6).map((reminder) => {
            const Icon = reminder.icon;

            return (
              <Link
                key={reminder.key}
                href={reminder.href}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition-all hover:-translate-y-0.5 hover:border-[#D4AF37] hover:bg-slate-50 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#03162F]">
                    {reminder.title}
                  </p>

                  <p className="mt-0.5 truncate text-sm text-slate-600">
                    {reminder.description}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {reminder.detail}
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#03162F]" />
              </Link>
            );
          })}
        </div>
      )}

      {reminders.length > 6 && (
        <Link
          href="/dashboard/bookings"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#03162F] transition hover:bg-slate-50"
        >
          View all reminders
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}