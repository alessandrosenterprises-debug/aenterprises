import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  getInboxMessages,
} from "@/modules/emails/services/gmail.server";

export async function POST() {
  try {
    const supabase = await createClient();

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

    const messages = await getInboxMessages(50);

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const message of messages) {
      /*
       * ---------------------------------------------------------
       * 1. CHECK IF THIS GMAIL MESSAGE ALREADY EXISTS
       * ---------------------------------------------------------
       */

      const {
        data: existing,
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

      if (existing) {
        skipped++;
        continue;
      }

      /*
       * ---------------------------------------------------------
       * 2. FIND THE PARENT EMAIL
       * ---------------------------------------------------------
       *
       * Gmail replies contain RFC Message-ID values such as:
       *
       * <abc123@gmail.com>
       *
       * These are different from Gmail's API message ID.
       */

      let parentEmailId:
        | string
        | null = null;

      const references = [
        message.in_reply_to,

        ...(message.references
          ? message.references
              .split(/\s+/)
          : []),
      ]
        .filter(
          (
            value
          ): value is string =>
            typeof value ===
              "string" &&
            value.trim()
              .length > 0
        )
        .map(
          (value) =>
            value.trim()
        );

      /*
       * ---------------------------------------------------------
       * 3. MATCH USING RFC MESSAGE-ID
       * ---------------------------------------------------------
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
          /*
           * Do not abort the entire sync because
           * one parent lookup failed.
           */
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
       * ---------------------------------------------------------
       * 4. FALL BACK TO GMAIL THREAD
       * ---------------------------------------------------------
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
       * ---------------------------------------------------------
       * 5. CREATE VALID TIMESTAMP
       * ---------------------------------------------------------
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
       * ---------------------------------------------------------
       * 6. INSERT INCOMING EMAIL
       * ---------------------------------------------------------
       *
       * Incoming Gmail messages always start as Unread.
       */

      const {
        data: insertedEmail,
        error: insertError,
      } = await supabase
        .from("emails")
        .insert({
          business_id: null,

          customer_id: null,

          assigned_to: null,

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

          /*
           * Gmail identifiers.
           */

          gmail_message_id:
            message.gmail_message_id,

          gmail_thread_id:
            message.gmail_thread_id,

          gmail_message_date:
            createdAt,

          /*
           * RFC email identifiers.
           *
           * These allow us to connect Gmail replies
           * to emails already stored in the OS.
           */

          rfc_message_id:
            message.message_id,

          in_reply_to:
            message.in_reply_to,

          email_references:
            message.references,
        })
        .select("id")
        .single();

      if (insertError) {
        /*
         * A duplicate can still happen if two sync
         * requests run at the same time.
         */

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
       * ---------------------------------------------------------
       * 7. IF THIS IS A REPLY, UPDATE THE PARENT
       * ---------------------------------------------------------
       *
       * The newly imported email remains Unread.
       *
       * The previous email becomes Replied.
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

      imported++;

      console.log(
        `Imported Gmail email ${insertedEmail.id}` +
          (parentEmailId
            ? ` as reply to ${parentEmailId}`
            : "")
      );
    }

    /*
     * ---------------------------------------------------------
     * 8. RETURN SYNC RESULT
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      checked:
        messages.length,

      imported,

      skipped,

      failed,
    });
  } catch (error) {
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