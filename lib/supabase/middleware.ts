import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              request.cookies.set(
                name,
                value
              );

              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  /*
   * IMPORTANT:
   *
   * getUser() validates the current Supabase
   * session and refreshes the authentication
   * cookies when necessary.
   *
   * Do not remove this call.
   */
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/access-denied") {
    if (user) {
      const { getDashboardPermission } = await import("@/lib/navigation/route-permissions");
      const requiredPermission = getDashboardPermission(pathname);
      const { data: allowed, error } = await supabase.rpc("has_permission", {
        required_permission: requiredPermission,
      });
      // Let existing deployments keep working until the access-control migration is applied.
      if (!error && allowed === false) {
        const destination = request.nextUrl.clone();
        destination.pathname = "/dashboard/access-denied";
        destination.search = "";
        const deniedResponse = NextResponse.redirect(destination);
        response.cookies.getAll().forEach((cookie) => deniedResponse.cookies.set(cookie));
        return deniedResponse;
      }
    }
  }

  return response;
}
