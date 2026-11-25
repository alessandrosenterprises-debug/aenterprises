"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const communityCookieName = `sb-${projectRef}-community-auth-token`;

// Keep public Google community sign-in independent from the AEOS customer/staff session.
export const communitySupabase = createBrowserClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    isSingleton: false,
    cookieOptions: { name: communityCookieName, path: "/", sameSite: "lax" },
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  },
);
