"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  MessageCircle,
  X,
} from "lucide-react";

type NotificationType =
  | "booking"
  | "message"
  | "issue"
  | "system";

interface NotificationDetails {
  business?: string;
  date?: string;
  amount?: string;
  subject?: string;
  message: string;
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  sender: string;
  preview: string;
  time: string;
  unread: boolean;
  details: NotificationDetails;
}

/*
|--------------------------------------------------------------------------
| DEMO NOTIFICATIONS
|--------------------------------------------------------------------------
|
| Temporary notifications until the real notification database is connected.
|
*/

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "booking",
    title: "New Booking Request",
    sender: "John Banda",
    preview:
      "I would like to book an appointment for tomorrow at 10:00...",
    time: "5 minutes ago",
    unread: true,
    details: {
      business: "Alessandro Elite Fashion",
      date: "20 August 2026 at 10:00",
      amount: "ZMW 150.00",
      message:
        "I would like to book an appointment for tomorrow at 10:00. Please confirm if the time is available.",
    },
  },

  {
    id: "2",
    type: "message",
    title: "New Customer Message",
    sender: "Mary Phiri",
    preview:
      "Hello, I wanted to ask about the services you offer...",
    time: "18 minutes ago",
    unread: true,
    details: {
      subject: "Question about services",
      message:
        "Hello, I wanted to ask about the services you offer and whether I can make an appointment this week.",
    },
  },

  {
    id: "3",
    type: "issue",
    title: "Issue Requires Attention",
    sender: "Alessandro Tech Solutions",
    preview:
      "A reported issue requires management review...",
    time: "32 minutes ago",
    unread: true,
    details: {
      business: "Alessandro Tech Solutions",
      message:
        "A reported operational issue requires management review and a response.",
    },
  },

  {
    id: "4",
    type: "system",
    title: "System Update",
    sender: "Alessandro Enterprise System",
    preview:
      "All major enterprise services are currently operational.",
    time: "1 hour ago",
    unread: false,
    details: {
      message:
        "All major enterprise services are currently operational. No action is required.",
    },
  },
];

/*
|--------------------------------------------------------------------------
| NOTIFICATION ICON
|--------------------------------------------------------------------------
*/

function getIcon(type: NotificationType) {
  switch (type) {
    case "booking":
      return <Clock className="h-5 w-5" />;

    case "message":
      return <MessageCircle className="h-5 w-5" />;

    case "issue":
      return <X className="h-5 w-5" />;

    case "system":
    default:
      return <CheckCircle2 className="h-5 w-5" />;
  }
}

/*
|--------------------------------------------------------------------------
| ICON CONTAINER
|--------------------------------------------------------------------------
*/

function getIconContainerClass(type: NotificationType) {
  switch (type) {
    case "booking":
      return "bg-yellow-100 text-yellow-700";

    case "message":
      return "bg-blue-100 text-blue-700";

    case "issue":
      return "bg-red-100 text-red-700";

    case "system":
    default:
      return "bg-green-100 text-green-700";
  }
}

/*
|--------------------------------------------------------------------------
| NOTIFICATION CENTER
|--------------------------------------------------------------------------
*/

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  const [selected, setSelected] =
    useState<Notification | null>(null);

  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  /*
  |--------------------------------------------------------------------------
  | CLIENT MOUNT
  |--------------------------------------------------------------------------
  |
  | This prevents hydration problems when using document.body with portals.
  |
  */

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | UNREAD COUNT
  |--------------------------------------------------------------------------
  */

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  /*
  |--------------------------------------------------------------------------
  | MARK ONE AS READ
  |--------------------------------------------------------------------------
  */

  function markAsRead(id: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              unread: false,
            }
          : notification
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MARK ALL AS READ
  |--------------------------------------------------------------------------
  */

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  }

  /*
  |--------------------------------------------------------------------------
  | OPEN NOTIFICATION
  |--------------------------------------------------------------------------
  */

  function openNotification(notification: Notification) {
    markAsRead(notification.id);

    setSelected({
      ...notification,
      unread: false,
    });

    setOpen(false);
  }

  /*
  |--------------------------------------------------------------------------
  | CLOSE DETAILS
  |--------------------------------------------------------------------------
  */

  function closeDetails() {
    setSelected(null);
  }

  /*
  |--------------------------------------------------------------------------
  | CLOSE NOTIFICATION CENTER
  |--------------------------------------------------------------------------
  */

  function closeCenter() {
    setOpen(false);
  }

  /*
  |--------------------------------------------------------------------------
  | ESCAPE KEY
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (selected) {
        closeDetails();
        return;
      }

      if (open) {
        closeCenter();
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
  }, [open, selected]);

  /*
  |--------------------------------------------------------------------------
  | PREVENT BACKGROUND SCROLL WHEN MODAL IS OPEN
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!selected) {
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
  }, [selected]);

  /*
  |--------------------------------------------------------------------------
  | VIEW MORE ROUTES
  |--------------------------------------------------------------------------
  */

  function getViewMoreHref(
    type: NotificationType
  ) {
    switch (type) {
      case "booking":
        return "/dashboard/bookings";

      case "message":
        return "/dashboard/messages";

      case "issue":
        return "/dashboard/notifications";

      case "system":
      default:
        return "/dashboard/notifications";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <>
      {/* ==========================================================
          NOTIFICATION BUTTON + PANEL
      ========================================================== */}

      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setOpen((value) => !value)
          }
          className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition ${
            open
              ? "bg-[#03162F] text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          aria-label="Notifications"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <Bell className="h-6 w-6" />

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* ========================================================
            NOTIFICATION PANEL
        ======================================================== */}

        {open && (
          <>
            {/* Outside click layer */}

            <button
              type="button"
              aria-label="Close notifications"
              onClick={closeCenter}
              className="fixed inset-0 z-40 cursor-default bg-transparent"
            />

            {/* Panel */}

            <div className="absolute right-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* PANEL HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="font-bold text-[#03162F]">
                    Notifications
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {unreadCount === 0
                      ? "You're all caught up"
                      : `${unreadCount} unread`}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-[#03162F] transition hover:text-[#D4AF37]"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* NOTIFICATION LIST */}

              <div className="max-h-[460px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Bell className="mx-auto h-10 w-10 text-slate-300" />

                    <p className="mt-3 font-semibold text-[#03162F]">
                      No notifications
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      You're all caught up.
                    </p>
                  </div>
                ) : (
                  notifications.map(
                    (notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() =>
                          openNotification(
                            notification
                          )
                        }
                        className={`flex w-full gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
                          notification.unread
                            ? "bg-blue-50/40"
                            : "bg-white"
                        }`}
                      >
                        {/* ICON */}

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getIconContainerClass(
                            notification.type
                          )}`}
                        >
                          {getIcon(
                            notification.type
                          )}
                        </div>

                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-[#03162F]">
                              {notification.title}
                            </p>

                            {notification.unread && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>

                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            {notification.sender}
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {notification.preview}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            {notification.time}
                          </p>
                        </div>
                      </button>
                    )
                  )
                )}
              </div>

              {/* PANEL FOOTER */}

              <div className="border-t border-slate-200 p-3">
                <a
                  href="/dashboard/notifications"
                  onClick={closeCenter}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2852]"
                >
                  <Eye className="h-4 w-4" />
                  View All Notifications
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==========================================================
          NOTIFICATION DETAIL MODAL
          IMPORTANT:
          This is rendered directly into document.body.
          Therefore it cannot be trapped underneath WelcomeBanner,
          Header, Sidebar, or another stacking context.
      ========================================================== */}

      {mounted &&
        selected &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#03162F]/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-modal-title"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeDetails();
              }
            }}
          >
            {/* ====================================================
                MODAL CONTAINER
            ==================================================== */}

            <div
              className="relative z-[1000000] flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0_25px_80px_rgba(0,0,0,0.35)]"
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
            >
              {/* ==================================================
                  MODAL HEADER
              ================================================== */}

              <div className="relative shrink-0 border-b border-slate-200 bg-white px-6 py-5 pr-16">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Notification
                </p>

                <h2
                  id="notification-modal-title"
                  className="mt-1 text-xl font-bold text-[#03162F]"
                >
                  {selected.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selected.sender}
                </p>

                {/* =================================================
                    TOP-RIGHT CLOSE BUTTON
                ================================================= */}

                <button
                  type="button"
                  onClick={closeDetails}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-[#03162F]"
                  aria-label="Close notification"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* ==================================================
                  SCROLLABLE CONTENT
              ================================================== */}

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-5 p-6">
                  {/* =================================================
                      MESSAGE
                  ================================================= */}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    {/* FROM */}

                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          From
                        </p>

                        <p className="mt-1 break-words font-semibold text-[#03162F]">
                          {selected.sender}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-slate-400">
                        {selected.time}
                      </span>
                    </div>

                    {/* SUBJECT */}

                    {selected.details.subject && (
                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Subject
                        </p>

                        <p className="mt-1 break-words font-semibold text-[#03162F]">
                          {selected.details.subject}
                        </p>
                      </div>
                    )}

                    {/* MESSAGE */}

                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Message
                      </p>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                        {selected.details.message}
                      </p>
                    </div>
                  </div>

                  {/* =================================================
                      BOOKING DETAILS
                  ================================================= */}

                  {selected.type ===
                    "booking" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selected.details
                        .business && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Business
                          </p>

                          <p className="mt-1 break-words font-semibold text-[#03162F]">
                            {
                              selected
                                .details
                                .business
                            }
                          </p>
                        </div>
                      )}

                      {selected.details
                        .date && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Appointment
                          </p>

                          <p className="mt-1 font-semibold text-[#03162F]">
                            {
                              selected
                                .details
                                .date
                            }
                          </p>
                        </div>
                      )}

                      {selected.details
                        .amount && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Amount
                          </p>

                          <p className="mt-1 text-lg font-bold text-[#03162F]">
                            {
                              selected
                                .details
                                .amount
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =================================================
                      ISSUE DETAILS
                  ================================================= */}

                  {selected.type ===
                    "issue" &&
                    selected.details
                      .business && (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                          Business
                        </p>

                        <p className="mt-1 font-semibold text-red-900">
                          {
                            selected
                              .details
                              .business
                          }
                        </p>
                      </div>
                    )}

                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  {/* =================================================
    ACTIONS
================================================= */}

{/* =================================================
    ACTIONS
================================================= */}

<div className="border-t border-slate-200 pt-5">

  {/* PRIMARY ACTIONS */}
  <div className="grid grid-cols-3 gap-2">

    {/* MARK AS READ */}
    <button
      type="button"
      onClick={() => {
        markAsRead(selected.id);
        closeDetails();
      }}
      className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
    >
      <Check className="h-4 w-4 shrink-0" />

      <span className="text-center leading-5">
        Mark as Read
      </span>
    </button>

    {/* BOOKING: ACCEPT */}
    {selected.type === "booking" && (
      <button
        type="button"
        onClick={() => {
          closeDetails();
          window.location.href =
            "/dashboard/bookings";
        }}
        className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
      >
        <Check className="h-4 w-4 shrink-0" />
        Accept
      </button>
    )}

    {/* BOOKING: REJECT */}
    {selected.type === "booking" && (
      <button
        type="button"
        onClick={() => {
          closeDetails();
          window.location.href =
            "/dashboard/bookings";
        }}
        className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        <X className="h-4 w-4 shrink-0" />
        Reject
      </button>
    )}

    {/* MESSAGE: REPLY */}
    {selected.type === "message" && (
      <a
        href="/dashboard/messages"
        onClick={closeDetails}
        className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2852]"
      >
        <MessageCircle className="h-4 w-4 shrink-0" />
        Reply
      </a>
    )}

    {/* ISSUE: REVIEW */}
    {selected.type === "issue" && (
      <a
        href="/dashboard/notifications"
        onClick={closeDetails}
        className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        <Eye className="h-4 w-4 shrink-0" />
        Review Issue
      </a>
    )}

    {/* VIEW MORE */}
    <a
      href={
        selected.type === "booking"
          ? "/dashboard/bookings"
          : selected.type === "message"
            ? "/dashboard/messages"
            : "/dashboard/notifications"
      }
      onClick={closeDetails}
      className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2852]"
    >
      <Eye className="h-4 w-4 shrink-0" />
      <span className="text-center leading-5">
        View More
      </span>
    </a>
  </div>

  {/* =================================================
      CLOSE — KEEP THIS EXACTLY AS IT IS
  ================================================= */}

  <button
    type="button"
    onClick={closeDetails}
    className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
  >
    <X className="h-4 w-4" />
    Close
  </button>

</div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}