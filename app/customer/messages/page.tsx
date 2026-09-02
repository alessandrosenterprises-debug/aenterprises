"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronRight,
  Inbox,
  Loader2,
  MessageCircle,
  Plus,
  Reply,
  Send,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import CustomerNavigation from "@/components/customer/CustomerNavigation";

type MessageStatus =
  | "Unread"
  | "Read"
  | "Replied"
  | "Archived";

type Message = {
  id: string;
  business_id: string | null;
  customer_id: string | null;
  assigned_to: string | null;
  parent_message_id: string | null;

  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;

  subject: string | null;
  body: string;

  source: string;
  status: MessageStatus;
  priority: "Low" | "Normal" | "High" | "Urgent";

  created_at: string;
  read_at: string | null;
  replied_at: string | null;
  archived_at: string | null;
  updated_at: string;

  businesses?: {
    id: string;
    name: string;
  } | null;
};

type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  is_active: boolean | null;
  status: string | null;
};

type Folder = "inbox" | "sent" | "archived";

function formatDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  const now = new Date();

  const sameDay =
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate();

  if (sameDay) {
    return value.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return value.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year:
      value.getFullYear() === now.getFullYear()
        ? undefined
        : "numeric",
  });
}

function formatFullDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleString([], {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMessageRoot(
  message: Message,
  messages: Message[]
): string {
  let current = message;
  const visited = new Set<string>();

  while (
    current.parent_message_id &&
    !visited.has(current.id)
  ) {
    visited.add(current.id);

    const parent = messages.find(
      (item) => item.id === current.parent_message_id
    );

    if (!parent) {
      break;
    }

    current = parent;
  }

  return current.id;
}

export default function CustomerMessagesPage() {
  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [activeFolder, setActiveFolder] =
    useState<Folder>("inbox");

  const [selectedMessageId, setSelectedMessageId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [loadingConversation, setLoadingConversation] =
    useState(false);

  const [error, setError] = useState<string | null>(null);

  const [replyText, setReplyText] = useState("");

  const [sendingReply, setSendingReply] = useState(false);

  const [showMobileList, setShowMobileList] =
    useState(true);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(
          "Please sign in to view your messages."
        );
        return;
      }

      const {
        data: customerData,
        error: customerError,
      } = await supabase
        .from("customers")
        .select(
          `
            id,
            full_name,
            email,
            phone,
            is_active,
            status
          `
        )
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (customerError) {
        throw customerError;
      }

      if (!customerData) {
        setError(
          "Your customer profile could not be found."
        );
        return;
      }

      setCustomer(customerData as Customer);

      const {
        data: messageData,
        error: messageError,
      } = await supabase
        .from("messages")
        .select(
          `
            id,
            business_id,
            customer_id,
            assigned_to,
            parent_message_id,
            sender_name,
            sender_email,
            sender_phone,
            subject,
            body,
            source,
            status,
            priority,
            created_at,
            read_at,
            replied_at,
            archived_at,
            updated_at,
            businesses (
              id,
              name
            )
          `
        )
        .eq("customer_id", customerData.id)
        .order("created_at", {
          ascending: false,
        });

      if (messageError) {
        throw messageError;
      }

      setMessages(
        (messageData ?? []) as unknown as Message[]
      );
    } catch (err) {
      console.error(
        "Customer messages error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your messages."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  /*
   * IMPORTANT:
   *
   * Lock the document itself while this page is open.
   * The message areas have their own scrolling containers.
   *
   * This prevents Android Chrome from moving the entire
   * page upward when the keyboard opens.
   */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll =
      body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior =
        previousBodyOverscroll;
    };
  }, []);

  const inboxMessages = useMemo(() => {
    return messages.filter(
      (message) =>
        message.source !== "Customer Portal" &&
        message.status !== "Archived"
    );
  }, [messages]);

  const sentMessages = useMemo(() => {
    return messages.filter(
      (message) =>
        message.source === "Customer Portal" &&
        message.status !== "Archived"
    );
  }, [messages]);

  const archivedMessages = useMemo(() => {
    return messages.filter(
      (message) => message.status === "Archived"
    );
  }, [messages]);

  const folderMessages = useMemo(() => {
    if (activeFolder === "sent") {
      return sentMessages;
    }

    if (activeFolder === "archived") {
      return archivedMessages;
    }

    return inboxMessages;
  }, [
    activeFolder,
    inboxMessages,
    sentMessages,
    archivedMessages,
  ]);

  const unreadCount = useMemo(() => {
    return inboxMessages.filter(
      (message) => message.status === "Unread"
    ).length;
  }, [inboxMessages]);

  const selectedMessage = useMemo(() => {
    if (!selectedMessageId) {
      return null;
    }

    return (
      messages.find(
        (message) => message.id === selectedMessageId
      ) ?? null
    );
  }, [messages, selectedMessageId]);

  const conversationMessages = useMemo(() => {
    if (!selectedMessage) {
      return [];
    }

    const rootId = getMessageRoot(
      selectedMessage,
      messages
    );

    return messages
      .filter(
        (message) =>
          getMessageRoot(message, messages) === rootId
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );
  }, [messages, selectedMessage]);

  const selectMessage = async (
    message: Message
  ) => {
    setSelectedMessageId(message.id);
    setShowMobileList(false);
    setLoadingConversation(true);
    setReplyText("");

    try {
      if (
        message.source !== "Customer Portal" &&
        message.status === "Unread"
      ) {
        const readTime =
          new Date().toISOString();

        const { error: updateError } =
          await supabase
            .from("messages")
            .update({
              status: "Read",
              read_at: readTime,
            })
            .eq("id", message.id)
            .eq(
              "customer_id",
              customer?.id ?? ""
            );

        if (updateError) {
          console.error(
            "Mark customer message read error:",
            updateError
          );
        }

        setMessages((current) =>
          current.map((item) =>
            item.id === message.id
              ? {
                  ...item,
                  status: "Read",
                  read_at: readTime,
                }
              : item
          )
        );
      }
    } finally {
      setLoadingConversation(false);
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !customer) {
      return;
    }

    const body = replyText.trim();

    if (!body) {
      return;
    }

    try {
      setSendingReply(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      const subject =
        selectedMessage.subject
          ? `Re: ${selectedMessage.subject.replace(
              /^Re:\s*/i,
              ""
            )}`
          : "Reply";

      const {
        data,
        error: insertError,
      } = await supabase
        .from("messages")
        .insert({
          business_id:
            selectedMessage.business_id,
          customer_id: customer.id,
          parent_message_id:
            selectedMessage.id,

          sender_name:
            customer.full_name ||
            user.user_metadata?.full_name ||
            user.email ||
            "Customer",

          sender_email:
            customer.email ||
            user.email ||
            null,

          sender_phone:
            customer.phone || null,

          subject,
          body,

          source: "Customer Portal",
          status: "Unread",
          priority: selectedMessage.priority,
          assigned_to: null,
        })
        .select(
          `
            id,
            business_id,
            customer_id,
            assigned_to,
            parent_message_id,
            sender_name,
            sender_email,
            sender_phone,
            subject,
            body,
            source,
            status,
            priority,
            created_at,
            read_at,
            replied_at,
            archived_at,
            updated_at,
            businesses (
              id,
              name
            )
          `
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      setMessages((current) => [
        data as unknown as Message,
        ...current,
      ]);

      setReplyText("");
    } catch (err) {
      console.error(
        "Customer reply error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to send your reply."
      );
    } finally {
      setSendingReply(false);
    }
  };

  const archiveMessage = async (
    message: Message
  ) => {
    if (!customer) {
      return;
    }

    try {
      const archivedTime =
        new Date().toISOString();

      const { error: archiveError } =
        await supabase
          .from("messages")
          .update({
            status: "Archived",
            archived_at: archivedTime,
          })
          .eq("id", message.id)
          .eq("customer_id", customer.id);

      if (archiveError) {
        throw archiveError;
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                status: "Archived",
                archived_at: archivedTime,
              }
            : item
        )
      );

      setSelectedMessageId(null);
      setShowMobileList(true);
    } catch (err) {
      console.error(
        "Archive customer message error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to archive this message."
      );
    }
  };

  const changeFolder = (folder: Folder) => {
    setActiveFolder(folder);
    setSelectedMessageId(null);
    setShowMobileList(true);
    setReplyText("");
  };

  const folderTitle =
    activeFolder === "inbox"
      ? "Inbox"
      : activeFolder === "sent"
        ? "Sent"
        : "Archived";

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#061329] text-white">
      <CustomerNavigation />

      {/*
       * MOBILE:
       * The page itself never scrolls.
       * Only the designated content areas scroll.
       *
       * DESKTOP:
       * The fixed shell becomes a normal centered application
       * area while preserving the existing desktop layout.
       */}
      <main className="absolute inset-x-0 bottom-0 top-0 overflow-hidden px-3 pb-[92px] pt-[74px] sm:relative sm:inset-auto sm:mx-auto sm:min-h-screen sm:max-w-[1200px] sm:overflow-visible sm:px-5 sm:pb-28 sm:pt-3 lg:px-6">
        {/* Messages header */}
        <section className="relative z-40 shrink-0 rounded-2xl border border-[#d9b65d]/10 bg-gradient-to-br from-[#0d2347] via-[#0a1b38] to-[#07142b] p-3 shadow-xl shadow-black/20 backdrop-blur-xl sm:mb-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#d9b65d] sm:text-[10px]">
                Customer Area
              </p>

              <h1 className="text-lg font-black tracking-tight sm:text-2xl">
                Messages
              </h1>

              <p className="mt-0.5 text-[10px] text-white/50 sm:mt-1 sm:text-sm">
                Stay connected with Alessandro Enterprises.
              </p>
            </div>

            <a
              href="/customer/messages/new"
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d9b65d] to-[#f2d58b] px-3 py-2 text-[10px] font-black text-[#07142b] shadow-lg shadow-[#d9b65d]/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">
                New Message
              </span>
              <span className="sm:hidden">
                New
              </span>
            </a>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="relative z-50 mb-3 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100 sm:p-4">
            <X
              className="mt-0.5 shrink-0"
              size={17}
            />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1 text-xs text-red-100/70">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-lg p-1 transition hover:bg-white/10"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Mailbox */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#081a35] shadow-2xl sm:min-h-[620px]">
          {/* Folder tabs */}
          <div className="relative z-30 shrink-0 border-b border-white/10 bg-[#091d3a] p-2">
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() =>
                  changeFolder("inbox")
                }
                className={`relative flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-bold transition duration-300 sm:gap-2 sm:px-3 sm:text-xs ${
                  activeFolder === "inbox"
                    ? "bg-white/10 text-[#f2d58b] shadow-inner"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Inbox size={15} />

                Inbox

                {unreadCount > 0 && (
                  <span className="flex min-w-5 items-center justify-center rounded-full bg-[#d9b65d] px-1.5 py-0.5 text-[9px] font-black text-[#07142b]">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  changeFolder("sent")
                }
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-bold transition duration-300 sm:gap-2 sm:px-3 sm:text-xs ${
                  activeFolder === "sent"
                    ? "bg-white/10 text-[#f2d58b] shadow-inner"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Send size={15} />
                Sent
              </button>

              <button
                type="button"
                onClick={() =>
                  changeFolder("archived")
                }
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-bold transition duration-300 sm:gap-2 sm:px-3 sm:text-xs ${
                  activeFolder === "archived"
                    ? "bg-white/10 text-[#f2d58b] shadow-inner"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Archive size={15} />
                Archived
              </button>
            </div>
          </div>

          {/* Main mailbox content */}
          <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[360px_minmax(0,1fr)]">
            {/* Message list */}
            <div
              className={`min-h-0 overflow-hidden border-white/10 lg:block lg:border-r ${
                showMobileList
                  ? "flex flex-col"
                  : "hidden lg:flex lg:flex-col"
              }`}
            >
              {/* List heading */}
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <h2 className="text-sm font-black">
                    {folderTitle}
                  </h2>

                  <p className="mt-0.5 text-[10px] text-white/40">
                    {folderMessages.length}{" "}
                    {folderMessages.length === 1
                      ? "message"
                      : "messages"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadMessages}
                  disabled={loading}
                  className="rounded-lg p-2 text-white/45 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                  title="Refresh"
                >
                  <Loader2
                    size={15}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>
              </div>

              {/* List scrolls independently */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {loading ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-white/50">
                      <Loader2
                        size={27}
                        className="animate-spin text-[#d9b65d]"
                      />

                      <span className="text-xs">
                        Loading messages...
                      </span>
                    </div>
                  </div>
                ) : folderMessages.length ===
                  0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                      {activeFolder ===
                      "inbox" ? (
                        <Inbox
                          size={25}
                          className="text-[#d9b65d]"
                        />
                      ) : activeFolder ===
                        "sent" ? (
                        <Send
                          size={25}
                          className="text-[#d9b65d]"
                        />
                      ) : (
                        <Archive
                          size={25}
                          className="text-[#d9b65d]"
                        />
                      )}
                    </div>

                    <h3 className="text-sm font-black">
                      Nothing here yet
                    </h3>

                    <p className="mt-1 max-w-[250px] text-xs leading-5 text-white/40">
                      {activeFolder ===
                      "inbox"
                        ? "Messages and replies from Alessandro Enterprises will appear here."
                        : activeFolder ===
                            "sent"
                          ? "Messages you send will appear here."
                          : "Messages you archive will appear here."}
                    </p>

                    {activeFolder ===
                      "inbox" && (
                      <a
                        href="/customer/messages/new"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-[#f2d58b] transition hover:bg-white/15"
                      >
                        <Plus size={15} />
                        Send a Message
                      </a>
                    )}
                  </div>
                ) : (
                  <div>
                    {folderMessages.map(
                      (message) => {
                        const selected =
                          selectedMessageId ===
                          message.id;

                        const isUnread =
                          message.status ===
                            "Unread" &&
                          message.source !==
                            "Customer Portal";

                        const isCustomer =
                          message.source ===
                          "Customer Portal";

                        return (
                          <button
                            key={message.id}
                            type="button"
                            onClick={() =>
                              selectMessage(
                                message
                              )
                            }
                            className={`group flex w-full gap-3 border-b border-white/[0.06] p-4 text-left transition duration-200 ${
                              selected
                                ? "bg-[#d9b65d]/10"
                                : "hover:bg-white/[0.035]"
                            }`}
                          >
                            <div
                              className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                isCustomer
                                  ? "bg-[#173b70] text-[#8eb8f5]"
                                  : "bg-[#d9b65d]/10 text-[#f2d58b]"
                              }`}
                            >
                              {isCustomer ? (
                                <User size={17} />
                              ) : (
                                <ShieldCheck
                                  size={17}
                                />
                              )}

                              {isUnread && (
                                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#081a35] bg-[#d9b65d]" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={`truncate text-xs ${
                                    isUnread
                                      ? "font-black text-white"
                                      : "font-semibold text-white/75"
                                  }`}
                                >
                                  {isCustomer
                                    ? "You"
                                    : message.sender_name ||
                                      "Alessandro Enterprises"}
                                </p>

                                <span className="shrink-0 text-[10px] text-white/35">
                                  {formatDate(
                                    message.created_at
                                  )}
                                </span>
                              </div>

                              <p
                                className={`mt-1 truncate text-xs ${
                                  isUnread
                                    ? "font-bold text-white/90"
                                    : "text-white/55"
                                }`}
                              >
                                {message.subject ||
                                  "No subject"}
                              </p>

                              <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-white/35">
                                {message.body}
                              </p>
                            </div>

                            <ChevronRight
                              size={15}
                              className="mt-3 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/50"
                            />
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Conversation */}
            <div
              className={`min-h-0 overflow-hidden ${
                showMobileList
                  ? "hidden lg:flex lg:flex-col"
                  : "flex flex-col"
              }`}
            >
              {!selectedMessage ? (
                <div className="flex min-h-[420px] flex-1 flex-col items-center justify-center px-6 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d9b65d]/15 to-[#d9b65d]/5 shadow-lg">
                    <MessageCircle
                      size={28}
                      className="text-[#d9b65d]"
                    />
                  </div>

                  <h2 className="text-lg font-black">
                    Your Conversations
                  </h2>

                  <p className="mt-2 max-w-[340px] text-xs leading-5 text-white/40">
                    Select a message to read the
                    conversation and reply to
                    Alessandro Enterprises.
                  </p>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  {/* Conversation header */}
                  <div className="relative z-30 flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#091d3a] px-3 py-2.5 shadow-lg shadow-black/10 sm:px-5 sm:py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileList(true);
                        setSelectedMessageId(null);
                        setReplyText("");
                      }}
                      className="rounded-lg p-2 text-white/50 transition hover:bg-white/5 hover:text-white lg:hidden"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">
                        {selectedMessage.subject ||
                          "Conversation"}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] text-white/40">
                        {selectedMessage
                          .businesses?.name ||
                          "Alessandro Enterprises"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        archiveMessage(
                          selectedMessage
                        )
                      }
                      className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-[#f2d58b]"
                      title="Archive"
                    >
                      <Archive size={17} />
                    </button>
                  </div>

                  {/* Conversation scroll area */}
                  <div
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6"
                    style={{
                      WebkitOverflowScrolling:
                        "touch",
                    }}
                  >
                    <div className="space-y-5">
                      {loadingConversation ? (
                        <div className="flex justify-center py-10">
                          <Loader2
                            size={22}
                            className="animate-spin text-[#d9b65d]"
                          />
                        </div>
                      ) : (
                        conversationMessages.map(
                          (message) => {
                            const isCustomer =
                              message.source ===
                              "Customer Portal";

                            return (
                              <div
                                key={message.id}
                                className={`flex ${
                                  isCustomer
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div className="max-w-[88%] sm:max-w-[75%]">
                                  <div
                                    className={`mb-1 flex items-center gap-2 px-1 ${
                                      isCustomer
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                                  >
                                    <span className="text-[9px] font-bold text-white/45">
                                      {isCustomer
                                        ? "You"
                                        : message.sender_name ||
                                          "Alessandro Enterprises"}
                                    </span>

                                    <span className="text-[8px] text-white/25">
                                      {formatFullDate(
                                        message.created_at
                                      )}
                                    </span>
                                  </div>

                                  <div
                                    className={`rounded-2xl px-4 py-3 shadow-lg ${
                                      isCustomer
                                        ? "rounded-br-md bg-gradient-to-br from-[#d9b65d] to-[#b99542] text-[#07142b]"
                                        : "rounded-bl-md border border-white/10 bg-[#10294d] text-white"
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap text-xs leading-5 sm:text-sm">
                                      {message.body}
                                    </p>
                                  </div>

                                  {isCustomer && (
                                    <div className="mt-1 flex justify-end px-1">
                                      <span className="flex items-center gap-1 text-[9px] text-white/30">
                                        <Check size={10} />

                                        {message.status ===
                                        "Replied"
                                          ? "Replied"
                                          : "Sent"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )
                      )}
                    </div>
                  </div>

                  {/* Reply composer */}
                  {activeFolder !==
                    "archived" && (
                    <div className="relative z-30 shrink-0 border-t border-white/10 bg-[#091d3a] p-2.5 shadow-[0_-12px_30px_rgba(0,0,0,0.25)] sm:p-4">
                      <div className="rounded-2xl border border-white/10 bg-[#07172f] p-2 shadow-inner">
                        <textarea
                          value={replyText}
                          onChange={(event) =>
                            setReplyText(
                              event.target.value
                            )
                          }
                          placeholder="Write your reply..."
                          rows={3}
                          onFocus={() => {
                            /*
                             * Android Chrome can try to scroll
                             * the document when the keyboard opens.
                             *
                             * The document is locked above, and
                             * this extra reset makes sure we stay
                             * at the top of the application shell.
                             */
                            requestAnimationFrame(
                              () => {
                                window.scrollTo(
                                  0,
                                  0
                                );
                              }
                            );
                          }}
                          className="block w-full resize-none border-0 bg-transparent px-2 py-1.5 text-xs leading-5 text-white outline-none placeholder:text-white/25 sm:text-sm"
                        />

                        <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-2 pt-2">
                          <span className="text-[9px] text-white/25 sm:text-[10px]">
                            Your reply will be sent
                            to AEOS.
                          </span>

                          <button
                            type="button"
                            onClick={sendReply}
                            disabled={
                              sendingReply ||
                              !replyText.trim()
                            }
                            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d9b65d] to-[#f2d58b] px-3 py-2 text-[10px] font-black text-[#07142b] transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs"
                          >
                            {sendingReply ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Reply size={14} />
                            )}

                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Privacy information */}
        <div className="hidden items-center justify-center gap-2 text-[10px] text-white/25 sm:mt-4 sm:flex">
          <ShieldCheck size={13} />

          <span>
            Your conversations are private and linked
            to your customer account.
          </span>
        </div>
      </main>
    </div>
  );
}