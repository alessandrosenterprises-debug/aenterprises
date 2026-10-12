"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, ExternalLink } from "lucide-react";
import { useState, useTransition } from "react";
import { markAllCustomerNotificationsRead, markCustomerNotificationRead } from "./actions";

export interface CustomerNotificationItem {
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
  read_at: string | null;
  created_at: string;
}

function safeInternalHref(value: string | null) {
  return value?.startsWith("/customer/") ? value : null;
}

export default function NotificationsList({ notifications }: { notifications: CustomerNotificationItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const unreadCount = notifications.filter((item) => item.unread).length;

  function markRead(id: string) {
    setError("");
    startTransition(async () => {
      const result = await markCustomerNotificationRead(id);
      if (!result.success) setError(result.error || "Could not update the notification.");
      else router.refresh();
    });
  }

  function markAllRead() {
    setError("");
    startTransition(async () => {
      const result = await markAllCustomerNotificationsRead();
      if (!result.success) setError(result.error || "Could not update notifications.");
      else router.refresh();
    });
  }

  return <>
    <div className="mb-5 flex items-center justify-between gap-3">
      <p className="text-sm text-slate-500">{unreadCount} unread</p>
      {unreadCount > 0 && <button type="button" disabled={pending} onClick={markAllRead} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#03162F] hover:bg-slate-100 disabled:opacity-50"><Check className="h-4 w-4" />Mark all as read</button>}
    </div>
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    {notifications.length ? <div className="space-y-3">{notifications.map((notification) => {
      const href = safeInternalHref(notification.action_url);
      return <article key={notification.id} className={`rounded-2xl border p-4 ${notification.unread ? "border-[#D4AF37]/50 bg-amber-50/60" : "border-slate-200 bg-white"}`}>
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.unread ? "bg-[#D4AF37]/15 text-[#8A6D00]" : "bg-slate-100 text-slate-500"}`}><Bell className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-bold text-[#03162F]">{notification.title}</h2><time className="text-xs text-slate-400">{new Date(notification.created_at).toLocaleString("en-ZM", { dateStyle: "medium", timeStyle: "short" })}</time></div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{notification.preview || notification.message}</p>
            {notification.business && <p className="mt-2 text-xs font-semibold text-slate-500">{notification.business}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {href && <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-[#8A6D00] hover:underline">View details <ExternalLink className="h-3 w-3" /></Link>}
              {notification.unread && <button type="button" disabled={pending} onClick={() => markRead(notification.id)} className="text-xs font-semibold text-slate-500 hover:text-[#03162F] disabled:opacity-50">Mark as read</button>}
            </div>
          </div>
        </div>
      </article>;
    })}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Bell className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 font-bold text-[#03162F]">You’re all caught up</h2><p className="mt-1 text-sm text-slate-500">New updates about your bookings, orders and account will appear here.</p></div>}
  </>;
}
