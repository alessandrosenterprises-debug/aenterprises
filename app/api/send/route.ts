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

type CustomerRecord = {
  id: string;
  full_name: string;
  email: string | null;
};

function normalizeEmail(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  const angleMatch = value.match(/<([^>]+)>/);

  return (
    angleMatch?.[1] ??
    value
  )
    .trim()
    .toLowerCase();
}

function parseRecipients(
  value?: string
): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const recipients = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return recipients.length
    ? recipients
    : undefined;
}

function getAction(
  payload: SendEmailRequest
): EmailAction {
  if (payload.action) {
    return payload.action;
  }

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
     * =========================================================
     * AUTH
     * =========================================================
     */

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    console.log(
      "SEND EMAIL AUTH USER:",
      {
        id: user.id,
        email: user.email,
      }
    );

    /*
     * =========================================================
     * PAYLOAD
     * =========================================================
     */

    const payload =
      (await request.json()) as SendEmailRequest;

    console.log(
      "SEND EMAIL PAYLOAD:",
      {
        action: payload.action,
        emailId: payload.emailId,
        customerId: payload.customerId,
        parentEmailId:
          payload.parentEmailId,
        to: payload.to,
        subject: payload.subject,
      }
    );

    const action =
      getAction(payload);

    /*
     * =========================================================
     * BASIC VALIDATION
     * =========================================================
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
     * =========================================================
     * DETERMINE WHETHER USER IS A CUSTOMER
     * =========================================================
     */

    const {
      data: authenticatedCustomer,
      error: authenticatedCustomerError,
    } = await supabase
      .from("customers")
      .select(
        "id, full_name, email"
      )
      .eq(
        "auth_user_id",
        user.id
      )
      .maybeSingle();

    if (authenticatedCustomerError) {
      console.error(
        "Authenticated customer lookup failed:",
        authenticatedCustomerError
      );

      return NextResponse.json(
        {
          error:
            "Unable to identify the current account.",
        },
        {
          status: 500,
        }
      );
    }

    const isCustomer =
      authenticatedCustomer !== null;

    console.log(
      "SEND EMAIL ACCOUNT TYPE:",
      {
        isCustomer,
        customerId:
          authenticatedCustomer?.id ??
          null,
      }
    );

    /*
     * =========================================================
     * RESOLVE CUSTOMER
     * =========================================================
     */

    let customer:
      | CustomerRecord
      | null =
      authenticatedCustomer ?? null;

    let resolutionMethod:
      | "authenticated_customer"
      | "parent_email"
      | "customer_id"
      | "recipient_email"
      | null =
      isCustomer
        ? "authenticated_customer"
        : null;

    /*
     * =========================================================
     * CUSTOMER SENDING EMAIL
     * =========================================================
     */

    if (isCustomer) {
      if (!authenticatedCustomer) {
        return NextResponse.json(
          {
            error:
              "Customer account could not be identified.",
          },
          {
            status: 404,
          }
        );
      }

      customer =
        authenticatedCustomer;
    }

    /*
     * =========================================================
     * AEOS / ADMIN SENDING EMAIL
     * =========================================================
     */

    if (!isCustomer) {
      /*
       * -------------------------------------------------------
       * 1. PARENT EMAIL
       * -------------------------------------------------------
       *
       * For replies, the parent email is the most reliable
       * source of the customer ID.
       */

      if (payload.parentEmailId) {
        console.log(
          "LOOKING UP PARENT EMAIL:",
          payload.parentEmailId
        );

        const {
          data: parentEmail,
          error: parentEmailError,
        } = await supabase
          .from("emails")
          .select(
            "id, customer_id, recipient_email, sender_email"
          )
          .eq(
            "id",
            payload.parentEmailId
          )
          .maybeSingle();

        if (parentEmailError) {
          console.error(
            "Parent email lookup failed:",
            parentEmailError
          );

          return NextResponse.json(
            {
              error:
                "Unable to load the original email conversation.",
            },
            {
              status: 500,
            }
          );
        }

        console.log(
          "PARENT EMAIL RESULT:",
          parentEmail
        );

        if (parentEmail?.customer_id) {
          const {
            data: parentCustomer,
            error:
              parentCustomerError,
          } = await supabase
            .from("customers")
            .select(
              "id, full_name, email"
            )
            .eq(
              "id",
              parentEmail.customer_id
            )
            .maybeSingle();

          if (parentCustomerError) {
            console.error(
              "Parent customer lookup failed:",
              parentCustomerError
            );

            return NextResponse.json(
              {
                error:
                  "Unable to identify the customer from the original conversation.",
              },
              {
                status: 500,
              }
            );
          }

          if (parentCustomer) {
            customer =
              parentCustomer;

            resolutionMethod =
              "parent_email";
          }
        }
      }

      /*
       * -------------------------------------------------------
       * 2. EXPLICIT CUSTOMER ID
       * -------------------------------------------------------
       */

      if (
        !customer &&
        payload.customerId
      ) {
        console.log(
          "LOOKING UP CUSTOMER BY ID:",
          payload.customerId
        );

        const {
          data: customerById,
          error: customerByIdError,
        } = await supabase
          .from("customers")
          .select(
            "id, full_name, email"
          )
          .eq(
            "id",
            payload.customerId
          )
          .maybeSingle();

        if (customerByIdError) {
          console.error(
            "Customer ID lookup failed:",
            customerByIdError
          );

          return NextResponse.json(
            {
              error:
                "Unable to identify the selected customer.",
            },
            {
              status: 500,
            }
          );
        }

        if (customerById) {
          customer =
            customerById;

          resolutionMethod =
            "customer_id";
        }
      }

      /*
       * -------------------------------------------------------
       * 3. RECIPIENT EMAIL
       * -------------------------------------------------------
       *
       * This is the final fallback for composing a new
       * AEOS email directly to a customer.
       */

      if (!customer) {
        const recipientEmail =
          normalizeEmail(
            payload.to
          );

        console.log(
          "LOOKING UP CUSTOMER BY RECIPIENT:",
          recipientEmail
        );

        if (recipientEmail) {
          const {
            data: customerByEmail,
            error:
              customerByEmailError,
          } = await supabase
            .from("customers")
            .select(
              "id, full_name, email"
            )
            .ilike(
              "email",
              recipientEmail
            )
            .maybeSingle();

          if (customerByEmailError) {
            console.error(
              "Recipient customer lookup failed:",
              customerByEmailError
            );

            return NextResponse.json(
              {
                error:
                  "Unable to identify the recipient customer.",
              },
              {
                status: 500,
              }
            );
          }

          if (customerByEmail) {
            customer =
              customerByEmail;

            resolutionMethod =
              "recipient_email";
          }
        }
      }
    }

    /*
     * =========================================================
     * FINAL CUSTOMER VALIDATION
     * =========================================================
     */

    if (!customer) {
      console.error(
        "CUSTOMER RESOLUTION FAILED:",
        {
          userId: user.id,
          userEmail: user.email,
          action,
          customerId:
            payload.customerId ??
            null,
          parentEmailId:
            payload.parentEmailId ??
            null,
          recipient:
            payload.to,
        }
      );

      return NextResponse.json(
        {
          error:
            "Customer could not be identified.",
          details:
            "For a reply, the original email must contain a customer_id. For a new email, provide customerId or use the customer's email address.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * =========================================================
     * CUSTOMER EMAIL
     * =========================================================
     */

    const customerEmail =
      customer.email
        ?.trim()
        .toLowerCase();

    if (!customerEmail) {
      return NextResponse.json(
        {
          error:
            "The customer account does not have an email address.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "CUSTOMER RESOLVED:",
      {
        customerId:
          customer.id,
        customerName:
          customer.full_name,
        customerEmail,
        resolutionMethod,
      }
    );

    /*
     * =========================================================
     * SENDER
     * =========================================================
     */

    const authenticatedEmail =
      normalizeEmail(
        user.email
      );

    const configuredAeosEmail =
      normalizeEmail(
        emailAddress
      );

    const senderEmail =
      isCustomer
        ? customerEmail
        : configuredAeosEmail ||
          authenticatedEmail;

    if (!senderEmail) {
      return NextResponse.json(
        {
          error:
            "Unable to determine the sender email address.",
        },
        {
          status: 400,
        }
      );
    }

    const senderName =
      isCustomer
        ? customer.full_name
        : "Alessandro Enterprises";

    /*
     * =========================================================
     * RECIPIENT
     * =========================================================
     */

    const recipientEmail =
      payload.to
        .trim()
        .toLowerCase();

    /*
     * =========================================================
     * SEND EMAIL
     * =========================================================
     */

    const cc =
      parseRecipients(
        payload.cc
      );

    const bcc =
      parseRecipients(
        payload.bcc
      );

    const subject =
      payload.subject?.trim() ||
      "Message from Alessandro Enterprises";

    console.log(
      "SENDING EMAIL:",
      {
        senderEmail,
        recipientEmail,
        subject,
        action,
      }
    );

    const result =
      await sendServerEmail({
        to: payload.to.trim(),
        cc,
        bcc,
        subject,
        text: payload.body.trim(),
      });

    /*
     * =========================================================
     * SAVE CONVERSATION
     * =========================================================
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

    const {
      data: savedEmail,
      error: saveError,
    } = await supabase
      .from("emails")
      .insert({
        business_id:
          payload.businessId ??
          null,

        customer_id:
          customer.id,

        assigned_to:
          payload.assignedTo ??
          null,

        parent_email_id:
          payload.parentEmailId ??
          null,

        gmail_message_id:
          result.messageId ??
          null,

        sender_name:
          senderName,

        sender_email:
          senderEmail,

        recipient_email:
          recipientEmail,

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

        replied_at:
          isReply
            ? new Date().toISOString()
            : null,
      })
      .select()
      .single();

    if (saveError) {
      console.error(
        "Saving outbound email failed:",
        saveError
      );

      return NextResponse.json({
        success: true,

        warning:
          "The email was sent successfully, but the conversation record could not be saved.",

        messageId:
          result.messageId ??
          null,

        action,

        status,

        customerId:
          customer.id,
      });
    }

    /*
     * =========================================================
     * UPDATE PARENT EMAIL
     * =========================================================
     */

    if (
      isReply &&
      payload.parentEmailId
    ) {
      const {
        error:
          parentUpdateError,
      } = await supabase
        .from("emails")
        .update({
          status: "Replied",

          replied_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          payload.parentEmailId
        )
        .eq(
          "customer_id",
          customer.id
        );

      if (parentUpdateError) {
        console.error(
          "Unable to update original email:",
          parentUpdateError
        );
      }
    }

    /*
     * =========================================================
     * SUCCESS
     * =========================================================
     */

    console.log(
      "EMAIL SENT SUCCESSFULLY:",
      {
        emailId:
          savedEmail.id,
        customerId:
          customer.id,
        action,
        resolutionMethod,
      }
    );

    return NextResponse.json({
      success: true,

      email:
        savedEmail,

      messageId:
        result.messageId ??
        null,

      action,

      status,

      customerId:
        customer.id,
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