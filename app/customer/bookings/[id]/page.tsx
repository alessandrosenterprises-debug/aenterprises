import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
  CheckCircle2,
  XCircle,
  Hourglass,
  CreditCard,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import CustomerNavigation from "@/components/customer/CustomerNavigation";

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
    weekday: "long",
    day: "numeric",
    month: "long",
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
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Confirmed
      </span>
    );
  }

  if (normalized === "completed") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
        <CheckCircle2 className="h-4 w-4" />
        Completed
      </span>
    );
  }

  if (normalized === "cancelled") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
        <XCircle className="h-4 w-4" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
      <Hourglass className="h-4 w-4" />
      Pending
    </span>
  );
}

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
            <h1 className="text-xl font-bold text-[#03162F]">
              Please sign in
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              You need to sign in to view this booking.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /*
   * Find the customer linked to the authenticated account.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  let customerId: string | null = null;

  if (profile?.email) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", profile.email)
      .maybeSingle();

    customerId = customer?.id ?? null;
  }

  if (!customerId && user.email) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    customerId = customer?.id ?? null;
  }

  if (!customerId && profile?.phone) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", profile.phone)
      .maybeSingle();

    customerId = customer?.id ?? null;
  }

  if (!customerId) {
    notFound();
  }

  /*
   * IMPORTANT:
   * Only retrieve the booking if it belongs to this customer.
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
    .eq("id", id)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const booking = data as unknown as Booking;

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <CustomerNavigation />

      <section className="bg-[#03162F] px-5 pb-10 pt-7 text-white">
        <div className="mx-auto max-w-4xl">

          <Link
            href="/customer/bookings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Link>

          <div className="mt-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Booking Details
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  {booking.enterprise_catalog?.name || "Appointment"}
                </h1>

                <p className="mt-2 text-sm text-slate-300">
                  {booking.businesses?.name || "Alessandro Enterprises"}
                </p>
              </div>

              <StatusBadge status={booking.status} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-8">

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-bold text-[#03162F]">
              Appointment Information
            </h2>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2">

            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Date
                </p>

                <p className="mt-1 text-sm font-bold text-[#03162F]">
                  {formatDate(booking.booking_date)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
                <Clock className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Time
                </p>

                <p className="mt-1 text-sm font-bold text-[#03162F]">
                  {formatTime(booking.booking_time)}
                </p>
              </div>
            </div>

            {booking.branches?.name && (
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Branch
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#03162F]">
                    {booking.branches.name}
                  </p>
                </div>
              </div>
            )}

            {booking.employees?.full_name && (
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
                  <UserRound className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Staff Member
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#03162F]">
                    {booking.employees.full_name}
                  </p>
                </div>
              </div>
            )}

          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-6">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-[#03162F]" />

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Payment
                  </p>

                  <p className="text-sm font-bold text-[#03162F]">
                    {booking.payment_status || "Pending"}
                  </p>
                </div>
              </div>

              <p className="text-lg font-bold text-[#03162F]">
                {formatMoney(booking.amount)}
              </p>
            </div>

          </div>

          {booking.notes && (
            <div className="border-t border-slate-100 p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Notes
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {booking.notes}
              </p>
            </div>
          )}

        </div>

        <div className="mt-6">
          <Link
            href="/customer/bookings"
            className="flex w-full items-center justify-center rounded-xl bg-[#03162F] px-5 py-3 font-bold text-white transition hover:bg-[#08244b]"
          >
            Back to My Bookings
          </Link>
        </div>

      </section>
    </main>
  );
}