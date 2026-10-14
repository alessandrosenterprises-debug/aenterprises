import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured."
    );
  }

  if (!adminKey) {
    throw new Error(
      "Set SUPABASE_SECRET_KEY to a server-only Supabase secret key (or SUPABASE_SERVICE_ROLE_KEY to a legacy service-role key)."
    );
  }

  const isSecretKey = adminKey.startsWith("sb_secret_");
  let legacyRole = "";
  if (!isSecretKey) {
    try {
      const payload = adminKey.split(".")[1];
      legacyRole = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role;
    } catch {
      // Reject malformed keys below without logging the key itself.
    }
  }
  if (!isSecretKey && legacyRole !== "service_role") {
    throw new Error(
      "The Supabase admin key is not privileged. Use SUPABASE_SECRET_KEY (sb_secret_...) or a legacy service-role JWT; publishable keys cannot be used for admin access."
    );
  }

  return createClient(
    supabaseUrl,
    adminKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
