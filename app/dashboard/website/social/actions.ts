"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContentAdmin } from "@/modules/enterprise/services/business-content-admin.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { processFacebookPublishQueue, verifyFacebookPageConnection } from "@/modules/website/services/facebook-publisher.server";

export async function verifyFacebookPageConnectionAction() {
  await requireBusinessContentAdmin();
  return verifyFacebookPageConnection();
}

export async function runFacebookPublishingAction() {
  await requireBusinessContentAdmin();
  const result = await processFacebookPublishQueue({ limit: 20 });
  revalidatePath("/dashboard/website/social");
  return result;
}

export async function retryFacebookQueueItemAction(queueId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(queueId)) throw new Error("Choose a valid Facebook queue item.");
  const supabase = await requireBusinessContentAdmin();
  const { data: item, error } = await supabase.from("facebook_publish_queue").select("id,business_id,status").eq("id", queueId).maybeSingle();
  if (error || !item) throw new Error("This Facebook queue item is not available to your account.");
  if (!(["failed", "paused", "needs_review", "retrying"].includes(item.status))) throw new Error("Only failed, paused, scheduled or review items can be retried.");
  const admin = createAdminClient();
  const { error: updateError } = await admin.from("facebook_publish_queue").update({ status: "pending", scheduled_at: new Date().toISOString(), next_attempt_at: null, locked_at: null, last_error: null }).eq("id", queueId);
  if (updateError) throw new Error("Could not move the Facebook post back to the publishing queue.");
  await processFacebookPublishQueue({ queueId, limit: 1 });
  revalidatePath("/dashboard/website/social");
}

export async function cancelFacebookQueueItemAction(queueId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(queueId)) throw new Error("Choose a valid Facebook queue item.");
  const supabase = await requireBusinessContentAdmin();
  const { data: item, error } = await supabase.from("facebook_publish_queue").select("id,status").eq("id", queueId).maybeSingle();
  if (error || !item) throw new Error("This Facebook queue item is not available to your account.");
  if (!(item.status === "pending" || item.status === "retrying" || item.status === "paused")) throw new Error("Only a queued Facebook post can be cancelled.");
  const admin = createAdminClient();
  const { error: updateError } = await admin.from("facebook_publish_queue").update({ status: "cancelled", next_attempt_at: null, locked_at: null }).eq("id", queueId);
  if (updateError) throw new Error("Could not cancel the queued Facebook post.");
  revalidatePath("/dashboard/website/social");
}
