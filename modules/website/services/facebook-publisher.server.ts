import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type FacebookContentType = "product" | "service" | "promotion" | "announcement";
type QueueRecord = {
  id: string;
  business_id: string;
  content_type: FacebookContentType;
  content_id: string;
  title: string;
  message: string;
  media_url: string | null;
  link_url: string | null;
  scheduled_at: string;
  status: string;
  attempt_count: number;
};

export type QueueFacebookContentInput = {
  contentType: FacebookContentType;
  contentId: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  title: string;
  description?: string | null;
  label?: string | null;
  imageUrl?: string | null;
  scheduledAt?: string | null;
  createdByAuthUserId?: string | null;
};

export type FacebookPublishRunResult = {
  claimed: number;
  published: number;
  retrying: number;
  paused: number;
  failed: number;
  needsReview: number;
  message?: string;
};

export async function verifyFacebookPageConnection() {
  const pageId = process.env.FACEBOOK_PAGE_ID?.trim();
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  if (!pageId || !accessToken) return { ok: false, error: "Configure the Facebook Page ID and Page access token on the server first." };
  const graphVersion = process.env.FACEBOOK_GRAPH_API_VERSION?.trim() || "v26.0";
  try {
    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}?fields=id,name`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const payload = await response.json() as { id?: string; name?: string; error?: { message?: string } };
    if (!response.ok || !payload.id) return { ok: false, error: payload.error?.message || `Meta returned HTTP ${response.status}. Check the Page ID, token, and Page access.` };
    if (payload.id !== pageId) return { ok: false, error: "The configured token resolved to a different Page ID." };
    return { ok: true, pageName: payload.name || "Facebook Page" };
  } catch {
    return { ok: false, error: "Could not reach Meta to verify the Page. Check the network and try again." };
  }
}

const PUBLIC_SITE_FALLBACK = "https://aenterprises-dashboard.vercel.app";

function isPublicHttpsUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^(10\.|127\.|192\.168\.)/.test(host)) return false;
    const private172 = host.match(/^172\.(\d{1,2})\./);
    if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return false;
    return true;
  } catch {
    return false;
  }
}

function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (isPublicHttpsUrl(configured)) return new URL(configured!).origin;
  const vercel = process.env.VERCEL_URL?.trim();
  const vercelUrl = vercel ? (vercel.startsWith("https://") ? vercel : `https://${vercel}`) : null;
  return isPublicHttpsUrl(vercelUrl) ? new URL(vercelUrl!).origin : PUBLIC_SITE_FALLBACK;
}

function buildPublicLink(slug: string) {
  return `${siteOrigin()}/businesses/${encodeURIComponent(slug)}`;
}

function buildMessage(input: QueueFacebookContentInput) {
  const lines = [input.title.trim()];
  if (input.label?.trim()) lines.push(input.label.trim());
  if (input.description?.trim()) lines.push(input.description.trim());
  lines.push(input.businessName.trim(), buildPublicLink(input.businessSlug));
  return lines.filter(Boolean).join("\n\n").slice(0, 6000);
}

export async function enqueueFacebookContent(input: QueueFacebookContentInput) {
  const admin = createAdminClient();
  const message = buildMessage(input);
  const linkUrl = buildPublicLink(input.businessSlug);
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt).toISOString() : new Date().toISOString();
  const idempotencyKey = createHash("sha256").update(JSON.stringify({
    type: input.contentType,
    id: input.contentId,
    message,
    image: input.imageUrl?.trim() || null,
    linkUrl,
    schedule: input.scheduledAt ? scheduledAt : "immediate",
  })).digest("hex");

  const { data, error } = await admin.from("facebook_publish_queue").insert({
    business_id: input.businessId,
    content_type: input.contentType,
    content_id: input.contentId,
    title: input.title.trim(),
    message,
    media_url: input.imageUrl?.trim() || null,
    link_url: linkUrl,
    idempotency_key: idempotencyKey,
    scheduled_at: scheduledAt,
    created_by_auth_user_id: input.createdByAuthUserId ?? null,
  }).select("id,status,scheduled_at,last_error").maybeSingle();

  if (error?.code === "23505") {
    const existing = await admin.from("facebook_publish_queue").select("id,status,scheduled_at,last_error").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing.error || !existing.data) throw new Error("AEOS could not confirm the existing Facebook publishing queue item.");
    return { ...existing.data, duplicate: true };
  }
  if (error || !data) throw new Error(error?.message || "Could not add this update to the Facebook publishing queue.");

  const queuedAt = new Date(String(data.scheduled_at)).getTime();
  if (queuedAt <= Date.now()) {
    await processFacebookPublishQueue({ queueId: String(data.id), limit: 1 });
  }
  const current = await admin.from("facebook_publish_queue").select("id,status,scheduled_at,last_error").eq("id", data.id).maybeSingle();
  return { ...(current.data ?? data), duplicate: false };
}

export async function processFacebookPublishQueue(options: { queueId?: string; limit?: number } = {}): Promise<FacebookPublishRunResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_due_facebook_publish_queue", {
    p_limit: options.limit ?? 10,
    p_queue_id: options.queueId ?? null,
  });
  if (error) throw new Error(`Could not claim Facebook publishing work: ${error.message}`);

  const rows = (data ?? []) as QueueRecord[];
  const result: FacebookPublishRunResult = { claimed: rows.length, published: 0, retrying: 0, paused: 0, failed: 0, needsReview: 0 };
  for (const row of rows) {
    const outcome = await publishOne(row, admin);
    result[outcome] += 1;
  }
  if (options.queueId && rows.length === 0) result.message = "This item is scheduled for later or is not in a publishable state.";
  return result;
}

async function publishOne(row: QueueRecord, admin: ReturnType<typeof createAdminClient>): Promise<"published" | "retrying" | "paused" | "failed" | "needsReview"> {
  const pageId = process.env.FACEBOOK_PAGE_ID?.trim();
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  if (!pageId || !accessToken) {
    await updateQueue(admin, row.id, { status: "paused", locked_at: null, last_error: "Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN in the server environment, then retry this item." });
    return "paused";
  }

  const graphVersion = process.env.FACEBOOK_GRAPH_API_VERSION?.trim() || "v26.0";
  const pageAccessToken = await resolvePageAccessToken(pageId, accessToken, graphVersion);
  const endpoint = row.media_url ? "photos" : "feed";
  const body = new URLSearchParams({ access_token: pageAccessToken });
  if (row.media_url) {
    body.set("url", row.media_url);
    body.set("caption", row.message);
  } else {
    const safeLink = isPublicHttpsUrl(row.link_url) ? row.link_url!.trim() : null;
    const message = safeLink
      ? row.message
      : row.message.split(/\r?\n/).filter((line) => !/^https?:\/\//i.test(line.trim())).join("\n");
    body.set("message", message);
    if (safeLink) body.set("link", safeLink);
  }

  let response: Response;
  let payload: { id?: string; post_id?: string; error?: { message?: string; code?: number; error_subcode?: number; is_transient?: boolean } };
  try {
    response = await fetch(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}/${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    payload = await response.json() as typeof payload;
  } catch {
    // A network timeout can happen after Facebook accepted the post. Never
    // blindly retry an uncertain external side effect; make an operator check.
    await updateQueue(admin, row.id, { status: "needs_review", locked_at: null, last_error: "Facebook did not return a confirmation. Check the Page before retrying to avoid a duplicate post." });
    return "needsReview";
  }

  if (response.ok && (payload.id || payload.post_id)) {
    await updateQueue(admin, row.id, { status: "published", locked_at: null, facebook_post_id: payload.post_id || payload.id || null, published_at: new Date().toISOString(), last_error: null, next_attempt_at: null });
    return "published";
  }

  const errorCode = payload.error?.code;
  const rawErrorMessage = payload.error?.message || `Facebook API returned HTTP ${response.status}.`;
  const errorMessage = /publish_actions/i.test(rawErrorMessage)
    ? "Meta rejected this request with a deprecated publish_actions permission error. AEOS uses the Page publishing API and pages_manage_posts; check that the current AEOS Page token is installed in this deployment, then retry."
    : rawErrorMessage;
  if (errorCode === 190 || errorCode === 102) {
    await updateQueue(admin, row.id, { status: "paused", locked_at: null, last_error: `Facebook authorization needs attention: ${errorMessage}` });
    return "paused";
  }
  if ((payload.error?.is_transient || response.status === 429 || response.status >= 500 || errorCode === 4 || errorCode === 17) && row.attempt_count < 5) {
    const delayMinutes = Math.min(60, 2 ** Math.max(0, row.attempt_count - 1));
    await updateQueue(admin, row.id, { status: "retrying", locked_at: null, next_attempt_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(), last_error: errorMessage });
    return "retrying";
  }
  await updateQueue(admin, row.id, { status: "failed", locked_at: null, last_error: errorMessage });
  return "failed";
}

/**
 * System User tokens can be used to resolve an assigned Page's Page token.
 * The Page API expects that Page token for publishing. If the configured value
 * is already a Page token and Meta does not return the access_token field,
 * retain it as a compatible fallback. Never return this value to a client.
 */
async function resolvePageAccessToken(pageId: string, configuredToken: string, graphVersion: string): Promise<string> {
  try {
    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}?fields=id,access_token`, {
      headers: { authorization: `Bearer ${configuredToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const payload = await response.json() as { id?: string; access_token?: string };
    if (response.ok && payload.id === pageId && payload.access_token) return payload.access_token;
  } catch {
    // The configured credential may already be a Page token; the publish
    // request below will return Meta's actionable authorization error if not.
  }
  return configuredToken;
}

async function updateQueue(admin: ReturnType<typeof createAdminClient>, id: string, values: Record<string, unknown>) {
  const { error } = await admin.from("facebook_publish_queue").update(values).eq("id", id).eq("status", "processing");
  if (error) console.error("Could not update Facebook publishing queue item", { id, code: error.code });
}
