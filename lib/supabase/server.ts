import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export { createAdminClient } from "./admin";

function getCommunityAuthCookieName() {
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
  return `sb-${projectRef}-community-auth-token`;
}

export async function createClient(options: { includeOperationsSession?: boolean } = {}) {
  const cookieStore = await cookies();
  const operatorToken = options.includeOperationsSession === false ? undefined : cookieStore.get("aeos_ops_token")?.value;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: operatorToken ? { headers: { "x-aeos-operator-token": operatorToken } } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /*
             * Server Components cannot always
             * modify cookies. The middleware is
             * responsible for refreshing them.
             */
          }
        },
      },
    }
  );
}

export async function createCommunityClient() {
  const cookieStore = await cookies();
  const cookieName = getCommunityAuthCookieName();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: { name: cookieName, path: "/", sameSite: "lax" },
      cookies: {
        getAll() {
          // Supabase stores PKCE verifiers in per-flow cookies named
          // `<storage-key>-flow-<id>-code-verifier`. Keep those alongside
          // the session cookie or exchangeCodeForSession cannot restore the
          // Google sign-in session after the provider redirects back.
          return cookieStore.getAll().filter(({ name }) =>
            name === cookieName ||
            name.startsWith(`${cookieName}.`) ||
            name.startsWith(`${cookieName}-`)
          );
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Route handlers can write these cookies; Server Components cannot.
          }
        },
      },
    },
  );
}
