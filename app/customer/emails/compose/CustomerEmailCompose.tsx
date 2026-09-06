"use client";

import {
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type ReplyEmail = {
  id: string;
  sender_name: string;
  sender_email: string;
  recipient_email: string | null;
  subject: string | null;
  body: string;
  source: string;
};

interface Props {
  customerId: string;
  replyEmail: ReplyEmail | null;
}

export default function CustomerEmailCompose({
  customerId,
  replyEmail,
}: Props) {
  const router = useRouter();

  const isReply = Boolean(replyEmail);

  const [to, setTo] = useState(
    replyEmail
      ? replyEmail.source === "Outgoing"
        ? replyEmail.recipient_email ?? ""
        : replyEmail.sender_email
      : "alessandrosenterprises@gmail.com"
  );

  const [subject, setSubject] = useState(
    isReply
      ? replyEmail?.subject?.startsWith("Re:")
        ? replyEmail.subject
        : `Re: ${replyEmail?.subject || "(No subject)"}`
      : ""
  );

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!to.trim()) {
      setError("Recipient email is required.");
      return;
    }

    if (!body.trim()) {
      setError("Please enter a message.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: isReply ? "reply" : "compose",
          customerId,
          parentEmailId: replyEmail?.id ?? null,
          to: to.trim(),
          subject:
            subject.trim() ||
            "Message from Alessandro Enterprises",
          body: body.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to send email."
        );
      }

      router.push("/customer/emails");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send email."
      );
      setSending(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-[#03162F] via-[#082957] to-[#0C3B78] p-6 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37]">
            <Mail className="h-5 w-5" />
          </span>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">
              AEOS Mail
            </p>

            <h1 className="mt-1 text-xl font-bold">
              {isReply ? "Reply to Email" : "Compose Email"}
            </h1>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 p-5 sm:p-6"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#03162F]">
            To
          </label>

          <input
            type="email"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            disabled={isReply}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-70"
            placeholder="Recipient email"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#03162F]">
            Subject
          </label>

          <input
            type="text"
            value={subject}
            onChange={(event) =>
              setSubject(event.target.value)
            }
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            placeholder="Email subject"
          />
        </div>

        {replyEmail && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Replying to
            </p>

            <p className="mt-1 text-sm font-semibold text-[#03162F]">
              {replyEmail.sender_name}
            </p>

            <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-slate-500">
              {replyEmail.body}
            </p>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#03162F]">
            Message
          </label>

          <textarea
            value={body}
            onChange={(event) =>
              setBody(event.target.value)
            }
            rows={10}
            className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            placeholder="Write your message..."
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              router.push(
                replyEmail
                  ? `/customer/emails/${replyEmail.id}`
                  : "/customer/emails"
              )
            }
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03162F] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#082957] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {isReply ? "Send Reply" : "Send Email"}
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}