import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  CircleDollarSign,
} from "lucide-react";

import {
  getBookings,
  getBookingStats,
  getBookingFormData,
} from "@/modules/bookings/services/booking.service";

import BookingManager from "@/modules/bookings/components/BookingManager";

function formatDate(date: string) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(amount: number) {
  return `ZMW ${amount.toFixed(2)}`;
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

function paymentClass(status: string) {
  switch (status) {
    case "Paid":
      return "bg-green-100 text-green-700";

    case "Partial":
      return "bg-blue-100 text-blue-700";

    case "Refunded":
      return "bg-red-100 text-red-700";

    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default async function BookingsPage() {
  const [bookings, stats, formData] =
    await Promise.all([
      getBookings(),
      getBookingStats(),
      getBookingFormData(),
    ]);

  const bookingStats = [
    {
      title: "Total Bookings",
      value: stats.total,
      icon: CalendarDays,
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
    },
    {
      title: "Cancelled",
      value: stats.cancelled,
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Bookings
        </h1>

        <p className="mt-1 text-slate-500">
          Manage customer bookings and appointments
          across Alessandro Enterprises.
        </p>
      </div>

      {/* New Booking */}
      <BookingManager
        bookings={bookings}
        formData={formData}
      />

      {/* Statistics */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {bookingStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#03162F]">
                    {stat.value}
                  </p>
                </div>

                <div className="rounded-xl bg-[#03162F] p-3 text-white">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Paid Revenue
              </p>

              <p className="mt-2 text-2xl font-bold text-[#03162F]">
                {formatMoney(stats.revenue)}
              </p>
            </div>

            <div className="rounded-xl bg-[#D4AF37] p-3 text-[#03162F]">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Records */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-[#03162F]">
            Booking Records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {bookings.length} booking
            {bookings.length === 1 ? "" : "s"} found.
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />

            <h3 className="mt-4 text-lg font-bold text-[#03162F]">
              No bookings yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Customer bookings will appear here once
              they are created.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Date
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Business
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Service / Item
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Employee
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Payment
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#03162F]">
                        {formatDate(
                          booking.booking_date
                        )}
                      </div>

                      {booking.booking_time && (
                        <div className="text-sm text-slate-500">
                          {booking.booking_time.slice(
                            0,
                            5
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {booking.customers
                          ?.full_name ??
                          "Walk-in / Unknown"}
                      </div>

                      <div className="text-sm text-slate-500">
                        {booking.customers?.phone ??
                          ""}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {booking.businesses?.name ??
                        "—"}
                    </td>

                    <td className="px-6 py-4">
                      {booking.enterprise_catalog
                        ?.name ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      {booking.employees?.full_name ??
                        "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paymentClass(
                          booking.payment_status
                        )}`}
                      >
                        {booking.payment_status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-semibold">
                      {formatMoney(
                        Number(
                          booking.amount ?? 0
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}