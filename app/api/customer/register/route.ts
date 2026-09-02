import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequest;

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const password = body.password;

    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json(
        {
          error: "Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    /*
     * Check whether this email is already registered
     * as a customer before creating another account.
     */
    const { data: existingCustomer, error: customerLookupError } =
      await supabase
        .from("customers")
        .select("id, auth_user_id")
        .ilike("email", email)
        .maybeSingle();

    if (customerLookupError) {
      console.error(
        "Customer lookup error:",
        customerLookupError
      );

      return NextResponse.json(
        {
          error: "Unable to verify the customer account.",
        },
        { status: 500 }
      );
    }

    if (existingCustomer?.auth_user_id) {
      return NextResponse.json(
        {
          error: "A customer account with this email already exists.",
        },
        { status: 409 }
      );
    }

    /*
     * Create the Supabase Auth account.
     */
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        phone,
      },
    });

    if (authError || !authData.user) {
      console.error("Customer auth creation error:", authError);

      return NextResponse.json(
        {
          error:
            authError?.message ||
            "Unable to create your customer account.",
        },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    /*
     * Create the customer profile.
     */
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        auth_user_id: userId,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        email,
        phone,
        active: true,
      });

    if (profileError) {
      console.error(
        "Customer profile creation error:",
        profileError
      );

      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          error:
            "Your account could not be completed. Please try again.",
        },
        { status: 500 }
      );
    }

    /*
     * Assign the Customer Portal User role.
     */
    const CUSTOMER_ROLE_ID =
      "f3c1f022-f4da-4b0a-93f5-fef222ba144d";

    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role_id: CUSTOMER_ROLE_ID,
      });

    if (roleError) {
      console.error(
        "Customer role assignment error:",
        roleError
      );

      await supabase
        .from("profiles")
        .delete()
        .eq("auth_user_id", userId);

      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          error:
            "Your customer access could not be configured. Please try again.",
        },
        { status: 500 }
      );
    }

    /*
     * Create the customer record.
     *
     * business_id intentionally remains NULL because
     * the account belongs to Alessandro Enterprises,
     * not to one specific business.
     */
    const { data: customer, error: customerError } =
      await supabase
        .from("customers")
        .insert({
          auth_user_id: userId,
          full_name: `${firstName} ${lastName}`,
          phone,
          email,
          business_id: null,
          status: "Active",
          is_active: true,
        })
        .select("id")
        .single();

    if (customerError) {
      console.error(
        "Customer record creation error:",
        customerError
      );

      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      await supabase
        .from("profiles")
        .delete()
        .eq("auth_user_id", userId);

      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          error:
            "Your customer profile could not be created. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        customerId: customer.id,
        userId,
        message: "Customer account created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Customer registration error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating your account.",
      },
      { status: 500 }
    );
  }
}