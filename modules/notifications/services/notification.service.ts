import { createClient } from "@/lib/supabase/server";

export type NotificationType =
  | "booking"
  | "message"
  | "issue"
  | "system";

export interface Notification {
  id: string;
  user_id: string | null;

  type: NotificationType;

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

  source_id: string | null;

  created_at: string;
  updated_at: string;
}

function normalizeNotificationType(
  type: string | null | undefined
): NotificationType {
  switch (type) {
    case "booking":
      return "booking";

    case "message":
      return "message";

    case "issue":
      return "issue";

    case "system":
    default:
      return "system";
  }
}

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      user_id,
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
      source_id,
      created_at,
      updated_at
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Notifications query error:",
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  return (data ?? []).map((notification) => ({
    id: notification.id,
    user_id: notification.user_id ?? null,

    type: normalizeNotificationType(notification.type),

    title: notification.title,
    sender: notification.sender,
    preview: notification.preview,
    message: notification.message,

    business: notification.business ?? null,
    notification_date:
      notification.notification_date ?? null,
    amount: notification.amount ?? null,
    subject: notification.subject ?? null,
    action_url: notification.action_url ?? null,

    unread: notification.unread === true,
    is_read: notification.is_read === true,
    read_at: notification.read_at ?? null,

    source_id: notification.source_id ?? null,

    created_at: notification.created_at,
    updated_at: notification.updated_at,
  }));
}

export async function getNotificationStats() {
  const notifications = await getNotifications();

  return {
    total: notifications.length,

    unread: notifications.filter(
      (notification) =>
        notification.unread === true &&
        notification.is_read !== true
    ).length,

    read: notifications.filter(
      (notification) =>
        notification.is_read === true
    ).length,

    bookings: notifications.filter(
      (notification) =>
        notification.type === "booking"
    ).length,

    messages: notifications.filter(
      (notification) =>
        notification.type === "message"
    ).length,

    issues: notifications.filter(
      (notification) =>
        notification.type === "issue"
    ).length,

    system: notifications.filter(
      (notification) =>
        notification.type === "system"
    ).length,
  };
}