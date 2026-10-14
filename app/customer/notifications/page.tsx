import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NotificationsList, { type CustomerNotificationItem } from "./NotificationsList";

export const dynamic = "force-dynamic";

export default async function CustomerNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/customer/login");

  const { data: profile } = await supabase.from("profiles")
    .select("id").eq("auth_user_id", user.id).eq("active", true).maybeSingle();
  if (!profile) redirect("/customer/login");

  const { data, error } = await supabase.from("notifications")
    .select("id, type, title, sender, preview, message, business, notification_date, amount, subject, action_url, unread, read_at, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });
  if (error) console.error("Customer notifications loading error:", error);

  const notifications = (data ?? []) as CustomerNotificationItem[];

  return <main className="min-h-screen bg-slate-50 pb-24">

    <div className="mx-auto max-w-3xl px-5 py-7">
      <Link href="/customer" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#03162F]"><ArrowLeft className="h-4 w-4" />Back to Home</Link>
      <header className="mt-6 mb-7 flex items-center gap-4 rounded-2xl bg-[#03162F] p-6 text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37] text-[#03162F]"><Bell className="h-6 w-6" /></span>
        <div><p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Your account</p><h1 className="mt-1 text-2xl font-black">Notifications</h1><p className="mt-1 text-sm text-slate-300">Updates about your activity across Alessandro Enterprises.</p></div>
      </header>
      <NotificationsList notifications={notifications} />
    </div>
  </main>;
}
