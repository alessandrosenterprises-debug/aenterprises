import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  let operatorToken = request.cookies.get("aeos_ops_token")?.value;
  const makeSupabaseClient = (token?: string) => createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: token ? { headers: { "x-aeos-operator-token": token } } : undefined,
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Identify the authenticated account without an operator token first. The
  // token changes the effective AEOS profile to a PIN operator and must not
  // accidentally hide or downgrade a Super Administrator's own session.
  let supabase = makeSupabaseClient();

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
  const isCustomerRoute = pathname.startsWith("/customer");
  const isCustomerArea = isCustomerRoute
    && !pathname.startsWith("/customer/login")
    && !pathname.startsWith("/customer/register");

  let authProfile: { active: boolean | null; role_id: string | null; roles: { name: string; status: string | null } | { name: string; status: string | null }[] | null } | null = null;
  let authProfileError: { message: string } | null = null;
  if (user && (pathname.startsWith("/dashboard") || isCustomerRoute)) {
    const profileResult = await supabase
      .from("profiles")
      .select("active, role_id, roles(name,status)")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    authProfile = profileResult.data;
    authProfileError = profileResult.error;
  }

  // Resolve the administrator identity through the SECURITY DEFINER permission
  // function before applying any staff-PIN operator header. The profile join can
  // fail under a damaged/stale role relationship; that must not invalidate the
  // authenticated Super Administrator session.
  let authHasSuperAdminAccess = false;
  if (user && (pathname.startsWith("/dashboard") || isCustomerRoute)) {
    const { data } = await supabase.rpc("has_permission", { required_permission: "access.super_admin" });
    authHasSuperAdminAccess = data === true;
  }

  const authenticatedRole = Array.isArray(authProfile?.roles) ? authProfile.roles[0] : authProfile?.roles;
  const authenticatedSuperAdmin = authHasSuperAdminAccess || (authProfile?.active === true && authenticatedRole?.name === "Super Administrator" && (authenticatedRole.status ?? "Active") === "Active");
  if (authenticatedSuperAdmin && operatorToken) {
    const refreshedCookies = response.cookies.getAll();
    request.cookies.delete("aeos_ops_token");
    operatorToken = undefined;
    response = NextResponse.next({ request });
    refreshedCookies.forEach((cookie) => response.cookies.set(cookie.name, cookie.value, cookie));
    response.cookies.set("aeos_ops_token", "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
    supabase = makeSupabaseClient();
  } else if (operatorToken) {
    supabase = makeSupabaseClient(operatorToken);
  }

  if (user && (pathname.startsWith("/dashboard") || isCustomerRoute)) {
    const profile = authProfile;
    const profileError = authProfileError;
    const role = Array.isArray(profile?.roles) ? profile.roles[0] : profile?.roles;
    const isCustomerRole = role?.name === "Customer" || role?.name === "Customer Portal User";
    const hasStaffIdentity = !profileError && Boolean(profile?.role_id) && (
      !role?.name || !isCustomerRole
    );
    let hasActiveStaffRole = !profileError && profile?.active === true && Boolean(profile.role_id) && role?.name !== undefined && !isCustomerRole && (role.status ?? "Active") === "Active";
    if (!hasActiveStaffRole) {
      // Use the database's role-aware permission check as a safe fallback for
      // Super Administrators if the embedded profile→role join is unavailable.
      const { data: hasSuperAdminAccess } = authHasSuperAdminAccess
        ? { data: true }
        : await supabase.rpc("has_permission", { required_permission: "access.super_admin" });
      hasActiveStaffRole = Boolean(hasSuperAdminAccess);
    }
    let hasActiveCustomerAccount = false;

    if (isCustomerRoute && !hasActiveStaffRole && !profileError && profile?.active === true && (isCustomerRole || !profile.role_id)) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .ilike("status", "active")
        .maybeSingle();
      hasActiveCustomerAccount = !customerError && Boolean(customer);
    }

    if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/access-denied" && !hasActiveStaffRole) {
      const destination = request.nextUrl.clone();
      destination.pathname = "/login";
      destination.search = "?account=staff-required";
      const deniedResponse = NextResponse.redirect(destination);
      response.cookies.getAll().forEach((cookie) => deniedResponse.cookies.set(cookie));
      return deniedResponse;
    }

    // Staff accounts use their manager's authenticated operations session and
    // their own PIN. Only manager-capable roles may open AEOS directly.
    if (pathname.startsWith("/dashboard") && !operatorToken && hasActiveStaffRole) {
      const { data: mayOpenOperations } = await supabase.rpc("has_permission", { required_permission: "operations.open" });
      if (!mayOpenOperations && !authHasSuperAdminAccess) {
        const destination = request.nextUrl.clone();
        destination.pathname = "/login";
        destination.search = "?account=manager-session-required";
        const deniedResponse = NextResponse.redirect(destination);
        response.cookies.getAll().forEach((cookie) => deniedResponse.cookies.set(cookie));
        return deniedResponse;
      }
    }

    if (isCustomerArea && (hasStaffIdentity || hasActiveStaffRole)) {
      const destination = request.nextUrl.clone();
      destination.pathname = "/customer/login";
      destination.search = "?account=staff-account";
      const deniedResponse = NextResponse.redirect(destination);
      response.cookies.getAll().forEach((cookie) => deniedResponse.cookies.set(cookie));
      return deniedResponse;
    }

    if (isCustomerRoute && hasActiveCustomerAccount) {
      const destination = request.nextUrl.clone();
      destination.pathname = "/customer";
      destination.search = "";
      if (pathname === "/customer/login" || pathname === "/customer/register") {
        const signedInResponse = NextResponse.redirect(destination);
        response.cookies.getAll().forEach((cookie) => signedInResponse.cookies.set(cookie));
        return signedInResponse;
      }
    }

    if (isCustomerArea && !hasActiveCustomerAccount) {
      const destination = request.nextUrl.clone();
      destination.pathname = "/customer/login";
      destination.search = "?account=customer-required";
      const deniedResponse = NextResponse.redirect(destination);
      response.cookies.getAll().forEach((cookie) => deniedResponse.cookies.set(cookie));
      return deniedResponse;
    }
  }

  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/access-denied") {
    if (user) {
      const { getDashboardPermissions } = await import("@/lib/navigation/route-permissions");
      const requiredPermissions = getDashboardPermissions(pathname);
      const results = await Promise.all(requiredPermissions.map((required_permission) => supabase.rpc("has_permission", { required_permission })));
      if (!results.some(({ data, error }) => !error && data === true)) {
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
