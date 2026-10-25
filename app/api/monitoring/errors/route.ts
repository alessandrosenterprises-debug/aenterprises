import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let payload: { route?: unknown; message?: unknown; digest?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid error report." }, { status: 400 });
  }

  const route = typeof payload.route === "string" && payload.route.startsWith("/")
    ? payload.route.split(/[?#]/, 1)[0].slice(0, 240)
    : "/unknown";
  const message = typeof payload.message === "string"
    ? payload.message.replace(/[\r\n\t]+/g, " ").trim().slice(0, 1200)
    : "Application page failed to load.";
  const digest = typeof payload.digest === "string" ? payload.digest.slice(0, 100) : null;
  const source = route.startsWith("/customer") ? "customer" : "staff";
  const admin = createAdminClient();
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count, error: rateError } = await admin.from("app_error_reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_auth_user_id", user.id)
    .gte("created_at", oneMinuteAgo);
  if (rateError) return NextResponse.json({ error: "Error reporting is not configured." }, { status: 503 });
  if ((count ?? 0) >= 5) return NextResponse.json({ error: "Please wait before sending another report." }, { status: 429 });

  const { error } = await admin.from("app_error_reports").insert({
    reporter_auth_user_id: user.id,
    source,
    route,
    message,
    digest,
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  });
  if (error) return NextResponse.json({ error: "The application issue could not be recorded." }, { status: 503 });
  return NextResponse.json({ success: true }, { status: 201 });
}
