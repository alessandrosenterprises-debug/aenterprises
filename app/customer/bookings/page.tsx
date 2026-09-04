import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";
import {
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
  CheckCircle2,
  XCircle,
  Hourglass,
  Plus,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Booking {
  id: string;
  business_id: string;
  customer_id: string | null;
  employee_id: string | null;
  branch_id: string | null;
  catalog_item_id: string | null;
  booking_date: string;
  booking_time: string | null;
  status: string;
  payment_status: string;
  amount: number;
  notes: string | null;

  businesses?: {
    id: string;
    name: string;
  } | null;

  employees?: {
    id: string;
    full_name: string;
  } | null;

  branches?: {
    id: string;
    name: string;
  } | null;

  enterprise_catalog?: {
    id: string;
    name: string;
    item_type: string;
  } | null;
}

function formatMoney(amount: number) {
  return `ZMW ${Number(amount ?? 0).toFixed(2)}`;
}

function formatDate(date: string) {
  if (!date) return "Date not available";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-ZM", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time: string | null) {
  if (!time) return "Time not set";

  const [hours, minutes] = time.split(":");

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-ZM", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();

  if (normalized === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Confirmed
      </span>
    );
  }

  if (normalized === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (normalized === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
      <Hourglass className="h-3.5 w-3.5" />
      Pending
    </span>
  );
}

export default async function CustomerBookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24">
        <CustomerNavigation />

        <section className="mx-auto max-w-3xl px-5 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#03162F] text-white">
              <CalendarDays className="h-6 w-6" />
            </div>

            <h1 className="mt-4 text-xl font-bold text-[#03162F]">
              Please sign in
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              You need to sign in to view your bookings.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /*
   * Customer records are connected through the customer's phone/email
   * profile rather than assuming auth.users.id = customers.id.
   *
   * First try to find the customer using the authenticated user's email.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  let customer: {
    id: string;
    full_name: string;
    phone: string;
  } | null = null;

  if (profile?.email) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("email", profile.email)
      .maybeSingle();

    customer = data;
  }

  if (!customer && user.email) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("email", user.email)
      .maybeSingle();

    customer = data;
  }

  if (!customer && profile?.phone) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("phone", profile.phone)
      .maybeSingle();

    customer = data;
  }

  /*
   * No customer record yet.
   */
  if (!customer) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24">
        <CustomerNavigation />

        <section className="bg-[#03162F] px-5 pb-10 pt-7 text-white">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Customer
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              My Bookings
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              View your appointments and booking history.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-[#03162F]">
              <CalendarDays className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-[#03162F]">
              No customer profile found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              We could not find a customer account connected to your
              profile yet.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /*
   * Get this customer's bookings.
   */
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      business_id,
      customer_id,
      employee_id,
      branch_id,
      catalog_item_id,
      booking_date,
      booking_time,
      status,
      payment_status,
      amount,
      notes,

      businesses (
        id,
        name
      ),

      employees (
        id,
        full_name
      ),

      branches (
        id,
        name
      ),

      enterprise_catalog (
        id,
        name,
        item_type
      )
    `)
    .eq("customer_id", customer.id)
    .order("booking_date", {
      ascending: true,
    })
    .order("booking_time", {
      ascending: true,
    });

  if (error) {
    console.error("Customer bookings error:", error);
  }

  const bookings = (data ?? []) as unknown as Booking[];

  const upcomingBookings = bookings.filter((booking) => {
    const status = booking.status?.toLowerCase();

    return (
      status !== "cancelled" &&
      status !== "completed"
    );
  });

  const completedBookings = bookings.filter(
    (booking) =>
      booking.status?.toLowerCase() === "completed"
  );

  const cancelledBookings = bookings.filter(
    (booking) =>
      booking.status?.toLowerCase() === "cancelled"
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <CustomerNavigation />

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <section className="bg-[#03162F] px-5 pb-10 pt-7 text-white">
  <div className="mx-auto max-w-4xl">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
          Customer
        </p>

        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          My Bookings
        </h1>

        <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
          View your appointments and booking history with
          Alessandro Enterprises.
        </p>
      </div>

      <a
  href="/customer/bookings/new"
  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#03162F] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e5c34a] hover:shadow-xl active:translate-y-0 sm:w-auto"
>
  <Plus className="h-5 w-5" strokeWidth={2.5} />
  New Booking
</a>
    </div>
  </div>
</section>

      <section className="mx-auto max-w-4xl px-5 py-8">
        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Upcoming
                </p>

                <p className="mt-1 text-3xl font-bold text-[#03162F]">
                  {upcomingBookings.length}
                </p>
              </div>

              <div className="rounded-xl bg-[#03162F] p-3 text-white">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Completed
                </p>

                <p className="mt-1 text-3xl font-bold text-[#03162F]">
                  {completedBookings.length}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Cancelled
                </p>

                <p className="mt-1 text-3xl font-bold text-[#03162F]">
                  {cancelledBookings.length}
                </p>
              </div>

              <div className="rounded-xl bg-red-100 p-3 text-red-700">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            BOOKINGS
        ================================================= */}

        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#03162F]">
              Your Bookings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Appointments associated with your customer account.
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-[#03162F]">
                <CalendarDays className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#03162F]">
                No bookings yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Your appointments will appear here once you make
                a booking with one of our businesses.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {bookings.map((booking) => (
                <article
                  key={booking.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* TOP */}

                  <div className="border-b border-slate-100 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
                          {booking.businesses?.name ||
                            "Alessandro Enterprises"}
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-[#03162F]">
                          {booking.enterprise_catalog?.name ||
                            "Appointment"}
                        </h3>
                      </div>

                      <StatusBadge
                        status={booking.status}
                      />
                    </div>
                  </div>

                  {/* DETAILS */}

                  <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
                        <CalendarDays className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#03162F]">
                          {formatDate(
                            booking.booking_date
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
                        <Clock className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Time
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#03162F]">
                          {formatTime(
                            booking.booking_time
                          )}
                        </p>
                      </div>
                    </div>

                    {booking.branches?.name && (
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
                          <MapPin className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Branch
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#03162F]">
                            {booking.branches.name}
                          </p>
                        </div>
                      </div>
                    )}

                    {booking.employees?.full_name && (
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
                          <UserRound className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Staff Member
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#03162F]">
                            {booking.employees.full_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PAYMENT */}

                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Payment
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-[#03162F]">
                          {booking.payment_status ||
                            "Pending"}
                        </p>
                      </div>

                      <p className="text-lg font-bold text-[#03162F]">
                        {formatMoney(booking.amount)}
                      </p>
                    </div>
                  </div>

                  {/* NOTES */}

                  {booking.notes && (
                    <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Notes
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {booking.notes}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}