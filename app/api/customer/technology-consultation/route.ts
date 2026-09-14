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
    // 5. Prepare normalized customer information
    // ---------------------------------------------------------
    const senderName =
      customer.full_name?.trim() ||
      name.trim() ||
      "Customer";

    const senderEmail =
      email?.trim() ||
      customer.email?.trim() ||
      user.email ||
      null;

    const senderPhone =
      phone?.trim() ||
      customer.phone?.trim() ||
      null;

    const consultationSubject =
      subject?.trim() ||
      "Technology Consultation Request";

    const consultationTypeValue =
      consultationType?.trim() ||
      "general";

    const preferredDateValue =
      preferredDate?.trim() ||
      null;

    const preferredTimeValue =
      preferredTime?.trim() ||
      "Any time";

    // ---------------------------------------------------------
    // 6. Save the authoritative Tech Solutions consultation
    // ---------------------------------------------------------
    const {
      data: consultation,
      error: insertError,
    } = await supabase
      .from("technology_consultation_requests")
      .insert({
        customer_id: customer.id,
        business_id: business.id,

        name: name.trim(),

        phone: phone.trim(),

        email: senderEmail,

        consultation_type: consultationTypeValue,

        preferred_date: preferredDateValue,

        preferred_time: preferredTimeValue,

        subject: consultationSubject,

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
    // 7. Create the enterprise-wide AEOS message
    //
    // Consultation remains the authoritative Tech Solutions
    // workflow while the message becomes part of the shared
    // enterprise communications system.
    // ---------------------------------------------------------
    const messageBody = [
      "Technology Consultation Request",
      "",
      `Consultation type: ${consultationTypeValue}`,
      `Preferred date: ${
        preferredDateValue || "Not specified"
      }`,
      `Preferred time: ${preferredTimeValue}`,
      "",
      "Customer request:",
      message.trim(),
      "",
      `Consultation ID: ${consultation.id}`,
    ].join("\n");

    const {
      data: createdMessage,
      error: messageError,
    } = await supabase
      .from("messages")
      .insert({
        business_id: business.id,
        customer_id: customer.id,

        sender_name: senderName,

        sender_email: senderEmail,

        sender_phone: senderPhone,

        subject: consultationSubject,

        body: messageBody,

        source:
          "Customer Portal — Technology Consultation",

        status: "Unread",

        priority: "Normal",

        parent_message_id: null,

        assigned_to: null,
      })
      .select(
        `
        id,
        business_id,
        customer_id,
        subject,
        status,
        priority,
        source,
        created_at
      `
      )
      .single();

    if (messageError) {
      console.error(
        "Technology consultation message creation error:",
        messageError
      );

      return NextResponse.json(
        {
          error:
            "Your consultation was saved, but we could not connect it to AEOS Messages. Please contact support.",
          consultationId: consultation.id,
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 8. Create AEOS notification
    //
    // This creates the notification that powers the unread
    // notification count in the AEOS notification center.
    // ---------------------------------------------------------
    const notificationPreview =
      message
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 120) ||
      consultationSubject ||
      "New technology consultation request.";

    const {
      error: notificationError,
    } = await supabase
      .from("notifications")
      .insert({
        user_id: null,

        source_id:
          createdMessage.id,

        type:
          "message",

        title:
          "New Technology Consultation",

        sender:
          senderName,

        preview:
          notificationPreview,

        message:
          messageBody,

        subject:
          consultationSubject,

        action_url:
          "/dashboard/messages",

        unread:
          true,

        is_read:
          false,

        created_at:
          createdMessage.created_at ||
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      });

    if (notificationError) {
      console.error(
        "Technology consultation notification creation error:",
        JSON.stringify(
          notificationError,
          null,
          2
        )
      );

      // The consultation and message are already safely stored.
      // Do not delete them just because notification creation failed.
      return NextResponse.json(
        {
          success: true,

          consultationId:
            consultation.id,

          messageId:
            createdMessage.id,

          status:
            consultation.status,

          notificationCreated:
            false,

          warning:
            "Your consultation was submitted successfully, but the AEOS notification could not be created.",
        }
      );
    }

    // ---------------------------------------------------------
    // 9. Success
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,

      consultationId:
        consultation.id,

      messageId:
        createdMessage.id,

      status:
        consultation.status,

      notificationCreated:
        true,

      message:
        "Your technology consultation request has been submitted successfully and sent to AEOS Messages.",
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