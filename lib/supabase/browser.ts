import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        fetch: (input, init) => {
          const headers = new Headers(input instanceof Request ? input.headers : undefined);
          new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
          const token = typeof window !== "undefined" ? window.sessionStorage.getItem("aeos_ops_token") : null;
          if (token) headers.set("x-aeos-operator-token", token);
          else headers.delete("x-aeos-operator-token");
          return fetch(input, { ...init, headers });
        },
      },
    },
  );
}
