"use server";

import { createClient } from "@/lib/supabase/server";

async function getCustomerProfileId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, profileId: null };
  const { data: profile } = await supabase.from("profiles")
    .select("id").eq("auth_user_id", user.id).eq("active", true).maybeSingle();
  return { supabase, profileId: profile?.id ?? null };
}

export async function markCustomerNotificationRead(notificationId: string) {
  if (!notificationId) return { success: false, error: "Notification not found." };
  const { supabase, profileId } = await getCustomerProfileId();
  if (!profileId) return { success: false, error: "Sign in to update notifications." };
  const { error } = await supabase.from("notifications")
    .update({ unread: false, read_at: new Date().toISOString() })
    .eq("id", notificationId).eq("user_id", profileId);
  if (error) return { success: false, error: "Could not update this notification." };
  return { success: true };
}

export async function markAllCustomerNotificationsRead() {
  const { supabase, profileId } = await getCustomerProfileId();
  if (!profileId) return { success: false, error: "Sign in to update notifications." };
  const { error } = await supabase.from("notifications")
    .update({ unread: false, read_at: new Date().toISOString() })
    .eq("user_id", profileId).eq("unread", true);
  if (error) return { success: false, error: "Could not update your notifications." };
  return { success: true };
}
