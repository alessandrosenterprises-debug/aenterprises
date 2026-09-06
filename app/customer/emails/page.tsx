import CustomerNavigation from "@/components/customer/CustomerNavigation";
import {
  getCustomerEmailStats,
  getCustomerEmails,
} from "@/modules/emails/services/customer-email.service";
import {
  ArrowLeft,
  Inbox,
  Mail,
  MailOpen,
  PenLine,
  Send,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type EmailFilter = "all" | "unread" | "received" | "sent";

/*
 * ---------------------------------------------------------
 * DATE FORMAT
 * ---------------------------------------------------------
 */

function formatEmailDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/*
 * ---------------------------------------------------------
 * FILTER
 * ---------------------------------------------------------
 */

function getFilter(value?: string): EmailFilter {
  if (
    value === "unread" ||
    value === "received" ||
    value === "sent"
  ) {
    return value;
  }

  return "all";
}

/*
 * ---------------------------------------------------------
 * FILTER EMAILS
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 *
 * We use `email.direction`, which is calculated from the
 * authenticated customer's sender/recipient relationship.
 *
 * We do NOT use source/status to determine sent/received.
 */

function filterEmails(
  emails: Awaited<ReturnType<typeof getCustomerEmails>>,
  filter: EmailFilter
) {
  switch (filter) {
    case "unread":
      return emails.filter(
        (email) =>
          email.status === "Unread" &&
          email.direction === "received"
      );

    case "received":
      return emails.filter(
        (email) => email.direction === "received"
      );

    case "sent":
      return emails.filter(
        (email) => email.direction === "sent"
      );

    default:
      return emails;
  }
}

/*
 * ---------------------------------------------------------
 * PAGE
 * ---------------------------------------------------------
 */

export default async function CustomerEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
  }>;
}) {
  const params = await searchParams;

  const filter = getFilter(params.filter);

  const [emails, stats] = await Promise.all([
    getCustomerEmails(),
    getCustomerEmailStats(),
  ]);

  const visibleEmails = filterEmails(emails, filter);

  const filterLabels: Record<EmailFilter, string> = {
    all: "Inbox",
    unread: "Unread",
    received: "Received",
    sent: "Sent",
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <CustomerNavigation />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#03162F] via-[#082957] to-[#0C3B78] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37]">
                  <Mail className="h-5 w-5" />
                </span>

                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
                  AEOS Mail
                </span>
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                My Emails
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                View your communication with Alessandro Enterprises in one place.
              </p>
            </div>

            <Link
              href="/customer/emails/compose"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#03162F] shadow-lg transition hover:bg-[#E2C45F] active:scale-[0.98]"
            >
              <PenLine className="h-4 w-4" />
              Compose Email
            </Link>

          </div>
        </section>

        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}

        <section className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            {/* Inbox */}

            <Link
              href="/customer/emails"
              className={`group rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                filter === "all"
                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    filter === "all"
                      ? "bg-[#D4AF37]/20 text-[#A47D00]"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <Inbox className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Inbox
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#03162F]">
                    {stats.inbox}
                  </p>
                </div>
              </div>
            </Link>

            {/* Unread */}

            <Link
              href="/customer/emails?filter=unread"
              className={`group rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                filter === "unread"
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <MailOpen className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Unread
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#03162F]">
                    {stats.unread}
                  </p>
                </div>
              </div>
            </Link>

            {/* Received */}

            <Link
              href="/customer/emails?filter=received"
              className={`group rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                filter === "received"
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Mail className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Received
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#03162F]">
                    {stats.received}
                  </p>
                </div>
              </div>
            </Link>

            {/* Sent */}

            <Link
              href="/customer/emails?filter=sent"
              className={`group rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                filter === "sent"
                  ? "border-violet-300 bg-violet-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Send className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Sent
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#03162F]">
                    {stats.sent}
                  </p>
                </div>
              </div>
            </Link>

          </div>
        </section>

        {/* =====================================================
            EMAIL LIST
        ====================================================== */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

            <div>
              <div className="flex items-center gap-2">

                <Link
                  href="/customer/emails"
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#03162F]"
                  aria-label="Back to inbox"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>

                <h2 className="text-lg font-bold text-[#03162F]">
                  {filterLabels[filter]}
                </h2>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                {filter === "all"
                  ? "Your emails and communication with Alessandro Enterprises."
                  : `Showing your ${filterLabels[
                      filter
                    ].toLowerCase()} emails.`}
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {visibleEmails.length}{" "}
              {visibleEmails.length === 1
                ? "email"
                : "emails"}
            </div>

          </div>

          {/* ===================================================
              EMPTY STATE
          ==================================================== */}

          {visibleEmails.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">

              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Mail className="h-7 w-7" />
              </span>

              <h3 className="mt-5 text-lg font-bold text-[#03162F]">
                No emails found
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no emails in this section yet.
              </p>

              <Link
                href="/customer/emails/compose"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#082957]"
              >
                <PenLine className="h-4 w-4" />
                Compose Email
              </Link>

            </div>
          ) : (

            /* =================================================
               EMAILS
            ================================================== */

            <div className="divide-y divide-slate-100">

              {visibleEmails.map((email) => {

                const unread = email.status === "Unread";

                /*
                 * Customer-facing direction:
                 *
                 * AEOS -> customer:
                 * direction = received
                 *
                 * customer -> AEOS:
                 * direction = sent
                 */

                const sent = email.direction === "sent";
                const received = email.direction === "received";

                return (
                  <Link
                    key={email.id}
                    href={`/customer/emails/${email.id}`}
                    className={`block px-5 py-5 transition-colors hover:bg-slate-50 sm:px-6 ${
                      unread ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <article>

                      <div className="flex gap-4">

                        {/* Icon */}

                        <div
                          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            unread
                              ? "bg-blue-100 text-blue-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {unread ? (
                            <Mail className="h-5 w-5" />
                          ) : (
                            <MailOpen className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <h3
                                  className={`truncate text-sm ${
                                    unread
                                      ? "font-bold text-[#03162F]"
                                      : "font-semibold text-slate-700"
                                  }`}
                                >
                                  {email.subject || "(No subject)"}
                                </h3>

                                {unread && (
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                                    New
                                  </span>
                                )}

                              </div>

                              {/* SENDER / RECIPIENT */}

                              <p className="mt-1 text-xs text-slate-500">
                                {sent
                                  ? `To: ${
                                      email.recipient_email ||
                                      "Alessandro Enterprises"
                                    }`
                                  : `From: ${email.sender_email}`}
                              </p>

                            </div>

                            <time className="shrink-0 text-xs text-slate-400">
                              {formatEmailDate(email.created_at)}
                            </time>

                          </div>

                          {/* Body */}

                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                            {email.body}
                          </p>

                          {/* LABELS */}

                          <div className="mt-3 flex flex-wrap items-center gap-2">

                            {email.businesses?.name && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                {email.businesses.name}
                              </span>
                            )}

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                received
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-violet-50 text-violet-700"
                              }`}
                            >
                              {received ? "Received" : "Sent"}
                            </span>

                            {email.status === "Replied" && (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                Replied
                              </span>
                            )}

                          </div>

                        </div>
                      </div>

                    </article>
                  </Link>
                );
              })}

            </div>
          )}

        </section>
      </main>
    </div>
  );
}