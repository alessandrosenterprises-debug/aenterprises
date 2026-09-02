import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: customer, error } = await supabase
      .from("customers")
      .select(`
        id,
        customer_code,
        full_name,
        phone,
        email,
        national_id,
        address,
        auth_user_id
      `)
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Customer lookup error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
      customer_id: customer.id,
    });
  } catch (error) {
    console.error("Customer profile GET error:", error);

    return NextResponse.json(
      { error: "Unable to load customer profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const firstName =
      typeof body.firstName === "string"
        ? body.firstName.trim()
        : "";

    const lastName =
      typeof body.lastName === "string"
        ? body.lastName.trim()
        : "";

    const displayName =
      typeof body.displayName === "string"
        ? body.displayName.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const { data, error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        display_name:
          displayName ||
          [firstName, lastName]
            .filter(Boolean)
            .join(" ") ||
          null,
        phone: phone || null,
      })
      .eq("auth_user_id", user.id)
      .select(
        "first_name, last_name, display_name, email, phone, avatar_url"
      )
      .single();

    if (error) {
      console.error("Customer profile update error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: data,
    });
  } catch (error) {
    console.error("Customer profile API error:", error);

    return NextResponse.json(
      { error: "Unable to update profile." },
      { status: 500 }
    );
  }
}