import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // ---------------------------------------------------------
    // 1. Identify the logged-in AEOS customer
    // ---------------------------------------------------------
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error:
            "You must be signed in as a customer to submit a consultation request.",
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 2. Read and validate the submitted consultation form
    // ---------------------------------------------------------
    const body = await request.json();

    const {
      name,
      phone,
      email,
      consultationType,
      preferredDate,
      preferredTime,
      subject,
      message,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Please provide your name." },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "Please provide your phone number." },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Please describe what you need help with." },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 3. Find the existing AEOS customer record
    // ---------------------------------------------------------
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, full_name, phone, email")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (customerError) {
      console.error(
        "Technology consultation customer lookup error:",
        customerError
      );

      return NextResponse.json(
        {
          error:
            "We could not verify your customer account. Please try again.",
        },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        {
          error:
            "Your AEOS customer profile could not be found. Please complete your customer profile first.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 4. Find Alessandro Tech Solutions
    //
    // Use the existing business slug instead of a hard-coded UUID.
    // ---------------------------------------------------------
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .eq("slug", "tech-solutions")
      .eq("active", true)
      .maybeSingle();

    if (businessError) {
      console.error(
        "Technology consultation business lookup error:",
        businessError
      );

      return NextResponse.json(
        {
          error:
            "We could not connect this consultation to Alessandro Tech Solutions.",
        },
        { status: 500 }
      );
    }

    if (!business) {
      return NextResponse.json(
        {
          error:
            "Alessandro Tech Solutions is currently unavailable. Please try again later.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 5. Save the consultation request
    //
    // This writes ONLY to:
    // technology_consultation_requests
    //
    // It does NOT create:
    // - bookings
    // - orders
    // - loans
    // - HR loans/advances
    //
    // The request remains a Tech Solutions consultation request
    // until AEOS staff processes it.
    // ---------------------------------------------------------
    const { data: consultation, error: insertError } = await supabase
      .from("technology_consultation_requests")
      .insert({
        customer_id: customer.id,
        business_id: business.id,

        name: name.trim(),

        phone: phone.trim(),

        email:
          email?.trim() ||
          customer.email ||
          user.email ||
          null,

        consultation_type:
          consultationType?.trim() || "general",

        preferred_date:
          preferredDate?.trim() || null,

        preferred_time:
          preferredTime?.trim() || "Any time",

        subject:
          subject?.trim() ||
          "Technology Consultation Request",

        message: message.trim(),

        status: "Pending",
      })
      .select(
        "id, customer_id, business_id, consultation_type, status, created_at"
      )
      .single();

    if (insertError) {
      console.error(
        "Technology consultation insert error:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            "We could not save your consultation request. Please try again.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 6. Success
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,
      consultationId: consultation.id,
      status: consultation.status,
      message:
        "Your technology consultation request has been submitted successfully.",
    });
  } catch (error) {
    console.error(
      "Technology consultation API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing your consultation request.",
      },
      { status: 500 }
    );
  }
}