import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCommunityClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ContentType = "post" | "offer";
type CommunityTarget = { content_type: ContentType; content_id: string };
const anonymousVisitorKey = "00000000-0000-4000-8000-000000000000";

async function getGoogleCommunityUser() {
  const supabase = await createCommunityClient();
  const { data: { user } } = await supabase.auth.getUser();
  const providers = user?.app_metadata?.providers;
  const isGoogle = user?.app_metadata?.provider === "google" || (Array.isArray(providers) && providers.includes("google"));
  if (!isGoogle || !user) return null;
  return user;
}

function parseTargets(values: string[]): CommunityTarget[] | null {
  if (values.length < 1 || values.length > 50) return null;
  const targets: CommunityTarget[] = [];
  for (const value of values) {
    const [content_type, content_id, extra] = value.split(":");
    if (extra || (content_type !== "post" && content_type !== "offer") || !uuidPattern.test(content_id ?? "")) return null;
    targets.push({ content_type, content_id });
  }
  return targets;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const targets = parseTargets(url.searchParams.getAll("target"));
  if (!targets) return NextResponse.json({ error: "Invalid community request." }, { status: 400 });

  const user = await getGoogleCommunityUser();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_website_community_stats", { p_targets: targets, p_visitor_key: user?.id ?? anonymousVisitorKey });
  if (error) return NextResponse.json({ error: "Community activity is temporarily unavailable." }, { status: 503 });
  return NextResponse.json({ items: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let payload: { action?: unknown; contentType?: unknown; contentId?: unknown; message?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid community request." }, { status: 400 });
  }

  const action = payload.action;
  const contentType = payload.contentType;
  const contentId = payload.contentId;
  if (!(["like", "unlike", "comment"] as unknown[]).includes(action)
    || (contentType !== "post" && contentType !== "offer")
    || typeof contentId !== "string" || !uuidPattern.test(contentId)) {
    return NextResponse.json({ error: "Invalid community request." }, { status: 400 });
  }

  const user = await getGoogleCommunityUser();
  if (!user) return NextResponse.json({ error: "Continue with Google to like or comment." }, { status: 401 });
  const visitorKey = user.id;
  const visitorName = String(user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.given_name || user.email?.split("@")[0] || "Community member").replace(/[\r\n\t]+/g, " ").trim().slice(0, 80);

  const admin = createAdminClient();
  const now = new Date().toISOString();
  if (contentType === "post") {
    const { data, error } = await admin.from("business_posts").select("id").eq("id", contentId).eq("published", true).or(`published_at.is.null,published_at.lte.${now}`).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "This post is no longer available." }, { status: 404 });
  } else {
    const { data, error } = await admin.from("business_promotions").select("id").eq("id", contentId).eq("active", true).eq("published", true).or(`start_date.is.null,start_date.lte.${now}`).or(`end_date.is.null,end_date.gte.${now}`).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "This advert is no longer available." }, { status: 404 });
  }

  if (action === "like") {
    const { error } = await admin.from("website_community_likes").upsert({ content_type: contentType, content_id: contentId, visitor_key: visitorKey }, { onConflict: "content_type,content_id,visitor_key", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: "Your like could not be saved." }, { status: 503 });
  } else if (action === "unlike") {
    const { error } = await admin.from("website_community_likes").delete().eq("content_type", contentType).eq("content_id", contentId).eq("visitor_key", visitorKey);
    if (error) return NextResponse.json({ error: "Your like could not be updated." }, { status: 503 });
  } else {
    const message = typeof payload.message === "string" ? payload.message.trim().slice(0, 1200) : "";
    if (!message) return NextResponse.json({ error: "Write a comment before posting." }, { status: 400 });
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count, error: rateError } = await admin.from("website_community_comments").select("id", { count: "exact", head: true }).eq("visitor_key", visitorKey).gte("created_at", since);
    if (rateError) return NextResponse.json({ error: "Comments are temporarily unavailable." }, { status: 503 });
    if ((count ?? 0) >= 5) return NextResponse.json({ error: "Please wait a few minutes before commenting again." }, { status: 429 });
    const { error } = await admin.from("website_community_comments").insert({ content_type: contentType, content_id: contentId, visitor_key: visitorKey, visitor_name: visitorName, message });
    if (error) return NextResponse.json({ error: "Your comment could not be saved." }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}
