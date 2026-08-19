import "server-only";

import { createClient } from "@/lib/supabase/server";

import {
  getInboxMessages,
} from "@/modules/emails/services/gmail.server";

export async function syncInboxEmails() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized.");
  }

  const messages = await getInboxMessages(50);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const message of messages) {
    /*
     * Check whether this exact Gmail message
     * has already been imported.
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
     * Determine the parent using the Gmail thread.
     *
     * We intentionally do NOT use:
     * rfc_message_id
     * in_reply_to
     * references
     *
     * because those columns are not currently
     * required by the emails table.
     */
    let parentEmailId: string | null = null;

    if (message.gmail_thread_id) {
      const {
        data: threadMessages,
        error: threadLookupError,
      } = await supabase
        .from("emails")
        .select(
          "id, created_at"
        )
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
        .limit(1);

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
          threadMessages?.[0]?.id ??
          null;
      }
    }

    /*
     * Convert Gmail's Date header into
     * a valid Supabase timestamp.
     */
    const createdAt =
      message.date &&
      !Number.isNaN(
        Date.parse(message.date)
      )
        ? new Date(
            message.date
          ).toISOString()
        : new Date().toISOString();

    /*
     * Insert the incoming Gmail message.
     */
    const {
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

        cc: message.cc,

        bcc: message.bcc,

        subject:
          message.subject,

        body:
          message.body,

        source: "Incoming",

        status: "Unread",

        priority: "Normal",

        created_at:
          createdAt,

        gmail_message_id:
          message.gmail_message_id,

        gmail_thread_id:
          message.gmail_thread_id,

        gmail_message_date:
          createdAt,
      });

    if (insertError) {
      /*
       * 23505 = duplicate key.
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
     * If this Gmail message belongs to an
     * existing OS conversation, mark the
     * previous message as replied.
     */
    if (parentEmailId) {
      const {
        error: updateError,
      } = await supabase
        .from("emails")
        .update({
          status: "Replied",

          replied_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          parentEmailId
        );

      if (updateError) {
        console.error(
          "Unable to update parent email:",
          JSON.stringify(
            updateError,
            null,
            2
          )
        );
      }
    }

    imported++;
  }

  return {
    success: true,

    checked:
      messages.length,

    imported,

    skipped,

    failed,
  };
}