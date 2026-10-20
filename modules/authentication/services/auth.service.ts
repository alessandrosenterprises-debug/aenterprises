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

    if (profileError || profile?.active !== true || !profile.role_id || !role?.name || role.name === "Customer" || (role.status ?? "Active") !== "Active") {
      await supabase.auth.signOut();
      return {
        data: { user: null, session: null },
        error: new Error("This account does not have an active staff role. Sign in through the Customer Portal if you are a customer."),
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

    if (profileError || profile?.active === false || (profile?.role_id && profileRole?.name !== "Customer")) {
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
