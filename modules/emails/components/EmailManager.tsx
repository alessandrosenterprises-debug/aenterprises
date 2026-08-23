"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Archive,
  Check,
  ChevronDown,
  Forward,
  Mail,
  MailOpen,
  Plus,
  Reply,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  archiveEmail,
  deleteEmail,
  markEmailAsRead,
  sendEmail,
} from "@/modules/emails/services/email.client";

import type {
  EmailRecord,
  EmailStatus,
} from "@/modules/emails/services/email.service";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

interface EmailStats {
  total: number;
  unread: number;
  read: number;
  replied: number;
  sent: number;
  archived: number;
}

interface EmailManagerProps {
  initialEmails: EmailRecord[];
  stats: EmailStats;
}

type Filter = "All" | EmailStatus;

type ComposerMode =
  | "compose"
  | "reply"
  | "forward"
  | "resend";

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: EmailStatus) {
  switch (status) {
    case "Unread":
      return "bg-blue-100 text-blue-700";

    case "Read":
      return "bg-slate-100 text-slate-700";

    case "Replied":
      return "bg-green-100 text-green-700";

    case "Sent":
      return "bg-indigo-100 text-indigo-700";

    case "Archived":
      return "bg-slate-200 text-slate-600";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function priorityClass(
  priority: EmailRecord["priority"]
) {
  switch (priority) {
    case "Urgent":
      return "bg-red-100 text-red-700";

    case "High":
      return "bg-orange-100 text-orange-700";

    case "Normal":
      return "bg-blue-100 text-blue-700";

    case "Low":
    default:
      return "bg-slate-100 text-slate-600";
  }
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function EmailManager({
  initialEmails,
  stats,
}: EmailManagerProps) {
  /*
   * ---------------------------------------------------------
   * STATE
   * ---------------------------------------------------------
   */

  const [emails, setEmails] =
    useState<EmailRecord[]>(initialEmails);

  const [filter, setFilter] =
    useState<Filter>("All");

  const [search, setSearch] =
    useState("");

  const [selectedEmail, setSelectedEmail] =
    useState<EmailRecord | null>(null);

  const [composeOpen, setComposeOpen] =
    useState(false);

  const [composerMode, setComposerMode] =
    useState<ComposerMode>("compose");

  const [loadingId, setLoadingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [to, setTo] =
    useState("");

  const [cc, setCc] =
    useState("");

  const [bcc, setBcc] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [body, setBody] =
    useState("");

  /*
   * ---------------------------------------------------------
   * LIVE STATISTICS
   * ---------------------------------------------------------
   */

  const liveStats = useMemo<EmailStats>(() => {
    return {
      total: emails.length,

      unread: emails.filter(
        (email) =>
          email.status === "Unread"
      ).length,

      read: emails.filter(
        (email) =>
          email.status === "Read"
      ).length,

      replied: emails.filter(
        (email) =>
          email.status === "Replied"
      ).length,

      sent: emails.filter(
        (email) =>
          email.status === "Sent" ||
          email.source === "Outgoing"
      ).length,

      archived: emails.filter(
        (email) =>
          email.status === "Archived"
      ).length,
    };
  }, [emails]);

  void stats;

  /*
   * ---------------------------------------------------------
   * PREVENT BACKGROUND SCROLL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const modalOpen =
      selectedEmail !== null ||
      composeOpen;

    if (!modalOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    selectedEmail,
    composeOpen,
  ]);

  /*
   * ---------------------------------------------------------
   * ESCAPE KEY
   * ---------------------------------------------------------
   */

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      if (composeOpen) {
        closeComposer();
        return;
      }

      if (selectedEmail) {
        closeEmail();
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    composeOpen,
    selectedEmail,
  ]);

  /*
   * ---------------------------------------------------------
   * THREAD BUILDER
   * ---------------------------------------------------------
   */

  function getThreadEmails(
    email: EmailRecord
  ): EmailRecord[] {
    const thread =
      new Map<string, EmailRecord>();

    thread.set(
      email.id,
      email
    );

    /*
     * Walk backwards through parents.
     */

    let current = email;

    while (current.parent_email_id) {
      const parent = emails.find(
        (item) =>
          item.id ===
          current.parent_email_id
      );

      if (!parent) {
        break;
      }

      if (
        thread.has(parent.id)
      ) {
        break;
      }

      thread.set(
        parent.id,
        parent
      );

      current = parent;
    }

    /*
     * Walk forward through children.
     */

    let changed = true;

    while (changed) {
      changed = false;

      for (const item of emails) {
        if (
          item.parent_email_id &&
          thread.has(
            item.parent_email_id
          ) &&
          !thread.has(item.id)
        ) {
          thread.set(
            item.id,
            item
          );

          changed = true;
        }
      }
    }

    return Array.from(
      thread.values()
    ).sort(
      (a, b) =>
        new Date(
          a.created_at
        ).getTime() -
        new Date(
          b.created_at
        ).getTime()
    );
  }

  /*
   * ---------------------------------------------------------
   * FILTERED EMAILS
   * ---------------------------------------------------------
   */

  const filteredEmails =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return emails.filter(
        (email) => {
          const matchesFilter =
            filter === "All" ||
            email.status === filter;

          if (!matchesFilter) {
            return false;
          }

          if (!query) {
            return true;
          }

          return (
            email.sender_name
              .toLowerCase()
              .includes(query) ||
            email.sender_email
              .toLowerCase()
              .includes(query) ||
            (
              email.subject ?? ""
            )
              .toLowerCase()
              .includes(query) ||
            email.body
              .toLowerCase()
              .includes(query) ||
            (
              email.recipient_email ??
              ""
            )
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [
      emails,
      filter,
      search,
    ]);

  /*
   * ---------------------------------------------------------
   * SELECTED THREAD
   * ---------------------------------------------------------
   */

  const selectedThread =
    useMemo(() => {
      if (!selectedEmail) {
        return [];
      }

      return getThreadEmails(
        selectedEmail
      );
    }, [
      selectedEmail,
      emails,
    ]);

  /*
   * =========================================================
   * COMPOSER HELPERS
   * =========================================================
   */

  function resetComposer() {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
    setError("");
  }

  function closeComposer() {
    setComposeOpen(false);
    setComposerMode("compose");
    resetComposer();
  }

  function closeEmail() {
    setSelectedEmail(null);
  }

  /*
   * ---------------------------------------------------------
   * COMPOSE
   * ---------------------------------------------------------
   */

  function openCompose() {
    resetComposer();

    setComposerMode(
      "compose"
    );

    setSelectedEmail(null);

    setComposeOpen(true);
  }

  /*
   * ---------------------------------------------------------
   * OPEN EMAIL
   * ---------------------------------------------------------
   */

  function openEmail(
    email: EmailRecord
  ) {
    setSelectedEmail(email);

    setComposeOpen(false);

    setError("");
    setSuccess("");

    if (
      email.status ===
      "Unread"
    ) {
      void handleRead(email);
    }
  }

  /*
   * =========================================================
   * EMAIL ACTIONS
   * =========================================================
   */

  /*
   * ---------------------------------------------------------
   * MARK READ
   * ---------------------------------------------------------
   */

  async function handleRead(
    email: EmailRecord
  ) {
    try {
      setLoadingId(email.id);
      setError("");

      const updated =
        await markEmailAsRead(
          email.id
        );

      const readAt =
        updated.read_at ??
        new Date().toISOString();

      setEmails((current) =>
        current.map((item) =>
          item.id === email.id
            ? {
                ...item,
                status: "Read",
                read_at:
                  readAt,
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      setSelectedEmail(
        (current) =>
          current?.id ===
          email.id
            ? {
                ...current,
                status: "Read",
                read_at:
                  readAt,
                updated_at:
                  new Date().toISOString(),
              }
            : current
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to mark email as read."
      );
    } finally {
      setLoadingId(null);
    }
  }

  /*
   * ---------------------------------------------------------
   * ARCHIVE
   * ---------------------------------------------------------
   */

  async function handleArchive(
    email: EmailRecord
  ) {
    try {
      setLoadingId(email.id);
      setError("");
      setSuccess("");

      const updated =
        await archiveEmail(
          email.id
        );

      const archivedAt =
        updated.archived_at ??
        new Date().toISOString();

      setEmails((current) =>
        current.map((item) =>
          item.id === email.id
            ? {
                ...item,
                status: "Archived",
                archived_at:
                  archivedAt,
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      setSelectedEmail(null);

      setSuccess(
        "Email archived successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to archive email."
      );
    } finally {
      setLoadingId(null);
    }
  }

  /*
   * ---------------------------------------------------------
   * DELETE
   * ---------------------------------------------------------
   */

  async function handleDelete(
    email: EmailRecord
  ) {
    const confirmed =
      window.confirm(
        "Delete this email permanently?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setLoadingId(email.id);
      setError("");
      setSuccess("");

      await deleteEmail(
        email.id
      );

      setEmails((current) =>
        current.filter(
          (item) =>
            item.id !== email.id
        )
      );

      setSelectedEmail(null);

      setSuccess(
        "Email deleted successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete email."
      );
    } finally {
      setLoadingId(null);
    }
  }

  /*
   * =========================================================
   * REPLY
   * =========================================================
   */

  function prepareReply(
    email: EmailRecord
  ) {
    const recipient =
      email.source === "Outgoing"
        ? email.recipient_email
        : email.sender_email;

    if (!recipient) {
      setError(
        "This email does not have a valid reply recipient."
      );

      return;
    }

    setComposerMode(
      "reply"
    );

    setTo(recipient);

    setSubject(
      email.subject
        ? email.subject
            .toLowerCase()
            .startsWith("re:")
          ? email.subject
          : `Re: ${email.subject}`
        : "Re: Message"
    );

    setBody("");
    setCc("");
    setBcc("");

    setError("");
    setSuccess("");

    /*
     * Close the thread before opening
     * the dedicated composer.
     */

    setSelectedEmail(null);

    setComposeOpen(true);
  }

  /*
   * =========================================================
   * FORWARD
   * =========================================================
   */

  function prepareForward(
    email: EmailRecord
  ) {
    setComposerMode(
      "forward"
    );

    setTo("");
    setCc("");
    setBcc("");

    setSubject(
      email.subject
        ? email.subject
            .toLowerCase()
            .startsWith("fwd:")
          ? email.subject
          : `Fwd: ${email.subject}`
        : "Fwd: Message"
    );

    const forwardedMessage = [
      "",
      "",
      "---------- Forwarded message ----------",
      `From: ${email.sender_name} <${email.sender_email}>`,
      `Date: ${formatDate(
        email.created_at
      )}`,
      `Subject: ${
        email.subject ||
        "(No subject)"
      }`,
      `To: ${
        email.recipient_email ||
        ""
      }`,
      "",
      email.body,
    ].join("\n");

    setBody(
      forwardedMessage
    );

    setError("");
    setSuccess("");

    setSelectedEmail(null);
    setComposeOpen(true);
  }

  /*
   * =========================================================
   * RESEND
   * =========================================================
   */

  function prepareResend(
    email: EmailRecord
  ) {
    if (
      !email.recipient_email
    ) {
      setError(
        "This sent email does not have a recipient."
      );

      return;
    }

    setComposerMode(
      "resend"
    );

    setTo(
      email.recipient_email
    );

    setCc(
      email.cc ?? ""
    );

    setBcc(
      email.bcc ?? ""
    );

    setSubject(
      email.subject ?? ""
    );

    setBody(
      email.body ?? ""
    );

    setError("");
    setSuccess("");

    setSelectedEmail(null);
    setComposeOpen(true);
  }

  /*
   * =========================================================
   * SEND
   * =========================================================
   */

  async function handleSend(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!to.trim()) {
      setError(
        "Please enter a recipient."
      );

      return;
    }

    if (!body.trim()) {
      setError(
        "Please enter a message."
      );

      return;
    }

    try {
      setLoadingId(
        "sending"
      );

      setError("");
      setSuccess("");

      await sendEmail({
        to: to.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        subject:
          subject.trim() ||
          "(No subject)",
        body: body.trim(),
      });

      setSuccess(
        composerMode ===
          "reply"
          ? "Reply sent successfully."
          : composerMode ===
            "forward"
          ? "Email forwarded successfully."
          : composerMode ===
            "resend"
          ? "Email resent successfully."
          : "Email sent successfully."
      );

      closeComposer();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send email."
      );
    } finally {
      setLoadingId(null);
    }
  }

  /*
   * =========================================================
   * STAT CARD DATA
   * =========================================================
   */

  const statCards = [
    {
      label: "Total Emails",
      value: liveStats.total,
      icon: Mail,
    },
    {
      label: "Unread",
      value: liveStats.unread,
      icon: MailOpen,
    },
    {
      label: "Read",
      value: liveStats.read,
      icon: Check,
    },
    {
      label: "Replied",
      value: liveStats.replied,
      icon: Reply,
    },
    {
      label: "Sent",
      value: liveStats.sent,
      icon: Send,
    },
    {
      label: "Archived",
      value: liveStats.archived,
      icon: Archive,
    },
  ];

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <>
      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
        {statCards.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <div
                key={
                  item.label
                }
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.label}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-[#03162F]">
                      {
                        item.value
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#03162F] p-3 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* =====================================================
          EMAIL LIST
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search emails..."
                className={`${inputClass} pl-10`}
              />
            </div>

            <button
              type="button"
              onClick={
                openCompose
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
            >
              <Plus className="h-5 w-5" />
              Compose Email
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              "All",
              "Unread",
              "Read",
              "Replied",
              "Sent",
              "Archived",
            ].map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setFilter(
                      item as Filter
                    )
                  }
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    filter === item
                      ? "bg-[#03162F] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mx-5 mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        {filteredEmails.length ===
        0 ? (
          <div className="py-16 text-center">
            <Mail className="mx-auto h-12 w-12 text-slate-300" />

            <h3 className="mt-4 text-lg font-bold text-[#03162F]">
              No emails found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Incoming and outgoing emails
              will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEmails.map(
              (email) => (
                <button
                  key={email.id}
                  type="button"
                  onClick={() =>
                    openEmail(
                      email
                    )
                  }
                  className={`flex w-full items-start gap-4 px-5 py-5 text-left transition hover:bg-slate-50 ${
                    email.status ===
                    "Unread"
                      ? "bg-blue-50/30"
                      : ""
                  }`}
                >
                  <div className="mt-1 rounded-xl bg-[#03162F] p-3 text-white">
                    {email.source ===
                    "Outgoing" ? (
                      <Send className="h-5 w-5" />
                    ) : (
                      <Mail className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <p
                          className={`truncate ${
                            email.status ===
                            "Unread"
                              ? "font-bold text-[#03162F]"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {email.source ===
                          "Outgoing"
                            ? "Alessandro Enterprises"
                            : email.sender_name}
                        </p>

                        <span className="hidden text-xs text-slate-400 sm:inline">
                          &lt;
                          {email.source ===
                          "Outgoing"
                            ? email.recipient_email
                            : email.sender_email}
                          &gt;
                        </span>
                      </div>

                      <span className="shrink-0 text-xs text-slate-400">
                        {formatDate(
                          email.created_at
                        )}
                      </span>
                    </div>

                    <p className="mt-1 font-semibold text-[#03162F]">
                      {email.subject ||
                        "(No subject)"}
                    </p>

                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {email.body}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          email.status
                        )}`}
                      >
                        {email.status}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClass(
                          email.priority
                        )}`}
                      >
                        {email.priority}
                      </span>

                      {email.source ===
                        "Outgoing" && (
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          Outgoing
                        </span>
                      )}

                      {email.parent_email_id && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Conversation
                        </span>
                      )}

                      {email.businesses
                        ?.name && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {
                            email
                              .businesses
                              .name
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronDown className="mt-2 hidden h-5 w-5 -rotate-90 text-slate-400 sm:block" />
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          EMAIL DETAIL / THREAD MODAL
      ====================================================== */}

      {selectedEmail && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#03162F]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Email details"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEmail();
            }
          }}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}

            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-white p-5 sm:p-6">
              <div className="min-w-0 pr-4">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                      selectedEmail.status
                    )}`}
                  >
                    {
                      selectedEmail.status
                    }
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClass(
                      selectedEmail.priority
                    )}`}
                  >
                    {
                      selectedEmail.priority
                    }
                  </span>

                  {selectedThread.length >
                    1 && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {
                        selectedThread.length
                      }{" "}
                      messages
                    </span>
                  )}
                </div>

                <h2 className="mt-3 break-words text-xl font-bold text-[#03162F] sm:text-2xl">
                  {selectedEmail.subject ||
                    "(No subject)"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeEmail
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-[#03162F]"
                aria-label="Close email"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4">
                {selectedThread.map(
                  (
                    email,
                    index
                  ) => {
                    const isOutgoing =
                      email.source ===
                      "Outgoing";

                    return (
                      <div
                        key={
                          email.id
                        }
                        className={`rounded-2xl border p-4 sm:p-5 ${
                          isOutgoing
                            ? "border-blue-100 bg-blue-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-[#03162F]">
                                {isOutgoing
                                  ? "Alessandro Enterprises"
                                  : email.sender_name}
                              </p>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isOutgoing
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {isOutgoing
                                  ? "Sent"
                                  : "Received"}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                  email.status
                                )}`}
                              >
                                {
                                  email.status
                                }
                              </span>
                            </div>

                            <p className="mt-1 break-words text-sm text-slate-500">
                              {isOutgoing
                                ? email.recipient_email
                                : email.sender_email}
                            </p>
                          </div>

                          <p className="shrink-0 text-xs text-slate-400">
                            {formatDate(
                              email.created_at
                            )}
                          </p>
                        </div>

                        {email.subject && (
                          <p className="mt-4 break-words font-semibold text-[#03162F]">
                            {
                              email.subject
                            }
                          </p>
                        )}

                        {email.cc && (
                          <p className="mt-2 break-words text-xs text-slate-500">
                            <span className="font-semibold">
                              CC:
                            </span>{" "}
                            {email.cc}
                          </p>
                        )}

                        {email.bcc && (
                          <p className="mt-1 break-words text-xs text-slate-500">
                            <span className="font-semibold">
                              BCC:
                            </span>{" "}
                            {email.bcc}
                          </p>
                        )}

                        <div className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                          {
                            email.body
                          }
                        </div>

                        {index <
                          selectedThread.length -
                            1 && (
                          <div className="mt-5 border-t border-slate-200 pt-3 text-xs font-medium text-slate-400">
                            Conversation
                            continues
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* FIXED FOOTER */}

            <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
              <div className="flex flex-wrap gap-2">
                {selectedEmail.status ===
                  "Unread" && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleRead(
                        selectedEmail
                      )
                    }
                    disabled={
                      loadingId ===
                      selectedEmail.id
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <MailOpen className="h-4 w-4" />
                    Mark Read
                  </button>
                )}

                {selectedEmail.status !==
                  "Unread" && (
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-default items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-400"
                  >
                    <Check className="h-4 w-4" />
                    Read
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    prepareReply(
                      selectedEmail
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A2852]"
                >
                  <Reply className="h-4 w-4" />
                  Reply
                </button>

                <button
                  type="button"
                  onClick={() =>
                    prepareForward(
                      selectedEmail
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Forward className="h-4 w-4" />
                  Forward
                </button>

                {selectedEmail.source ===
                  "Outgoing" && (
                  <button
                    type="button"
                    onClick={() =>
                      prepareResend(
                        selectedEmail
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Resend
                  </button>
                )}

                {selectedEmail.status !==
                  "Archived" && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleArchive(
                        selectedEmail
                      )
                    }
                    disabled={
                      loadingId ===
                      selectedEmail.id
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={
                    closeEmail
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(
                      selectedEmail
                    )
                  }
                  disabled={
                    loadingId ===
                    selectedEmail.id
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          COMPOSE / REPLY / FORWARD / RESEND MODAL
      ====================================================== */}

      {composeOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-[#03162F]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={
            composerMode ===
            "reply"
              ? "Reply"
              : composerMode ===
                "forward"
              ? "Forward email"
              : composerMode ===
                "resend"
              ? "Resend email"
              : "Compose email"
          }
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeComposer();
            }
          }}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* =================================================
                COMPOSER HEADER
            ================================================== */}

            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-white p-5 sm:p-6">
              <div className="min-w-0 pr-4">
                <h2 className="text-xl font-bold text-[#03162F] sm:text-2xl">
                  {composerMode ===
                  "reply"
                    ? "Reply"
                    : composerMode ===
                      "forward"
                    ? "Forward Email"
                    : composerMode ===
                      "resend"
                    ? "Resend Email"
                    : "Compose Email"}
                </h2>

                <p className="mt-1 break-words text-sm text-slate-500">
                  {composerMode ===
                  "reply"
                    ? `Reply to ${to}`
                    : composerMode ===
                      "forward"
                    ? "Forward this email to another recipient."
                    : composerMode ===
                      "resend"
                    ? "Resend this message to the original recipient."
                    : "Send an email from Alessandro Enterprises."}
                </p>
              </div>

              {/* CLOSE BUTTON */}

              <button
                type="button"
                onClick={
                  closeComposer
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-[#03162F]"
                aria-label="Close email dialog"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* =================================================
                SCROLLABLE FORM BODY
            ================================================== */}

            <form
  id="email-composer-form"
  data-email-composer="true"
  onSubmit={handleSend}
  className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6"
>
              <div className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* TO */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    To
                  </label>

                  <input
                    value={to}
                    onChange={(
                      event
                    ) =>
                      setTo(
                        event.target
                          .value
                      )
                    }
                    placeholder="recipient@example.com"
                    type="email"
                    className={
                      inputClass
                    }
                    required
                  />
                </div>

                {/* CC */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    CC
                  </label>

                  <input
                    value={cc}
                    onChange={(
                      event
                    ) =>
                      setCc(
                        event.target
                          .value
                      )
                    }
                    placeholder="CC (optional)"
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* BCC */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    BCC
                  </label>

                  <input
                    value={bcc}
                    onChange={(
                      event
                    ) =>
                      setBcc(
                        event.target
                          .value
                      )
                    }
                    placeholder="BCC (optional)"
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* SUBJECT */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Subject
                  </label>

                  <input
                    value={
                      subject
                    }
                    onChange={(
                      event
                    ) =>
                      setSubject(
                        event.target
                          .value
                      )
                    }
                    placeholder="Subject"
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* MESSAGE */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Message
                  </label>

                  <textarea
                    value={body}
                    onChange={(
                      event
                    ) =>
                      setBody(
                        event.target
                          .value
                      )
                    }
                    placeholder={
                      composerMode ===
                      "reply"
                        ? "Write your reply..."
                        : "Write your email..."
                    }
                    className={`${inputClass} min-h-[220px] resize-y`}
                    required
                  />
                </div>
              </div>
            </form>

            {/* =================================================
                FIXED COMPOSER FOOTER
            ================================================== */}

            <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <button
                type="button"
                onClick={
                  closeComposer
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Close
              </button>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={
                    closeComposer
                  }
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form=""
                  disabled={
                    loadingId !==
                    null
                  }
                  onClick={() => {
                    const form =
                      document.querySelector(
                        'form[data-email-composer="true"]'
                      ) as HTMLFormElement | null;

                    form?.requestSubmit();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-6 py-3 font-semibold text-white transition hover:bg-[#0A2852] disabled:opacity-50"
                >
                  {composerMode ===
                  "forward" ? (
                    <Forward className="h-4 w-4" />
                  ) : composerMode ===
                    "resend" ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : composerMode ===
                    "reply" ? (
                    <Reply className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}

                  {loadingId
                    ? "Sending..."
                    : composerMode ===
                      "forward"
                    ? "Forward Email"
                    : composerMode ===
                      "resend"
                    ? "Resend Email"
                    : composerMode ===
                      "reply"
                    ? "Send Reply"
                    : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}