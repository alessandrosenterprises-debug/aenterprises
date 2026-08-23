import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  getInboxMessages,
} from "@/modules/emails/services/gmail.server";

export async function POST() {
  try {
    const supabase = await createClient();

    /*
     * ---------------------------------------------------------
     * 1. GET CURRENT USER
     * ---------------------------------------------------------
     */

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

    const {
  data: profile,
  error: profileError,
} = await supabase
  .from("profiles")
  .select("id")
  .eq("auth_user_id", user.id)
  .maybeSingle();

if (profileError) {
  console.error(
    "Unable to load user profile:",
    JSON.stringify(profileError, null, 2)
  );

  return NextResponse.json(
    {
      error: "Unable to load user profile.",
    },
    {
      status: 500,
    }
  );
}

if (!profile) {
  return NextResponse.json(
    {
      error:
        "Your authenticated account does not have a profile record.",
    },
    {
      status: 403,
    }
  );
}

const profileId = profile.id;

    /*
     * ---------------------------------------------------------
     * 2. GET GMAIL INBOX
     * ---------------------------------------------------------
     */

    const messages = await getInboxMessages(50);

    let imported = 0;
    let skipped = 0;
    let notificationsCreated = 0;
    let notificationsSkipped = 0;
    let failed = 0;

    /*
     * ---------------------------------------------------------
     * 3. PROCESS EACH GMAIL MESSAGE
     * ---------------------------------------------------------
     */

    for (const message of messages) {
      /*
       * -------------------------------------------------------
       * 3A. CHECK WHETHER EMAIL ALREADY EXISTS
       * -------------------------------------------------------
       */

      const {
        data: existingEmail,
        error: lookupError,
      } = await supabase
        .from("emails")
        .select("id")
        .eq(
          "gmail_message_id",
          message.gmail_message_id
        )
        .maybeSingle();

      if (lookupError) {
        console.error(
          "Gmail duplicate lookup failed:",
          JSON.stringify(
            lookupError,
            null,
            2
          )
        );

        failed++;
        continue;
      }

      /*
       * -------------------------------------------------------
       * 3B. IF EMAIL ALREADY EXISTS
       * -------------------------------------------------------
       *
       * The email itself must not be duplicated.
       *
       * However, we still check whether its notification
       * exists. This repairs emails that were imported before
       * notification support was added.
       */

      if (existingEmail) {
        skipped++;

        const {
          data: existingNotification,
          error: notificationLookupError,
        } = await supabase
          .from("notifications")
          .select("id")
          .eq(
            "source_id",
            message.gmail_message_id
          )
          .maybeSingle();

        if (notificationLookupError) {
          console.error(
            "Notification lookup failed:",
            JSON.stringify(
              notificationLookupError,
              null,
              2
            )
          );

          continue;
        }

        /*
         * Notification already exists.
         */

        if (existingNotification) {
          notificationsSkipped++;
          continue;
        }

        /*
         * No notification exists for this imported email.
         * Create the missing notification.
         */

        const notificationPreview =
          message.body
            ?.replace(/\s+/g, " ")
            .trim()
            .slice(0, 120) ||
          message.subject ||
          "New email received.";

        const {
          error: existingEmailNotificationError,
        } = await supabase
          .from("notifications")
          .insert({
            user_id:
  profileId,

            source_id:
              message.gmail_message_id,

            type:
              "message",

            title:
              "New Customer Email",

            sender:
              message.sender_name ||
              message.sender_email,

            preview:
              notificationPreview,

            message:
              message.body ||
              "You received a new email.",

            subject:
              message.subject ||
              null,

            action_url:
              "/dashboard/emails",

            unread:
              true,

            is_read:
              false,

            created_at:
              message.date &&
              !Number.isNaN(
                Date.parse(
                  message.date
                )
              )
                ? new Date(
                    message.date
                  ).toISOString()
                : new Date().toISOString(),

            updated_at:
              new Date().toISOString(),
          });

        if (
          existingEmailNotificationError
        ) {
          /*
           * A unique conflict means another request
           * created the notification at the same time.
           */

          if (
            existingEmailNotificationError.code ===
            "23505"
          ) {
            notificationsSkipped++;
          } else {
            console.error(
              "Failed to create missing email notification:",
              JSON.stringify(
                existingEmailNotificationError,
                null,
                2
              )
            );
          }
        } else {
          notificationsCreated++;
        }

        continue;
      }

      /*
       * -------------------------------------------------------
       * 3C. FIND PARENT EMAIL
       * -------------------------------------------------------
       */

      let parentEmailId:
        | string
        | null = null;

      const references = [
        message.in_reply_to,

        ...(message.references
          ? message.references.split(/\s+/)
          : []),
      ]
        .filter(
          (
            value
          ): value is string =>
            typeof value ===
              "string" &&
            value.trim().length > 0
        )
        .map(
          (value) =>
            value.trim()
        );

      /*
       * -------------------------------------------------------
       * 3D. MATCH USING RFC MESSAGE-ID
       * -------------------------------------------------------
       */

      for (const reference of references) {
        const {
          data: candidate,
          error:
            parentLookupError,
        } = await supabase
          .from("emails")
          .select("id")
          .eq(
            "rfc_message_id",
            reference
          )
          .maybeSingle();

        if (parentLookupError) {
          console.error(
            "Email parent lookup failed:",
            JSON.stringify(
              parentLookupError,
              null,
              2
            )
          );

          continue;
        }

        if (candidate) {
          parentEmailId =
            candidate.id;

          break;
        }
      }

      /*
       * -------------------------------------------------------
       * 3E. FALL BACK TO GMAIL THREAD
       * -------------------------------------------------------
       */

      if (
        !parentEmailId &&
        message.gmail_thread_id
      ) {
        const {
          data: threadMessage,
          error:
            threadLookupError,
        } = await supabase
          .from("emails")
          .select("id")
          .eq(
            "gmail_thread_id",
            message.gmail_thread_id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

        if (threadLookupError) {
          console.error(
            "Gmail thread lookup failed:",
            JSON.stringify(
              threadLookupError,
              null,
              2
            )
          );
        } else {
          parentEmailId =
            threadMessage?.id ??
            null;
        }
      }

      /*
       * -------------------------------------------------------
       * 3F. CREATE VALID TIMESTAMP
       * -------------------------------------------------------
       */

      const createdAt =
        message.date &&
        !Number.isNaN(
          Date.parse(
            message.date
          )
        )
          ? new Date(
              message.date
            ).toISOString()
          : new Date().toISOString();

      /*
       * -------------------------------------------------------
       * 3G. INSERT EMAIL
       * -------------------------------------------------------
       */

      const {
        data: insertedEmail,
        error: insertError,
      } = await supabase
        .from("emails")
        .insert({
          business_id:
            null,

          customer_id:
            null,

          assigned_to:
            null,

          parent_email_id:
            parentEmailId,

          sender_name:
            message.sender_name,

          sender_email:
            message.sender_email,

          recipient_email:
            message.recipient_email,

          cc:
            message.cc,

          bcc:
            message.bcc,

          subject:
            message.subject,

          body:
            message.body,

          source:
            "Incoming",

          status:
            "Unread",

          priority:
            "Normal",

          created_at:
            createdAt,

          gmail_message_id:
            message.gmail_message_id,

          gmail_thread_id:
            message.gmail_thread_id,

          gmail_message_date:
            createdAt,

          rfc_message_id:
            message.message_id,

          in_reply_to:
            message.in_reply_to,

          email_references:
            message.references,
        })
        .select("id")
        .single();

      /*
       * -------------------------------------------------------
       * 3H. HANDLE EMAIL INSERT ERROR
       * -------------------------------------------------------
       */

      if (insertError) {
        if (
          insertError.code ===
          "23505"
        ) {
          skipped++;
        } else {
          console.error(
            "Gmail message insert failed:",
            JSON.stringify(
              insertError,
              null,
              2
            )
          );

          failed++;
        }

        continue;
      }

      /*
       * -------------------------------------------------------
       * 3I. CREATE NOTIFICATION FOR NEW EMAIL
       * -------------------------------------------------------
       */

      const notificationPreview =
        message.body
          ?.replace(/\s+/g, " ")
          .trim()
          .slice(0, 120) ||
        message.subject ||
        "New email received.";

      const {
        error:
          newEmailNotificationError,
      } = await supabase
        .from("notifications")
        .insert({
          user_id:
  profileId,

          source_id:
            message.gmail_message_id,

          type:
            "message",

          title:
            "New Customer Email",

          sender:
            message.sender_name ||
            message.sender_email,

          preview:
            notificationPreview,

          message:
            message.body ||
            "You received a new email.",

          subject:
            message.subject ||
            null,

          action_url:
            "/dashboard/emails",

          unread:
            true,

          is_read:
            false,

          created_at:
            createdAt,

          updated_at:
            new Date().toISOString(),
        });

      if (
        newEmailNotificationError
      ) {
        if (
          newEmailNotificationError.code ===
          "23505"
        ) {
          notificationsSkipped++;
        } else {
          console.error(
            "Failed to create email notification:",
            JSON.stringify(
              newEmailNotificationError,
              null,
              2
            )
          );
        }
      } else {
        notificationsCreated++;
      }

      /*
       * -------------------------------------------------------
       * 3J. UPDATE PARENT EMAIL IF THIS IS A REPLY
       * -------------------------------------------------------
       */

      if (parentEmailId) {
        const {
          error:
            parentUpdateError,
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
            parentEmailId
          );

        if (parentUpdateError) {
          console.error(
            "Unable to update parent email:",
            JSON.stringify(
              parentUpdateError,
              null,
              2
            )
          );
        }
      }

      /*
       * -------------------------------------------------------
       * 3K. COUNT SUCCESSFUL IMPORT
       * -------------------------------------------------------
       */

      imported++;

      console.log(
        `Imported Gmail email ${insertedEmail.id}` +
          (
            parentEmailId
              ? ` as reply to ${parentEmailId}`
              : ""
          )
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. RETURN SYNC RESULT
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success:
        true,

      checked:
        messages.length,

      imported,

      skipped,

      notificationsCreated,

      notificationsSkipped,

      failed,
    });
  } catch (error) {
    /*
     * ---------------------------------------------------------
     * 5. UNEXPECTED ERROR
     * ---------------------------------------------------------
     */

    console.error(
      "Gmail sync error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to synchronize Gmail.",
      },
      {
        status: 500,
      }
    );
  }
}