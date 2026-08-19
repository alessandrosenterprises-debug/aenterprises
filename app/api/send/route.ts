import { NextResponse } from "next/server";

import {
  emailAddress,
  sendServerEmail,
} from "@/modules/emails/services/email.server";

import { createClient } from "@/lib/supabase/server";

type EmailAction =
  | "compose"
  | "reply"
  | "forward"
  | "resend";

interface SendEmailRequest {
  emailId?: string;

  action?: EmailAction;

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

function parseRecipients(
  value?: string
) {
  if (!value) {
    return undefined;
  }

  const recipients = value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  return recipients.length > 0
    ? recipients
    : undefined;
}

function getAction(
  payload: SendEmailRequest
): EmailAction {
  if (payload.action) {
    return payload.action;
  }

  /*
   * Backwards compatibility:
   *
   * Existing replies already send parentEmailId,
   * so treat those as replies.
   *
   * Normal compose messages remain compose.
   */
  if (payload.parentEmailId) {
    return "reply";
  }

  return "compose";
}

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createClient();

    /*
     * ---------------------------------------------------------
     * AUTHENTICATION
     * ---------------------------------------------------------
     */

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

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

    /*
     * ---------------------------------------------------------
     * REQUEST
     * ---------------------------------------------------------
     */

    const payload =
      (await request.json()) as SendEmailRequest;

    const action =
      getAction(payload);

    /*
     * ---------------------------------------------------------
     * VALIDATION
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * EMAIL DATA
     * ---------------------------------------------------------
     */

    const subject =
      payload.subject?.trim() ||
      "Message from Alessandro Enterprises";

    const cc =
      parseRecipients(
        payload.cc
      );

    const bcc =
      parseRecipients(
        payload.bcc
      );

    /*
     * ---------------------------------------------------------
     * SEND THROUGH GMAIL
     * ---------------------------------------------------------
     */

    const result =
      await sendServerEmail({
        to: payload.to.trim(),

        cc,

        bcc,

        subject,

        text:
          payload.body.trim(),
      });

    /*
     * ---------------------------------------------------------
     * DETERMINE DATABASE STATUS
     * ---------------------------------------------------------
     *
     * Compose  -> Sent
     * Reply    -> Replied
     * Forward  -> Sent
     * Resend   -> Sent
     */

    const isReply =
      action === "reply" &&
      Boolean(
        payload.parentEmailId
      );

    const status =
      isReply
        ? "Replied"
        : "Sent";

    /*
     * ---------------------------------------------------------
     * SAVE OUTGOING EMAIL
     * ---------------------------------------------------------
     */

    const {
      data: savedEmail,
      error,
    } = await supabase
      .from("emails")
      .insert({
        business_id:
          payload.businessId ??
          null,

        customer_id:
          payload.customerId ??
          null,

        assigned_to:
          payload.assignedTo ??
          null,

        /*
         * Only replies belong directly to
         * the selected parent email.
         *
         * Forward and resend are standalone
         * outgoing messages unless the client
         * explicitly provides a parent.
         */
        parent_email_id:
          payload.parentEmailId ??
          null,

        sender_name:
          "Alessandro Enterprises",

        sender_email:
          emailAddress,

        recipient_email:
          payload.to.trim(),

        cc:
          payload.cc?.trim() ||
          null,

        bcc:
          payload.bcc?.trim() ||
          null,

        subject,

        body:
          payload.body.trim(),

        source:
          "Outgoing",

        status,

        priority:
          "Normal",

        /*
         * Only replies should receive
         * replied_at.
         *
         * Compose, forward and resend
         * are simply Sent.
         */
        replied_at:
          isReply
            ? new Date().toISOString()
            : null,
      })
      .select()
      .single();

    /*
     * ---------------------------------------------------------
     * DATABASE SAVE FAILURE
     * ---------------------------------------------------------
     *
     * Gmail already accepted the message.
     */

    if (error) {
      console.error(
        "Saving outbound email failed:",
        error
      );

      return NextResponse.json({
        success: true,

        warning:
          "Email was sent, but the conversation record could not be saved.",

        messageId:
          result.messageId ??
          null,

        action,

        status,
      });
    }

    /*
     * ---------------------------------------------------------
     * UPDATE ORIGINAL EMAIL FOR REPLIES
     * ---------------------------------------------------------
     */

    if (isReply) {
      const {
        error:
          updateError,
      } = await supabase
        .from("emails")
        .update({
          status:
            "Replied",

          replied_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          payload.parentEmailId!
        );

      if (updateError) {
        console.error(
          "Unable to update original email:",
          updateError
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * RESPONSE
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      email:
        savedEmail,

      messageId:
        result.messageId ??
        null,

      action,

      status,
    });
  } catch (error) {
    console.error(
      "Gmail email send error:",
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