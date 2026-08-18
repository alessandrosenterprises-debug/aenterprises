"use client";

import { supabase } from "@/lib/supabase/client";

export interface CreateEmailPayload {
  business_id?: string | null;
  customer_id?: string | null;
  assigned_to?: string | null;
  parent_email_id?: string | null;

  sender_name: string;
  sender_email: string;

  recipient_email?: string | null;

  cc?: string | null;
  bcc?: string | null;

  subject?: string | null;
  body: string;

  source?: string;

  status?:
    | "Unread"
    | "Read"
    | "Replied"
    | "Archived";

  priority?:
    | "Low"
    | "Normal"
    | "High"
    | "Urgent";
}

export async function markEmailAsRead(
  id: string
) {
  const { data, error } = await supabase
    .from("emails")
    .update({
      status: "Read",
      read_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${error.message}`
    );
  }

  return data;
}

export async function archiveEmail(
  id: string
) {
  const { data, error } = await supabase
    .from("emails")
    .update({
      status: "Archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${error.message}`
    );
  }

  return data;
}

export async function deleteEmail(
  id: string
) {
  const { error } = await supabase
    .from("emails")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${error.message}`
    );
  }

  return true;
}

export interface SendEmailPayload {
  businessId?: string | null;
  customerId?: string | null;
  assignedTo?: string | null;
  parentEmailId?: string | null;

  to: string;
  cc?: string;
  bcc?: string;

  subject?: string;
  body: string;
}

export async function sendEmail(
  payload: SendEmailPayload
) {
  const response = await fetch(
  "/api/send",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ||
        "Unable to send email."
    );
  }

  return result;
}