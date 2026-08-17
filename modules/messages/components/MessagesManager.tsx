"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  Check,
  ChevronDown,
  Eye,
  Mail,
  MessageCircle,
  RefreshCw,
  Reply,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type {
  Message,
  MessagePriority,
  MessageStatus,
} from "@/modules/messages/services/message.service";

import {
  archiveMessage,
  markMessageAsRead,
  updateMessage,
  createMessage,
} from "@/modules/messages/services/message.client";

interface MessagesManagerProps {
  messages: Message[];
}

type FilterStatus = "All" | MessageStatus;

const statusStyles: Record<MessageStatus, string> = {
  Unread: "bg-blue-100 text-blue-700",
  Read: "bg-slate-100 text-slate-600",
  Replied: "bg-green-100 text-green-700",
  Archived: "bg-slate-200 text-slate-600",
};

const priorityStyles: Record<MessagePriority, string> = {
  Low: "bg-slate-100 text-slate-600",
  Normal: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

export default function MessagesManager({
  messages: initialMessages,
}: MessagesManagerProps) {
  const router = useRouter();

  const [messages, setMessages] = useState(initialMessages);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("All");

  const [selectedMessage, setSelectedMessage] =
    useState<Message | null>(null);

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return messages.filter((message) => {
      const matchesStatus =
        statusFilter === "All" ||
        message.status === statusFilter;

      if (!matchesStatus) return false;

      if (!query) return true;

      return [
        message.sender_name,
        message.sender_email,
        message.sender_phone,
        message.subject,
        message.body,
        message.source,
        message.businesses?.[0]?.name,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [messages, search, statusFilter]);

  const stats = {
    total: messages.length,
    unread: messages.filter(
      (message) => message.status === "Unread"
    ).length,
    replied: messages.filter(
      (message) => message.status === "Replied"
    ).length,
    urgent: messages.filter(
      (message) => message.priority === "Urgent"
    ).length,
  };

  async function handleRead(message: Message) {
    if (message.status !== "Unread") {
      setSelectedMessage(message);
      return;
    }

    try {
      const updated = await markMessageAsRead(message.id);

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                ...updated,
                status: "Read",
                read_at:
                  updated.read_at ??
                  new Date().toISOString(),
              }
            : item
        )
      );

      setSelectedMessage({
        ...message,
        status: "Read",
        read_at: new Date().toISOString(),
      });

      toast.success("Message marked as read.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to mark message as read."
      );
    }
  }

  async function handleArchive(message: Message) {
    if (saving) return;

    setSaving(true);

    try {
      await archiveMessage(message.id);

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                status: "Archived",
                archived_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      if (selectedMessage?.id === message.id) {
        setSelectedMessage(null);
      }

      toast.success("Message archived.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to archive message."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePriorityChange(
    message: Message,
    priority: MessagePriority
  ) {
    try {
      await updateMessage(message.id, {
        priority,
      });

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? { ...item, priority }
            : item
        )
      );

      setSelectedMessage((current) =>
        current?.id === message.id
          ? { ...current, priority }
          : current
      );

      toast.success("Priority updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update priority."
      );
    }
  }

  async function handleReply() {
    if (!selectedMessage || !replyText.trim()) {
      toast.error("Enter a reply first.");
      return;
    }

    setSaving(true);

    try {
      await createMessage({
        business_id:
          selectedMessage.business_id,
        customer_id:
          selectedMessage.customer_id,
        parent_message_id:
          selectedMessage.id,

        sender_name: "Alessandro Enterprises",
        subject: selectedMessage.subject
          ? `Re: ${selectedMessage.subject}`
          : "Reply",

        body: replyText.trim(),

        source: "Dashboard",
        status: "Replied",
        priority: selectedMessage.priority,

        sender_email: null,
        sender_phone: null,
      });

      await updateMessage(
        selectedMessage.id,
        {
          status: "Replied",
        }
      );

      setMessages((current) =>
        current.map((item) =>
          item.id === selectedMessage.id
            ? {
                ...item,
                status: "Replied",
                replied_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      setSelectedMessage((current) =>
        current
          ? {
              ...current,
              status: "Replied",
              replied_at:
                new Date().toISOString(),
            }
          : current
      );

      setReplyText("");
      setReplyOpen(false);

      toast.success("Reply recorded successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to send reply."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleRefresh() {
    router.refresh();
    toast.success("Messages refreshed.");
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-ZM", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {/* STATISTICS */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total Messages"
          value={stats.total}
          icon={<Mail className="h-5 w-5" />}
        />

        <Stat
          label="Unread"
          value={stats.unread}
          icon={<MessageCircle className="h-5 w-5" />}
        />

        <Stat
          label="Replied"
          value={stats.replied}
          icon={<Reply className="h-5 w-5" />}
        />

        <Stat
          label="Urgent"
          value={stats.urgent}
          icon={<MessageCircle className="h-5 w-5" />}
        />
      </div>

      {/* TOOLBAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search messages..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as FilterStatus
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#03162F]"
            >
              <option value="All">
                All Statuses
              </option>
              <option value="Unread">
                Unread
              </option>
              <option value="Read">
                Read
              </option>
              <option value="Replied">
                Replied
              </option>
              <option value="Archived">
                Archived
              </option>
            </select>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* MESSAGE LIST */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-[#03162F]">
            Messages
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {filteredMessages.length} message
            {filteredMessages.length === 1
              ? ""
              : "s"} found
          </p>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Mail className="mx-auto h-12 w-12 text-slate-300" />

            <h3 className="mt-4 text-lg font-bold text-[#03162F]">
              No messages found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Incoming customer messages will appear
              here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`p-5 transition hover:bg-slate-50 ${
                  message.status === "Unread"
                    ? "bg-blue-50/30"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  {/* SENDER */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {message.status === "Unread" && (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                      )}

                      <h3 className="font-bold text-[#03162F]">
                        {message.sender_name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[message.status]}`}
                      >
                        {message.status}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[message.priority]}`}
                      >
                        {message.priority}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {message.sender_email ??
                        message.sender_phone ??
                        "No contact information"}
                    </p>

                    <p className="mt-3 font-semibold text-[#03162F]">
                      {message.subject ??
                        "No subject"}
                    </p>

                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {message.body}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>
                        {formatDate(
                          message.created_at
                        )}
                      </span>

                      <span>
                        Source: {message.source}
                      </span>

                      {message.businesses?.[0]
                        ?.name && (
                        <span>
                          {
                            message.businesses[0]
                              .name
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-wrap gap-2 xl:max-w-[420px] xl:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        void handleRead(message)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>

                    {message.status === "Unread" && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleRead(message)
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-[#03162F] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0A2852]"
                      >
                        <Check className="h-4 w-4" />
                        Read
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMessage(message);
                        setReplyOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-3 py-2 text-sm font-semibold text-[#03162F] transition hover:brightness-95"
                    >
                      <Reply className="h-4 w-4" />
                      Reply
                    </button>

                    {message.status !== "Archived" && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleArchive(message)
                        }
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULL MESSAGE MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03162F]/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#03162F]">
                  Message Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(
                    selectedMessage.created_at
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedMessage(null);
                  setReplyOpen(false);
                }}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 rounded-xl bg-slate-50 p-5 md:grid-cols-2">
                <Info
                  label="Sender"
                  value={selectedMessage.sender_name}
                />

                <Info
                  label="Email"
                  value={
                    selectedMessage.sender_email ??
                    "Not provided"
                  }
                />

                <Info
                  label="Phone"
                  value={
                    selectedMessage.sender_phone ??
                    "Not provided"
                  }
                />

                <Info
                  label="Source"
                  value={selectedMessage.source}
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Subject
                </p>

                <h3 className="mt-1 text-xl font-bold text-[#03162F]">
                  {selectedMessage.subject ??
                    "No subject"}
                </h3>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Message
                </p>

                <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700">
                  {selectedMessage.body}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
                <span className="text-sm font-semibold text-slate-700">
                  Priority
                </span>

                <div className="relative">
                  <select
                    value={selectedMessage.priority}
                    onChange={(event) =>
                      void handlePriorityChange(
                        selectedMessage,
                        event.target
                          .value as MessagePriority
                      )
                    }
                    className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-700"
                  >
                    <option value="Low">
                      Low
                    </option>
                    <option value="Normal">
                      Normal
                    </option>
                    <option value="High">
                      High
                    </option>
                    <option value="Urgent">
                      Urgent
                    </option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[selectedMessage.status]}`}
                >
                  {selectedMessage.status}
                </span>
              </div>

              {!replyOpen ? (
                <div className="flex flex-wrap justify-end gap-3">
                  {selectedMessage.status ===
                    "Unread" && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleRead(
                          selectedMessage
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white"
                    >
                      <Check className="h-4 w-4" />
                      Mark as Read
                    </button>
                  )}

                  {selectedMessage.status !==
                    "Archived" && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleArchive(
                          selectedMessage
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setReplyOpen(true)
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 font-semibold text-[#03162F]"
                  >
                    <Reply className="h-4 w-4" />
                    Reply
                  </button>
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div>
                    <h3 className="font-bold text-[#03162F]">
                      Reply to Message
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Your response will be recorded
                      against this conversation.
                    </p>
                  </div>

                  <textarea
                    value={replyText}
                    onChange={(event) =>
                      setReplyText(
                        event.target.value
                      )
                    }
                    rows={6}
                    placeholder="Write your reply..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10"
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setReplyOpen(false)
                      }
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleReply()
                      }
                      disabled={
                        saving ||
                        !replyText.trim()
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Reply className="h-4 w-4" />

                      {saving
                        ? "Sending..."
                        : "Send Reply"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#03162F]">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-[#03162F] p-3 text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-[#03162F]">
        {value}
      </p>
    </div>
  );
}