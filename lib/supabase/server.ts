import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export { createAdminClient } from "./admin";

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
