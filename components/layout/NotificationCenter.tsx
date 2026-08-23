"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase/client";
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  MessageCircle,
  X,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

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
| DATABASE NOTIFICATION TYPE
|--------------------------------------------------------------------------
*/

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  sender: string;
  preview: string;
  message: string;
  business: string | null;
  notification_date: string | null;
  amount: string | null;
  subject: string | null;
  action_url: string | null;
  unread: boolean;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizeNotificationType(
  type: string
): NotificationType {
  switch (type) {
    case "booking":
      return "booking";

    case "message":
      return "message";

    case "issue":
      return "issue";

    case "system":
      return "system";

    default:
      return "system";
  }
}

/*
|--------------------------------------------------------------------------
| NOTIFICATION TIME
|--------------------------------------------------------------------------
*/

function formatNotificationTime(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const seconds = Math.floor(
    (Date.now() - date.getTime()) / 1000
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(
    seconds / 60
  );

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  return `${days} day${
    days === 1 ? "" : "s"
  } ago`;
}

/*
|--------------------------------------------------------------------------
| DATABASE → UI MAPPER
|--------------------------------------------------------------------------
*/

function mapNotification(
  notification: NotificationRow
): Notification {
  return {
    id: notification.id,

    type: normalizeNotificationType(
      notification.type
    ),

    title: notification.title,

    sender: notification.sender,

    preview: notification.preview,

    time: formatNotificationTime(
      notification.created_at
    ),

    unread:
      notification.unread === true &&
      notification.is_read !== true,

    details: {
      business:
        notification.business ??
        undefined,

      date:
        notification.notification_date ??
        undefined,

      amount:
        notification.amount ??
        undefined,

      subject:
        notification.subject ??
        undefined,

      message:
        notification.message,
    },
  };
}

/*
|--------------------------------------------------------------------------
| NOTIFICATION ICON
|--------------------------------------------------------------------------
*/

function getIcon(
  type: NotificationType
) {
  switch (type) {
    case "booking":
      return (
        <Clock className="h-5 w-5" />
      );

    case "message":
      return (
        <MessageCircle className="h-5 w-5" />
      );

    case "issue":
      return (
        <X className="h-5 w-5" />
      );

    case "system":
    default:
      return (
        <CheckCircle2 className="h-5 w-5" />
      );
  }
}

/*
|--------------------------------------------------------------------------
| NOTIFICATION ICON CONTAINER
|--------------------------------------------------------------------------
*/

function getIconContainerClass(
  type: NotificationType
) {
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
  /*
   * ---------------------------------------------------------------
   * STATE
   * ---------------------------------------------------------------
   */

  const [open, setOpen] =
    useState(false);

  const [mounted, setMounted] =
    useState(false);

  const [selected, setSelected] =
    useState<Notification | null>(null);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [markingAsRead, setMarkingAsRead] =
    useState(false);

  /*
   * ---------------------------------------------------------------
   * LOAD NOTIFICATIONS
   * ---------------------------------------------------------------
   *
   * Only unread notifications are loaded.
   *
   * Once a notification is marked as read:
   *
   * unread = false
   * is_read = true
   *
   * Therefore it will not return after a browser refresh.
   * ---------------------------------------------------------------
   */

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      setLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from("notifications")
          .select(`
            id,
            type,
            title,
            sender,
            preview,
            message,
            business,
            notification_date,
            amount,
            subject,
            action_url,
            unread,
            is_read,
            read_at,
            created_at,
            updated_at
          `)
          .eq("unread", true)
          .eq("is_read", false)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          console.error(
            "Failed to load notifications:",
            error
          );

          return;
        }

        if (!active) {
          return;
        }

        const loaded =
          (data ?? []).map(
            (notification) =>
              mapNotification(
                notification as NotificationRow
              )
          );

        setNotifications(loaded);
      } catch (error) {
        console.error(
          "Notification loading error:",
          error
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  /*
   * ---------------------------------------------------------------
   * CLIENT MOUNT
   * ---------------------------------------------------------------
   */

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * ---------------------------------------------------------------
   * UNREAD COUNT
   * ---------------------------------------------------------------
   */

  const unreadCount =
    notifications.filter(
      (notification) =>
        notification.unread
    ).length;

  /*
   * ---------------------------------------------------------------
   * MARK ONE NOTIFICATION AS READ
   * ---------------------------------------------------------------
   */

  async function markAsRead(
    id: string
  ) {
    if (markingAsRead) {
      return;
    }

    setMarkingAsRead(true);

    try {
      const now =
        new Date().toISOString();

      const {
        error,
      } = await supabase
        .from("notifications")
        .update({
          unread: false,
          is_read: true,
          read_at: now,
          updated_at: now,
        })
        .eq("id", id);

      if (error) {
        console.error(
          "Failed to mark notification as read:",
          error
        );

        return;
      }

      /*
       * Remove it immediately from the notification list.
       */

      setNotifications(
        (current) =>
          current.filter(
            (notification) =>
              notification.id !== id
          )
      );

      /*
       * Close the detail popup.
       */

      setSelected(null);
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error
      );
    } finally {
      setMarkingAsRead(false);
    }
  }

  /*
   * ---------------------------------------------------------------
   * MARK ALL AS READ
   * ---------------------------------------------------------------
   */

  async function markAllAsRead() {
    if (
      notifications.length === 0 ||
      markingAsRead
    ) {
      return;
    }

    setMarkingAsRead(true);

    try {
      const now =
        new Date().toISOString();

      const {
        error,
      } = await supabase
        .from("notifications")
        .update({
          unread: false,
          is_read: true,
          read_at: now,
          updated_at: now,
        })
        .eq("unread", true)
        .eq("is_read", false);

      if (error) {
        console.error(
          "Failed to mark all notifications as read:",
          error
        );

        return;
      }

      /*
       * Clear the notification list immediately.
       */

      setNotifications([]);

      /*
       * Close any open notification detail.
       */

      setSelected(null);
    } catch (error) {
      console.error(
        "Mark all notifications as read error:",
        error
      );
    } finally {
      setMarkingAsRead(false);
    }
  }

  /*
   * ---------------------------------------------------------------
   * OPEN NOTIFICATION
   * ---------------------------------------------------------------
   *
   * IMPORTANT:
   *
   * Opening a notification does NOT mark it as read.
   *
   * The user must explicitly press "Mark as Read".
   * ---------------------------------------------------------------
   */

  function openNotification(
    notification: Notification
  ) {
    setSelected(notification);
    setOpen(false);
  }

  /*
   * ---------------------------------------------------------------
   * CLOSE DETAILS
   * ---------------------------------------------------------------
   */

  function closeDetails() {
    setSelected(null);
  }

  /*
   * ---------------------------------------------------------------
   * CLOSE NOTIFICATION CENTER
   * ---------------------------------------------------------------
   */

  function closeCenter() {
    setOpen(false);
  }

  /*
   * ---------------------------------------------------------------
   * ESCAPE KEY
   * ---------------------------------------------------------------
   */

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
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
   * ---------------------------------------------------------------
   * PREVENT BACKGROUND SCROLL
   * ---------------------------------------------------------------
   */

  useEffect(() => {
    if (!selected) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [selected]);

  /*
   * ---------------------------------------------------------------
   * VIEW MORE ROUTE
   * ---------------------------------------------------------------
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
            setOpen(
              (current) => !current
            )
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
            {/* ====================================================
                OUTSIDE CLICK
            ==================================================== */}

            <button
              type="button"
              aria-label="Close notifications"
              onClick={closeCenter}
              className="fixed inset-0 z-40 cursor-default bg-transparent"
            />

            {/* ====================================================
                PANEL
            ==================================================== */}

            <div className="absolute right-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* ==================================================
                  HEADER
              ================================================== */}

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
                    onClick={() => {
                      void markAllAsRead();
                    }}
                    disabled={
                      markingAsRead
                    }
                    className="text-xs font-semibold text-[#03162F] transition hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {markingAsRead
                      ? "Updating..."
                      : "Mark all as read"}
                  </button>
                )}
              </div>

              {/* ==================================================
                  LIST
              ================================================== */}

              <div className="max-h-[460px] overflow-y-auto">
                {loading ? (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#03162F]" />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading notifications...
                    </p>
                  </div>
                ) : notifications.length ===
                  0 ? (
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
                        key={
                          notification.id
                        }
                        type="button"
                        onClick={() =>
                          openNotification(
                            notification
                          )
                        }
                        className="flex w-full gap-3 border-b border-slate-100 bg-blue-50/40 p-4 text-left transition hover:bg-slate-50"
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
                              {
                                notification.title
                              }
                            </p>

                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                          </div>

                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            {
                              notification.sender
                            }
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {
                              notification.preview
                            }
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            {
                              notification.time
                            }
                          </p>
                        </div>
                      </button>
                    )
                  )
                )}
              </div>

              {/* ==================================================
                  FOOTER
              ================================================== */}

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

                {/* TOP RIGHT CLOSE */}

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
                          {
                            selected.sender
                          }
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-slate-400">
                        {
                          selected.time
                        }
                      </span>
                    </div>

                    {/* SUBJECT */}

                    {selected.details
                      .subject && (
                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Subject
                        </p>

                        <p className="mt-1 break-words font-semibold text-[#03162F]">
                          {
                            selected
                              .details
                              .subject
                          }
                        </p>
                      </div>
                    )}

                    {/* MESSAGE */}

                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Message
                      </p>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                        {
                          selected
                            .details
                            .message
                        }
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

<div className="border-t border-slate-200 pt-5">

  {/* PRIMARY ACTIONS */}
  <div
    className={
      selected.type === "booking"
        ? "grid grid-cols-1 gap-2 sm:grid-cols-3"
        : "grid grid-cols-1 gap-2 sm:grid-cols-2"
    }
  >

    {/* MARK AS READ */}
    <button
      type="button"
      onClick={() => {
        markAsRead(selected.id);
      }}
      className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
    >
      <Check className="h-4 w-4 shrink-0" />

      <span className="text-center leading-5">
        Mark as Read
      </span>
    </button>

    {/* =================================================
        BOOKING ACTIONS
    ================================================= */}

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

        <span>Accept</span>
      </button>
    )}

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

        <span>Reject</span>
      </button>
    )}

    {/* =================================================
        MESSAGE ACTION
    ================================================= */}

    {selected.type === "message" && (
      <a
        href="/dashboard/messages"
        onClick={closeDetails}
        className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2852]"
      >
        <MessageCircle className="h-4 w-4 shrink-0" />

        <span>Reply</span>
      </a>
    )}

    {/* =================================================
        ISSUE ACTION
    ================================================= */}

    {selected.type === "issue" && (
      <a
        href="/dashboard/notifications"
        onClick={closeDetails}
        className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        <Eye className="h-4 w-4 shrink-0" />

        <span>Review Issue</span>
      </a>
    )}

    {/* =================================================
        VIEW MORE
    ================================================= */}

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
      CLOSE BUTTON
  ================================================= */}

  <button
    type="button"
    onClick={closeDetails}
    className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
  >
    <X className="h-4 w-4" />

    <span>Close</span>
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