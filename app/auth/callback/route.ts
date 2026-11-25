import { NextResponse, type NextRequest } from "next/server";
import { createCommunityClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/community";
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/community?community_auth=google_error", request.url));

  const supabase = await createCommunityClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/community?community_auth=google_error", request.url));
  return NextResponse.redirect(new URL(safeNext, request.url));
}
