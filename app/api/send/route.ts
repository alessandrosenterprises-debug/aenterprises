import { NextResponse } from "next/server";

import {
  emailFrom,
  resend,
} from "@/modules/emails/services/email.server";

import { createClient } from "@/lib/supabase/server";

interface SendEmailRequest {
  emailId?: string;

  businessId?: string | null;
  customerId?: string | null;
  assignedTo?: string | null;

  parentEmailId?: string | null;

  to: string;
  cc?: string;
  bcc?: string;

  subject?: string;
  body: string;

  recipientName?: string;
}

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const payload =
      (await request.json()) as SendEmailRequest;

    if (!payload.to?.trim()) {
      return NextResponse.json(
        {
          error:
            "Recipient email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.body?.trim()) {
      return NextResponse.json(
        {
          error:
            "Email message cannot be empty.",
        },
        {
          status: 400,
        }
      );
    }

    const subject =
      payload.subject?.trim() ||
      "Message from Alessandro Enterprises";

    /*
     * Send through Resend.
     */
    const result =
      await resend.emails.send({
        from: emailFrom,
        to: payload.to.trim(),
        cc: payload.cc
          ? payload.cc
              .split(",")
              .map((email) => email.trim())
              .filter(Boolean)
          : undefined,
        bcc: payload.bcc
          ? payload.bcc
              .split(",")
              .map((email) => email.trim())
              .filter(Boolean)
          : undefined,
        subject,
        text: payload.body.trim(),
      });

    if (result.error) {
      console.error(
        "Resend email error:",
        result.error
      );

      return NextResponse.json(
        {
          error:
            result.error.message ||
            "Unable to send email.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Only save the outbound email AFTER
     * Resend successfully accepts it.
     */
    const { data: savedEmail, error } =
      await supabase
        .from("emails")
        .insert({
          business_id:
            payload.businessId ?? null,

          customer_id:
            payload.customerId ?? null,

          assigned_to:
            payload.assignedTo ?? null,

          parent_email_id:
            payload.parentEmailId ?? null,

          sender_name:
            "Alessandro Enterprises",

          sender_email:
            emailFrom
              .replace(
                /^.*<(.+)>$/,
                "$1"
              )
              .trim(),

          recipient_email:
            payload.to.trim(),

          cc:
            payload.cc?.trim() || null,

          bcc:
            payload.bcc?.trim() || null,

          subject,

          body:
            payload.body.trim(),

          source: "Outgoing",

          status: "Replied",

          priority: "Normal",

          replied_at:
            new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Saving outbound email failed:",
        error
      );

      /*
       * The email WAS sent successfully,
       * so don't report it as an email-send
       * failure to the user.
       */
      return NextResponse.json(
        {
          success: true,
          warning:
            "Email was sent, but the conversation record could not be saved.",
          resendId: result.data?.id ?? null,
        },
        {
          status: 200,
        }
      );
    }

    /*
     * If this was a reply, mark the original
     * conversation as replied.
     */
    if (payload.parentEmailId) {
      const { error: updateError } =
        await supabase
          .from("emails")
          .update({
            status: "Replied",
            replied_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            payload.parentEmailId
          );

      if (updateError) {
        console.error(
          "Unable to update original email:",
          updateError
        );
      }
    }

    return NextResponse.json({
      success: true,
      email: savedEmail,
      resendId:
        result.data?.id ?? null,
    });
  } catch (error) {
    console.error(
      "Email send route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send email.",
      },
      {
        status: 500,
      }
    );
  }
}