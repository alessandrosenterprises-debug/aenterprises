import CustomerNavigation from "@/components/customer/CustomerNavigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import {
  getCustomerActivity,
  type CustomerActivityItem,
} from "@/modules/customers/services/activity.service";

export const dynamic = "force-dynamic";

function formatDateTime(date: string) {
  if (!date) {
    return "Date not available";
  }

  return new Date(date).toLocaleString("en-ZM", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(amount: number | null) {
  if (amount === null || Number.isNaN(Number(amount))) {
    return null;
  }

  return `ZMW ${Number(amount).toFixed(2)}`;
}

function normalizeStatus(status: string | null) {
  if (!status) {
    return null;
  }

  return status
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getActivityConfig(
  type: CustomerActivityItem["type"]
) {
  if (type === "booking") {
    return {
      label: "Booking",
      icon: CalendarDays,
      iconClass:
        "bg-blue-500/15 text-blue-600 ring-blue-500/20",
      dotClass: "bg-blue-500",
      lineClass: "from-blue-500/70 via-cyan-400/50 to-transparent",
      glowClass: "shadow-blue-500/20",
      accentClass: "from-blue-500 to-cyan-400",
    };
  }

  return {
    label: "Loan",
    icon: CircleDollarSign,
    iconClass:
      "bg-emerald-500/15 text-emerald-600 ring-emerald-500/20",
    dotClass: "bg-emerald-500",
    lineClass:
      "from-emerald-500/70 via-teal-400/50 to-transparent",
    glowClass: "shadow-emerald-500/20",
    accentClass: "from-emerald-500 to-teal-400",
  };
}

function getStatusClasses(status: string | null) {
  if (!status) {
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }

  const normalized = status.toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("completed") ||
    normalized.includes("confirmed") ||
    normalized.includes("cleared")
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (
    normalized.includes("rejected") ||
    normalized.includes("cancelled")
  ) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  if (
    normalized.includes("review") ||
    normalized.includes("pending") ||
    normalized.includes("active")
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export default async function CustomerActivityPage() {
  const activity = await getCustomerActivity();

  const bookingCount = activity.filter(
    (item) => item.type === "booking"
  ).length;

  const loanCount = activity.filter(
    (item) => item.type === "loan"
  ).length;

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50">
      <CustomerNavigation />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {/* Ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden"
        >
          <div className="absolute -left-24 top-10 h-72 w-72 animate-[pulse_7s_ease-in-out_infinite] rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute -right-24 top-24 h-80 w-80 animate-[pulse_9s_ease-in-out_infinite] rounded-full bg-purple-400/15 blur-3xl" />
          <div className="absolute left-1/2 top-48 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
        </div>

        {/* Hero */}
        <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-[#03162F] p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.38),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(168,85,247,0.32),transparent_32%),radial-gradient(circle_at_60%_100%,rgba(20,184,166,0.22),transparent_30%)]"
          />

          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 h-64 w-64 animate-[spin_20s_linear_infinite] rounded-full border border-white/10"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-32 -left-20 h-72 w-72 animate-[spin_25s_linear_infinite_reverse] rounded-full border border-cyan-300/10"
          />

          <div className="relative">
            <div className="mb-5 flex items-center gap-2 text-blue-200">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
              </div>

              <span className="text-sm font-semibold tracking-wide">
                AEOS Customer Activity
              </span>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Your Activity
                <span className="mt-1 block bg-gradient-to-r from-blue-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                  History
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Everything you do across Alessandro Enterprises,
                organized in one simple timeline. Track bookings,
                loan applications, and more as your AEOS journey
                grows.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-7 grid max-w-xl grid-cols-2 gap-3">
              <div className="group rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    Bookings
                  </span>

                  <CalendarDays className="h-4 w-4 text-blue-300 transition-transform duration-300 group-hover:scale-110" />
                </div>

                <p className="mt-2 text-2xl font-bold text-white">
                  {bookingCount}
                </p>
              </div>

              <div className="group rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    Loan Applications
                  </span>

                  <CircleDollarSign className="h-4 w-4 text-emerald-300 transition-transform duration-300 group-hover:scale-110" />
                </div>

                <p className="mt-2 text-2xl font-bold text-white">
                  {loanCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Activity */}
        {activity.length === 0 ? (
          <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-12">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.10),transparent_45%)]"
            />

            <div className="relative mx-auto max-w-lg">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-cyan-500/15 shadow-inner">
                <Clock3 className="h-9 w-9 text-[#03162F]" />
              </div>

              <h2 className="mt-6 text-2xl font-bold text-[#03162F]">
                Your timeline is waiting
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Once you make a booking or submit a loan application,
                your activity will automatically appear here.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href="/customer/bookings"
                  className="group inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#03162F]/20 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  View Bookings
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            {/* Section header */}
            <div className="relative overflow-hidden border-b border-slate-100 px-5 py-6 sm:px-8">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />

                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Live Timeline
                    </span>
                  </div>

                  <h2 className="mt-2 text-2xl font-bold text-[#03162F]">
                    Recent Activity
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your latest activity across Alessandro
                    Enterprises.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {activity.length} recent{" "}
                  {activity.length === 1
                    ? "activity"
                    : "activities"}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="px-5 py-7 sm:px-8 sm:py-9">
              <div className="relative">
                {/* Timeline line */}
                <div
                  aria-hidden="true"
                  className="absolute bottom-8 left-[1.35rem] top-8 w-px bg-gradient-to-b from-blue-500/60 via-purple-400/40 to-transparent sm:left-[1.55rem]"
                />

                <div className="space-y-7">
                  {activity.map((item, index) => {
                    const config = getActivityConfig(item.type);
                    const Icon = config.icon;
                    const status = normalizeStatus(item.status);
                    const amount = formatMoney(item.amount);

                    return (
                      <article
                        key={`${item.type}-${item.id}`}
                        className="group relative flex gap-4 sm:gap-5"
                        style={{
                          animationDelay: `${index * 70}ms`,
                        }}
                      >
                        {/* Timeline icon */}
                        <div className="relative z-10 shrink-0">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ${config.iconClass} shadow-lg ${config.glowClass} transition duration-300 group-hover:scale-110 group-hover:rotate-1 sm:h-12 sm:w-12`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>

                        {/* Activity card */}
                        <div className="min-w-0 flex-1">
                          <div
                            className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl ${config.glowClass} sm:p-5`}
                          >
                            {/* Animated accent */}
                            <div
                              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.accentClass} opacity-70 transition-all duration-300 group-hover:h-1.5`}
                            />

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-bold text-[#03162F] sm:text-lg">
                                    {item.title}
                                  </h3>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${config.iconClass}`}
                                  >
                                    {config.label}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm font-medium text-slate-600">
                                  {item.description}
                                </p>
                              </div>

                              {status && (
                                <span
                                  className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getStatusClasses(
                                    item.status
                                  )}`}
                                >
                                  {status}
                                </span>
                              )}
                            </div>

                            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {formatDateTime(item.created_at)}
                                </span>

                                {amount && (
                                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                                    <FileText className="h-3.5 w-3.5" />
                                    {amount}
                                  </span>
                                )}
                              </div>

                              {item.href && (
                                <Link
                                  href={item.href}
                                  className="group/link inline-flex w-fit items-center gap-1.5 font-semibold text-[#03162F] transition-colors hover:text-blue-600"
                                >
                                  View details
                                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer hint */}
        {activity.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />
            Your activity is updated automatically from AEOS records.
          </div>
        )}
      </main>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
