
import CustomerNavigation from "@/components/customer/CustomerNavigation";
import {
  getCustomerEmailById,
  getCustomerEmails,
} from "@/modules/emails/services/customer-email.service";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  Mail,
  MailOpen,
  PenLine,
  Reply,
  Send,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function formatEmailDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleString("en-ZM", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CustomerEmailDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const email = await getCustomerEmailById(id);

  if (!email) {
    notFound();
  }

  /*
   * ---------------------------------------------------------
   * MARK EMAIL AS READ
   * ---------------------------------------------------------
   *
   * Only received unread emails are marked as read.
   *
   * Sent emails are never changed here.
   *
   * We use the authenticated Supabase server client and
   * restrict the update to this exact email ID AND customer ID.
   */
  if (
    email.direction === "received" &&
    email.status === "Unread"
  ) {
    const supabase = await createClient();

    const {
      error: markReadError,
    } = await supabase
      .from("emails")
      .update({
        status: "Read",
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", email.id)
      .eq("customer_id", email.customer_id);

    if (markReadError) {
      console.error(
        "Failed to mark customer email as read:",
        JSON.stringify(markReadError, null, 2)
      );
    }
  }

  /*
   * Load all customer emails so we can build the conversation
   * thread.
   */
  const allEmails = await getCustomerEmails();

  const thread = allEmails
    .filter(
      (item) =>
        item.id === email.id ||
        item.parent_email_id === email.id ||
        email.parent_email_id === item.id
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
    );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <CustomerNavigation />

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            href="/customer/emails"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#03162F] shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Emails
          </Link>

          <Link
            href={`/customer/emails/compose?replyTo=${email.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#03162F] shadow-sm transition hover:bg-[#E2C45F]"
          >
            <Reply className="h-4 w-4" />
            Reply
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-[#03162F] to-[#0C3B78] p-6 text-white">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#D4AF37]">
                {email.direction === "sent" ? (
                  <Send className="h-5 w-5" />
                ) : (
                  <MailOpen className="h-5 w-5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">
                  {email.direction === "sent"
                    ? "Sent Email"
                    : "Received Email"}
                </p>

                <h1 className="mt-2 text-xl font-bold sm:text-2xl">
                  {email.subject || "(No subject)"}
                </h1>

                <p className="mt-2 text-sm text-white/70">
                  {email.direction === "sent"
                    ? `To: ${email.recipient_email || ""}`
                    : `From: ${email.sender_email}`}
                </p>

                <p className="mt-1 text-xs text-white/50">
                  {formatEmailDate(email.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {thread.map((item) => {
              const outgoing = item.direction === "sent";

              return (
                <article
                  key={item.id}
                  className="p-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      {outgoing ? (
                        <Send className="h-4 w-4" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </span>

                    <div>
                      <p className="text-sm font-bold text-[#03162F]">
                        {outgoing
                          ? "Alessandro Enterprises"
                          : item.sender_name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {formatEmailDate(item.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {item.body}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-5">
            <Link
              href={`/customer/emails/compose?replyTo=${email.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#082957]"
            >
              <Reply className="h-4 w-4" />
              Reply to this email
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
