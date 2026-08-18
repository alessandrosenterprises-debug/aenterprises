"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Archive,
  Check,
  ChevronDown,
  Mail,
  MailOpen,
  Plus,
  Reply,
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

interface EmailStats {
  total: number;
  unread: number;
  read: number;
  replied: number;
  archived: number;
}

interface EmailManagerProps {
  initialEmails: EmailRecord[];
  stats: EmailStats;
}

type Filter = "All" | EmailStatus;

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-ZM", {
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

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function EmailManager({
  initialEmails,
  stats,
}: EmailManagerProps) {
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

  const [replyOpen, setReplyOpen] =
    useState(false);

  const [loadingId, setLoadingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [to, setTo] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [body, setBody] =
    useState("");

  const [cc, setCc] =
    useState("");

  const [bcc, setBcc] =
    useState("");

  /*
   * ---------------------------------------------------------
   * EMAIL THREAD
   * ---------------------------------------------------------
   */

  function getThreadEmails(
    email: EmailRecord
  ): EmailRecord[] {
    const thread =
      new Map<string, EmailRecord>();

    thread.set(email.id, email);

    /*
     * Find all parents.
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

      thread.set(parent.id, parent);

      current = parent;
    }

    /*
     * Find all replies.
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
          thread.set(item.id, item);
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
        search.trim().toLowerCase();

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
            email.subject
              ?.toLowerCase()
              .includes(query) ||
            email.body
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
   * ---------------------------------------------------------
   * COMPOSER
   * ---------------------------------------------------------
   */

  function resetComposer() {
    setTo("");
    setSubject("");
    setBody("");
    setCc("");
    setBcc("");
    setError("");
    setSuccess("");
  }

  function openCompose() {
    resetComposer();

    setSelectedEmail(null);
    setReplyOpen(false);
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
    setReplyOpen(false);
    setError("");
    setSuccess("");

    if (email.status === "Unread") {
      void handleRead(email);
    }
  }

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

      const updated =
        await markEmailAsRead(
          email.id
        );

      setEmails((current) =>
        current.map((item) =>
          item.id === email.id
            ? {
                ...item,
                status: "Read",
                read_at:
                  updated.read_at,
              }
            : item
        )
      );

      setSelectedEmail((current) =>
        current?.id === email.id
          ? {
              ...current,
              status: "Read",
              read_at:
                updated.read_at,
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

      const updated =
        await archiveEmail(
          email.id
        );

      setEmails((current) =>
        current.map((item) =>
          item.id === email.id
            ? {
                ...item,
                status: "Archived",
                archived_at:
                  updated.archived_at,
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

      await deleteEmail(email.id);

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
   * ---------------------------------------------------------
   * PREPARE REPLY
   * ---------------------------------------------------------
   */

  function prepareReply(
    email: EmailRecord
  ) {
    setTo(email.sender_email);

    setSubject(
      email.subject
        ? email.subject.startsWith(
            "Re:"
          )
          ? email.subject
          : `Re: ${email.subject}`
        : "Re: Message"
    );

    setBody("");
    setCc("");
    setBcc("");

    setError("");
    setSuccess("");

    setReplyOpen(true);
  }

  /*
   * ---------------------------------------------------------
   * SEND EMAIL / REPLY
   * ---------------------------------------------------------
   */

  async function handleSend(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!to.trim()) {
      setError(
        "Recipient email is required."
      );
      return;
    }

    if (!body.trim()) {
      setError(
        "Email message cannot be empty."
      );
      return;
    }

    try {
      setLoadingId(
        selectedEmail?.id ??
          "compose"
      );

      setError("");
      setSuccess("");

      const result =
        await sendEmail({
          to: to.trim(),

          cc:
            cc.trim() ||
            undefined,

          bcc:
            bcc.trim() ||
            undefined,

          subject:
            subject.trim() ||
            "Message from Alessandro Enterprises",

          body: body.trim(),

          businessId:
            selectedEmail?.business_id ??
            null,

          customerId:
            selectedEmail?.customer_id ??
            null,

          assignedTo:
            selectedEmail?.assigned_to ??
            null,

          parentEmailId:
            replyOpen
              ? selectedEmail?.id ??
                null
              : null,
        });

      /*
       * Add the newly sent email
       * immediately to the UI.
       */
      if (result.email) {
        setEmails((current) => [
          result.email as EmailRecord,
          ...current,
        ]);
      }

      /*
       * Update the original email
       * when this was a reply.
       */
      if (selectedEmail) {
        const repliedAt =
          new Date().toISOString();

        setEmails((current) =>
          current.map((item) =>
            item.id ===
            selectedEmail.id
              ? {
                  ...item,
                  status:
                    "Replied",
                  replied_at:
                    repliedAt,
                }
              : item
          )
        );

        setSelectedEmail(
          (current) =>
            current
              ? {
                  ...current,
                  status:
                    "Replied",
                  replied_at:
                    repliedAt,
                }
              : current
        );
      }

      setSuccess(
        replyOpen
          ? "Reply sent successfully."
          : "Email sent successfully."
      );

      resetComposer();

      setComposeOpen(false);
      setReplyOpen(false);
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
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <>
      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: Mail,
          },
          {
            label: "Unread",
            value: stats.unread,
            icon: Mail,
          },
          {
            label: "Read",
            value: stats.read,
            icon: MailOpen,
          },
          {
            label: "Replied",
            value: stats.replied,
            icon: Reply,
          },
          {
            label: "Archived",
            value: stats.archived,
            icon: Archive,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#03162F]">
                    {item.value}
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
              onClick={openCompose}
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
              "Archived",
            ].map((item) => (
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
            ))}
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

        {filteredEmails.length === 0 ? (
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
                    openEmail(email)
                  }
                  className={`flex w-full items-start gap-4 px-5 py-5 text-left transition hover:bg-slate-50 ${
                    email.status ===
                    "Unread"
                      ? "bg-blue-50/30"
                      : ""
                  }`}
                >
                  <div className="mt-1 rounded-xl bg-[#03162F] p-3 text-white">
                    <Mail className="h-5 w-5" />
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
                          {email.sender_name}
                        </p>

                        <span className="hidden text-xs text-slate-400 sm:inline">
                          &lt;
                          {
                            email.sender_email
                          }
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
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          Sent
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03162F]/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                      selectedEmail.status
                    )}`}
                  >
                    {selectedEmail.status}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClass(
                      selectedEmail.priority
                    )}`}
                  >
                    {selectedEmail.priority}
                  </span>

                  {selectedThread.length >
                    1 && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {selectedThread.length}{" "}
                      messages
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-2xl font-bold text-[#03162F]">
                  {selectedEmail.subject ||
                    "(No subject)"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEmail(null)
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* THREAD CONTENT */}

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedThread.map(
                  (email, index) => {
                    const isOutgoing =
                      email.source ===
                      "Outgoing";

                    return (
                      <div
                        key={email.id}
                        className={`rounded-2xl border p-5 ${
                          isOutgoing
                            ? "border-blue-100 bg-blue-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-[#03162F]">
                                {isOutgoing
                                  ? "Alessandro Enterprises"
                                  : email.sender_name}
                              </p>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isOutgoing
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {isOutgoing
                                  ? "Sent"
                                  : "Received"}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-slate-500">
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
                          <p className="mt-4 font-semibold text-[#03162F]">
                            {email.subject}
                          </p>
                        )}

                        {email.cc && (
                          <p className="mt-2 text-xs text-slate-500">
                            <span className="font-semibold">
                              CC:
                            </span>{" "}
                            {email.cc}
                          </p>
                        )}

                        {email.bcc && (
                          <p className="mt-1 text-xs text-slate-500">
                            <span className="font-semibold">
                              BCC:
                            </span>{" "}
                            {email.bcc}
                          </p>
                        )}

                        <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {email.body}
                        </div>

                        {index <
                          selectedThread.length -
                            1 && (
                          <div className="mt-5 border-t border-slate-200 pt-3 text-xs font-medium text-slate-400">
                            Reply
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              {/* =================================================
                  REPLY FORM
              ================================================== */}

              {replyOpen && (
                <form
                  onSubmit={handleSend}
                  className="mt-6 space-y-4 rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[#03162F]">
                        Reply
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Reply to{" "}
                        {
                          selectedEmail.sender_email
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setReplyOpen(
                          false
                        )
                      }
                      className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                  </div>

                  <input
                    value={to}
                    onChange={(event) =>
                      setTo(
                        event.target.value
                      )
                    }
                    placeholder="Recipient"
                    type="email"
                    className={inputClass}
                    required
                  />

                  <input
                    value={cc}
                    onChange={(event) =>
                      setCc(
                        event.target.value
                      )
                    }
                    placeholder="CC (optional)"
                    className={inputClass}
                  />

                  <input
                    value={bcc}
                    onChange={(event) =>
                      setBcc(
                        event.target.value
                      )
                    }
                    placeholder="BCC (optional)"
                    className={inputClass}
                  />

                  <input
                    value={subject}
                    onChange={(event) =>
                      setSubject(
                        event.target.value
                      )
                    }
                    placeholder="Subject"
                    className={inputClass}
                  />

                  <textarea
                    value={body}
                    onChange={(event) =>
                      setBody(
                        event.target.value
                      )
                    }
                    placeholder="Write your reply..."
                    className={`${inputClass} min-h-[180px] resize-y`}
                    required
                  />

                  <button
                    type="submit"
                    disabled={
                      loadingId !== null
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white hover:bg-[#0A2852] disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />

                    {loadingId
                      ? "Sending..."
                      : "Send Reply"}
                  </button>
                </form>
              )}
            </div>

            {/* FOOTER ACTIONS */}

            {!replyOpen && (
              <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 p-5">
                <div className="flex flex-wrap gap-2">
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
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {selectedEmail.status ===
                    "Unread" ? (
                      <MailOpen className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}

                    {selectedEmail.status ===
                    "Unread"
                      ? "Mark Read"
                      : "Read"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      prepareReply(
                        selectedEmail
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0A2852]"
                  >
                    <Reply className="h-4 w-4" />
                    Reply
                  </button>

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
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                </div>

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
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          COMPOSE EMAIL
      ====================================================== */}

      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03162F]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-[#03162F]">
                  Compose Email
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Send an email from Alessandro
                  Enterprises.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setComposeOpen(
                    false
                  )
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSend}
              className="space-y-4 p-6"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <input
                value={to}
                onChange={(event) =>
                  setTo(
                    event.target.value
                  )
                }
                placeholder="To"
                type="email"
                className={inputClass}
                required
              />

              <input
                value={cc}
                onChange={(event) =>
                  setCc(
                    event.target.value
                  )
                }
                placeholder="CC (optional)"
                className={inputClass}
              />

              <input
                value={bcc}
                onChange={(event) =>
                  setBcc(
                    event.target.value
                  )
                }
                placeholder="BCC (optional)"
                className={inputClass}
              />

              <input
                value={subject}
                onChange={(event) =>
                  setSubject(
                    event.target.value
                  )
                }
                placeholder="Subject"
                className={inputClass}
              />

              <textarea
                value={body}
                onChange={(event) =>
                  setBody(
                    event.target.value
                  )
                }
                placeholder="Write your email..."
                className={`${inputClass} min-h-[220px] resize-y`}
                required
              />

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setComposeOpen(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    loadingId !== null
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-6 py-3 font-semibold text-white hover:bg-[#0A2852] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />

                  {loadingId
                    ? "Sending..."
                    : "Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}