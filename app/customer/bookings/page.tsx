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
  CreditCard,
  Tag,
} from "lucide-react";
import CancelBookingButton from "./CancelBookingButton";
import BookingSectionNavigation from "./BookingSectionNavigation";
import Link from "next/link";

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

/* =========================================================
   HELPERS
========================================================= */

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

function normalizeStatus(status: string | null | undefined) {
  return status?.toLowerCase().trim() || "pending";
}

/* =========================================================
   STATUS CARD
========================================================= */

function StatusCard({
  type,
  count,
}: {
  type: "pending" | "confirmed" | "completed" | "cancelled";
  count: number;
}) {
  const config = {
    pending: {
      label: "Pending",
      description: "Awaiting confirmation",
      icon: Hourglass,
      wrapper: "border-amber-200 bg-amber-50/40",
      iconWrapper: "bg-amber-100 text-amber-600",
      count: "text-slate-900",
      labelColor: "text-amber-700",
    },

    confirmed: {
      label: "Confirmed",
      description: "Booking confirmed",
      icon: CheckCircle2,
      wrapper: "border-emerald-200 bg-emerald-50/40",
      iconWrapper: "bg-emerald-100 text-emerald-600",
      count: "text-slate-900",
      labelColor: "text-emerald-700",
    },

    completed: {
      label: "Completed",
      description: "Appointment completed",
      icon: CheckCircle2,
      wrapper: "border-blue-200 bg-blue-50/40",
      iconWrapper: "bg-blue-100 text-blue-600",
      count: "text-slate-900",
      labelColor: "text-blue-700",
    },

    cancelled: {
      label: "Cancelled",
      description: "Booking cancelled",
      icon: XCircle,
      wrapper: "border-red-200 bg-red-50/40",
      iconWrapper: "bg-red-100 text-red-600",
      count: "text-slate-900",
      labelColor: "text-red-700",
    },
  };

  const item = config[type];
  const Icon = item.icon;

  return (
    <div
      className={`
        rounded-2xl
        border
        ${item.wrapper}
        px-4
        py-4
        sm:px-5
        sm:py-5
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`
              text-[11px]
              font-bold
              uppercase
              tracking-wide
              ${item.labelColor}
            `}
          >
            {item.label}
          </p>

          <p
            className={`
              mt-1
              text-2xl
              font-bold
              leading-none
              ${item.count}
            `}
          >
            {count}
          </p>

          <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
            {item.description}
          </p>
        </div>

        <div
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${item.iconWrapper}
          `}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BOOKING CARD
========================================================= */

function BookingCard({
  booking,
  history = false,
}: {
  booking: Booking;
  history?: boolean;
}) {
  const status = normalizeStatus(booking.status);

  const statusConfig = {
    pending: {
      text: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-100",
      icon: Hourglass,
    },

    confirmed: {
      text: "Confirmed",
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: CheckCircle2,
    },

    completed: {
      text: "Completed",
      className: "bg-blue-50 text-blue-700 border-blue-100",
      icon: CheckCircle2,
    },

    cancelled: {
      text: "Cancelled",
      className: "bg-red-50 text-red-700 border-red-100",
      icon: XCircle,
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] ??
    statusConfig.pending;

  const StatusIcon = config.icon;

  return (
    <article
      className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/* =================================================
          BOOKING HEADER
      ================================================= */}

      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
              {booking.businesses?.name || "Alessandro Enterprises"}
            </p>

            <h3 className="mt-1 truncate text-base font-bold text-[#03162F] sm:text-lg">
              {booking.enterprise_catalog?.name || "Appointment"}
            </h3>
          </div>

          <span
            className={`
              inline-flex
              shrink-0
              items-center
              gap-1.5
              rounded-full
              border
              px-2.5
              py-1.5
              text-[11px]
              font-bold
              ${config.className}
            `}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {config.text}
          </span>
        </div>
      </div>

      {/* =================================================
          DETAILS
      ================================================= */}

      <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {/* DATE */}

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
              <CalendarDays className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-400">
                Date
              </p>

              <p className="truncate text-xs font-semibold text-[#03162F]">
                {formatDate(booking.booking_date)}
              </p>
            </div>
          </div>

          {/* TIME */}

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
              <Clock className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-400">
                Time
              </p>

              <p className="truncate text-xs font-semibold text-[#03162F]">
                {formatTime(booking.booking_time)}
              </p>
            </div>
          </div>

          {/* BRANCH */}

          {booking.branches?.name && (
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
                <MapPin className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-400">
                  Branch
                </p>

                <p className="truncate text-xs font-semibold text-[#03162F]">
                  {booking.branches.name}
                </p>
              </div>
            </div>
          )}

          {/* STAFF */}

          {booking.employees?.full_name && (
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
                <UserRound className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-400">
                  Staff
                </p>

                <p className="truncate text-xs font-semibold text-[#03162F]">
                  {booking.employees.full_name}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================
          PAYMENT
      ================================================= */}

      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#03162F]">
              <CreditCard className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[10px] font-medium text-slate-400">
                Payment
              </p>

              <p className="text-xs font-semibold capitalize text-[#03162F]">
                {booking.payment_status || "Pending"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-slate-400" />

            <p className="text-sm font-bold text-[#03162F]">
              {formatMoney(booking.amount)}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          NOTES
      ================================================= */}

      {booking.notes && (
        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Notes
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            {booking.notes}
          </p>
        </div>
      )}

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex gap-2.5">
          {/* VIEW DETAILS */}

          <a
            href={`/customer/bookings/${booking.id}`}
            className="
              flex
              flex-1
              items-center
              justify-center
              rounded-xl
              border
              border-[#03162F]
              px-3
              py-2.5
              text-xs
              font-bold
              text-[#03162F]
              transition
              hover:bg-[#03162F]
              hover:text-white
            "
          >
            View Details
          </a>

          {/* CANCEL BOOKING */}

          {!history &&
            status !== "cancelled" &&
            status !== "completed" && (
              <CancelBookingButton bookingId={booking.id} />
            )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyBookings({
  history,
}: {
  history?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#03162F]">
        <CalendarDays className="h-6 w-6" />
      </div>

      <h3 className="mt-3 text-base font-bold text-[#03162F]">
        {history
          ? "No booking history yet"
          : "No upcoming bookings"}
      </h3>

      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">
        {history
          ? "Your completed, cancelled or past appointments will appear here."
          : "Your pending and confirmed appointments will appear here."}
      </p>

      {history && (
        <Link
          href="/customer/services"
          className="
            mt-4
            inline-flex
            items-center
            justify-center
            rounded-xl
            bg-slate-100
            px-5
            py-2.5
            text-xs
            font-bold
            text-[#03162F]
            transition
            hover:bg-slate-200
          "
        >
          Browse Services
        </Link>
      )}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default async function CustomerBookingsPage() {
  const supabase = await createClient();

  /* =======================================================
     AUTH
  ======================================================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24">


        <section className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#03162F] text-white">
              <CalendarDays className="h-5 w-5" />
            </div>

            <h1 className="mt-4 text-lg font-bold text-[#03162F]">
              Please sign in
            </h1>

            <p className="mt-1.5 text-xs text-slate-500">
              You need to sign in to view your bookings.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     FIND CUSTOMER
  ======================================================= */

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

  /* =======================================================
     NO CUSTOMER
  ======================================================= */

  if (!customer) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24">


        <section className="bg-[#03162F] px-4 pb-8 pt-6 text-white">
          <div className="mx-auto max-w-4xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Customer
            </p>

            <h1 className="mt-1.5 text-2xl font-bold">
              My Bookings
            </h1>

            <p className="mt-1.5 text-xs text-slate-300">
              View and manage your appointments with
              Alessandro Enterprises.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#03162F]">
              <CalendarDays className="h-6 w-6" />
            </div>

            <h2 className="mt-3 text-base font-bold text-[#03162F]">
              No customer profile found
            </h2>

            <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">
              We could not find a customer account connected
              to your profile yet.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     BOOKINGS
  ======================================================= */

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

  const bookings =
    (data ?? []) as unknown as Booking[];

  /* =======================================================
     STATUS COUNTS
  ======================================================= */

  const pendingBookings = bookings.filter(
    (booking) =>
      normalizeStatus(booking.status) === "pending"
  );

  const confirmedBookings = bookings.filter(
    (booking) =>
      normalizeStatus(booking.status) === "confirmed"
  );

  const completedBookings = bookings.filter(
    (booking) =>
      normalizeStatus(booking.status) === "completed"
  );

  const cancelledBookings = bookings.filter(
    (booking) =>
      normalizeStatus(booking.status) === "cancelled"
  );

  /* =======================================================
     UPCOMING
  ======================================================= */

  const upcomingBookings = bookings.filter(
    (booking) => {
      const status = normalizeStatus(
        booking.status
      );

      return (
        status === "pending" ||
        status === "confirmed"
      );
    }
  );

  /* =======================================================
     HISTORY
  ======================================================= */

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const historyBookings = bookings.filter(
    (booking) => {
      const status = normalizeStatus(
        booking.status
      );

      const bookingDate = new Date(
        `${booking.booking_date}T00:00:00`
      );

      return (
        status === "completed" ||
        status === "cancelled" ||
        bookingDate < today
      );
    }
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-50 pb-24">


      {/* =================================================
          HEADER
      ================================================= */}

      <section className="bg-[#03162F] px-4 pb-7 pt-6 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Customer
              </p>

              <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">
                My Bookings
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm">
                View and manage your appointments with
                Alessandro Enterprises.
              </p>
            </div>

            {/* NEW BOOKING BUTTON */}

            <Link
              href="/customer/bookings/new"
              className="
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#D4AF37]
                px-4
                py-3
                text-sm
                font-bold
                text-[#03162F]
                shadow-md
                transition
                hover:bg-[#e5c34a]
                sm:w-auto
              "
            >
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <section className="mx-auto max-w-5xl px-4 py-6 sm:py-8">

        {/* =================================================
            BOOKING STATUS
        ================================================= */}

        <div>
          <h2 className="text-xl font-bold text-[#03162F] sm:text-2xl">
            Booking Status
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Track the status of your appointments.
          </p>
        </div>

        {/* =================================================
            STATUS CARDS
        ================================================= */}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatusCard
            type="pending"
            count={pendingBookings.length}
          />

          <StatusCard
            type="confirmed"
            count={confirmedBookings.length}
          />

          <StatusCard
            type="completed"
            count={completedBookings.length}
          />

          <StatusCard
            type="cancelled"
            count={cancelledBookings.length}
          />
        </div>

        {/* =================================================
            UPCOMING / HISTORY NAVIGATION
        ================================================= */}

        <BookingSectionNavigation upcomingCount={upcomingBookings.length} historyCount={historyBookings.length} />

        {/* =================================================
            UPCOMING BOOKINGS
        ================================================= */}

        <section
          id="upcoming"
          className="scroll-mt-6 pt-7"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#03162F] sm:text-2xl">
              Upcoming Bookings
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Your pending and confirmed appointments.
            </p>
          </div>

          {upcomingBookings.length === 0 ? (
            <EmptyBookings />
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map(
                (booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* =================================================
            BOOKING HISTORY
        ================================================= */}

        <section
          id="history"
          className="scroll-mt-6 pt-8"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#03162F] sm:text-2xl">
              Booking History
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Your completed, cancelled and past appointments.
            </p>
          </div>

          {historyBookings.length === 0 ? (
            <EmptyBookings history />
          ) : (
            <div className="space-y-4">
              {historyBookings.map(
                (booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    history
                  />
                )
              )}
            </div>
          )}
        </section>

      </section>
    </main>
  );
}
