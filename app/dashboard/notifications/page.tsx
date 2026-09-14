import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  CalendarDays,
  Settings,
} from "lucide-react";

import {
  getNotifications,
  getNotificationStats,
} from "@/modules/notifications/services/notification.service";

function formatNotificationTime(
  value: string
) {
  const date = new Date(value);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(
    diffMs / (1000 * 60)
  );

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min${
      diffMinutes === 1 ? "" : "s"
    } ago`;
  }

  const diffHours = Math.floor(
    diffMinutes / 60
  );

  if (diffHours < 24) {
    return `${diffHours} hour${
      diffHours === 1 ? "" : "s"
    } ago`;
  }

  const diffDays = Math.floor(
    diffHours / 24
  );

  if (diffDays < 7) {
    return `${diffDays} day${
      diffDays === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNotificationIcon(
  type: string
) {
  switch (type) {
    case "booking":
      return CalendarDays;

    case "message":
      return Mail;

    case "issue":
      return AlertTriangle;

    case "system":
    default:
      return Settings;
  }
}

export default async function NotificationsPage() {
  const [notifications, stats] =
    await Promise.all([
      getNotifications(),
      getNotificationStats(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Notifications
        </h1>

        <p className="mt-1 text-slate-500">
          View important updates and system
          notifications across AEOS.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total
              </p>

              <p className="mt-1 text-2xl font-bold text-[#03162F]">
                {stats.total}
              </p>
            </div>

            <Bell className="h-5 w-5 text-[#D4AF37]" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Unread
              </p>

              <p className="mt-1 text-2xl font-bold text-[#03162F]">
                {stats.unread}
              </p>
            </div>

            <Clock className="h-5 w-5 text-orange-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Messages
              </p>

              <p className="mt-1 text-2xl font-bold text-[#03162F]">
                {stats.messages}
              </p>
            </div>

            <Mail className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Bookings
              </p>

              <p className="mt-1 text-2xl font-bold text-[#03162F]">
                {stats.bookings}
              </p>
            </div>

            <CalendarDays className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-[#03162F]">
              Notification History
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              All notifications received by the
              current AEOS account.
            </p>
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {stats.unread} unread
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="py-14 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-300" />

            <h2 className="mt-4 text-xl font-bold text-[#03162F]">
              No notifications
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              New system notifications, pending
              actions and important updates will
              appear here.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                Pending
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-500">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(
              (notification) => {
                const Icon =
                  getNotificationIcon(
                    notification.type
                  );

                const isUnread =
                  notification.unread === true &&
                  notification.is_read !== true;

                return (
                  <div
                    key={notification.id}
                    className={`flex gap-4 px-5 py-4 transition ${
                      isUnread
                        ? "bg-blue-50/40"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-[#03162F]">
                            {notification.title}
                          </h3>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {notification.sender}
                            {notification.business
                              ? ` • ${notification.business}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                          )}

                          <span className="text-xs text-slate-400">
                            {formatNotificationTime(
                              notification.created_at
                            )}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        {notification.preview ||
                          notification.message}
                      </p>

                      {notification.subject && (
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Subject:{" "}
                          {notification.subject}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-600">
                          {notification.type}
                        </span>

                        {notification.is_read ? (
                          <span className="flex items-center gap-1 text-[11px] text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Read
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-orange-600">
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}