import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const bookingStats = [
  {
    title: "Total Bookings",
    value: "0",
    icon: CalendarDays,
  },
  {
    title: "Pending",
    value: "0",
    icon: Clock,
  },
  {
    title: "Completed",
    value: "0",
    icon: CheckCircle2,
  },
  {
    title: "Cancelled",
    value: "0",
    icon: XCircle,
  },
];

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Bookings
        </h1>

        <p className="mt-1 text-slate-500">
          Manage customer bookings and appointments across
          Alessandro Enterprises.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {bookingStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
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
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="py-10 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />

          <h2 className="mt-4 text-xl font-bold text-[#03162F]">
            No bookings yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Customer bookings will appear here once they are
            created.
          </p>
        </div>
      </div>
    </div>
  );
}