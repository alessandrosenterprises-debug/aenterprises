import { supabase } from "@/lib/supabase/client";

export interface SignInCredentials {
  email: string;
  password: string;
}

class AuthService {
  /**
   * Normal AEOS authentication.
   *
   * Used by:
   * /login
   */
  async signIn({
    email,
    password,
  }: SignInCredentials) {
    const result = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (result.error || !result.data.user) return result;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("active, role_id, roles(name,status)")
      .eq("auth_user_id", result.data.user.id)
      .maybeSingle();
    const role = Array.isArray(profile?.roles) ? profile.roles[0] : profile?.roles;
    // The database permission check is authoritative for Super Administrators.
    // It avoids rejecting them when PostgREST cannot resolve the profile→role join.
    const { data: hasSuperAdminAccess } = await supabase.rpc("has_permission", { required_permission: "access.super_admin" });

    const hasProfileStaffRole = !profileError && profile?.active === true && Boolean(profile.role_id) && role?.name !== undefined && !["Customer", "Customer Portal User"].includes(role.name) && (role.status ?? "Active") === "Active";
    if (!hasProfileStaffRole && !hasSuperAdminAccess) {
      await supabase.auth.signOut();
      return {
        data: { user: null, session: null },
        error: new Error("Staff access is inactive or not configured for this account. Ask an administrator to check the staff profile and role status. Customer accounts should use the Customer Portal."),
      };
    }

    const { data: mayOpenOperations, error: operationsPermissionError } = await supabase.rpc("has_permission", {
      required_permission: "operations.open",
    });
    if ((operationsPermissionError || mayOpenOperations !== true) && !hasSuperAdminAccess) {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") window.sessionStorage.removeItem("aeos_ops_token");
      return {
        data: { user: null, session: null },
        error: new Error("This account is set up for staff PIN access. Ask your department manager to open operations, then sign in with your work email and PIN."),
      };
    }

    return result;
  }

  /**
   * Customer Portal authentication.
   *
   * Used by:
   * /customer/login
   */
  async signInAsCustomer({
    email,
    password,
  }: SignInCredentials) {
    const normalizedEmail = email.trim().toLowerCase();

    /*
     * Authenticate with Supabase Auth.
     */
    const result =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    /*
     * Supabase authentication failed.
     */
    if (result.error || !result.data.user) {
      return result;
    }

    const userId = result.data.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("active, role_id, roles(name)")
      .eq("auth_user_id", userId)
      .maybeSingle();
    const profileRole = Array.isArray(profile?.roles) ? profile.roles[0] : profile?.roles;

    if (profileError) {
      await supabase.auth.signOut();
      return {
        data: { user: null, session: null },
        error: new Error("We could not verify this account for the Customer Portal. Please try again or contact support."),
      };
    }

    if (profile?.active === false || (profile?.role_id && !["Customer", "Customer Portal User"].includes(profileRole?.name ?? ""))) {
      await supabase.auth.signOut();
      return {
        data: { user: null, session: null },
        error: new Error("This is a staff account. Sign in through the Alessandro Enterprises staff portal."),
      };
    }

    /*
     * Verify that this Auth user is linked
     * to a customer record.
     */
    const {
      data: customer,
      error: customerError,
    } = await supabase
      .from("customers")
      .select(
        `
          id,
          auth_user_id,
          full_name,
          email,
          status,
          is_active
        `
      )
      .eq("auth_user_id", userId)
      .maybeSingle();

    /*
     * Customer lookup failed.
     */
    if (customerError) {
      console.error(
        "Customer verification error:",
        customerError
      );

      await supabase.auth.signOut();

      return {
        data: {
          user: null,
          session: null,
        },
        error: new Error(
          "We could not verify your customer account."
        ),
      };
    }

    /*
     * Auth user exists, but there is no
     * corresponding customer record.
     */
    if (!customer) {
      await supabase.auth.signOut();

      return {
        data: {
          user: null,
          session: null,
        },
        error: new Error(
          "This account is not registered as a customer account."
        ),
      };
    }

    /*
     * Customer account must be active.
     */
    if (
      customer.is_active !== true ||
      customer.status?.toLowerCase() !== "active"
    ) {
      await supabase.auth.signOut();

      return {
        data: {
          user: null,
          session: null,
        },
        error: new Error(
          "Your customer account is currently inactive."
        ),
      };
    }

    /*
     * Customer authentication succeeded.
     *
     * We deliberately do not perform a client-side
     * user_roles query here because RLS can prevent
     * the browser from reading that table.
     *
     * The customers.auth_user_id relationship is
     * sufficient to establish Customer Portal access.
     */
    return result;
  }

  async signOut() {
    return await supabase.auth.signOut();
  }

  async getSession() {
    return await supabase.auth.getSession();
  }

  async getUser() {
    return await supabase.auth.getUser();
  }
}

export const authService = new AuthService();
