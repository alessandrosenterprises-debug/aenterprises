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

function formatMoney(amount: number) {
  return `ZMW ${amount.toFixed(2)}`;
}

export default async function BookingsPage() {
  const [
    bookings,
    stats,
    formData,
  ] = await Promise.all([
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
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Bookings
        </h1>

        <p className="mt-1 text-slate-500">
          Manage customer bookings and appointments
          across Alessandro Enterprises.
        </p>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

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

        {/* =================================================
            REVENUE
        ================================================= */}

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

      {/* =====================================================
          BOOKING MANAGER

          This now contains:
          - New Booking
          - Booking Records
          - Actions dropdown
          - View
          - Edit
          - Confirm
          - Complete
          - Reject
          - Cancel
          - Delete
      ===================================================== */}

      <BookingManager
        bookings={bookings}
        formData={formData}
      />
    </div>
  );
}