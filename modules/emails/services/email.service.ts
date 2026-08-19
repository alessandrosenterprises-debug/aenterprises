import { createClient } from "@/lib/supabase/server";

export type EmailStatus =
  | "Unread"
  | "Read"
  | "Replied"
  | "Sent"
  | "Archived";

export type EmailPriority =
  | "Low"
  | "Normal"
  | "High"
  | "Urgent";

export interface EmailRecord {
  id: string;

  business_id: string | null;
  customer_id: string | null;
  assigned_to: string | null;
  parent_email_id: string | null;

  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  gmail_message_date: string | null;

  sender_name: string;
  sender_email: string;

  recipient_email: string | null;

  cc: string | null;
  bcc: string | null;

  subject: string | null;
  body: string;

  source: string;

  status: EmailStatus;
  priority: EmailPriority;

  created_at: string;

  read_at: string | null;
  replied_at: string | null;
  archived_at: string | null;

  updated_at: string;

  businesses?: {
    id: string;
    name: string;
  } | null;

  customers?: {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
  } | null;
}

export async function getEmails(): Promise<EmailRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("emails")
    .select(`
      id,
      business_id,
      customer_id,
      assigned_to,
      parent_email_id,
      sender_name,
      sender_email,
      recipient_email,
      cc,
      bcc,
      subject,
      body,
      source,
      status,
      priority,
      created_at,
      read_at,
      replied_at,
      archived_at,
      updated_at,
      gmail_message_id,
      gmail_thread_id,
      gmail_message_date,
      businesses (
        id,
        name
      ),
      customers (
        id,
        full_name,
        phone,
        email
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Email query error:",
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  return (data ?? []) as unknown as EmailRecord[];
}

export async function getEmailStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("emails")
    .select("status");

  if (error) {
    console.error(
      "Email statistics error:",
      JSON.stringify(error, null, 2)
    );

    return {
      total: 0,
      unread: 0,
      read: 0,
      replied: 0,
      sent: 0,
      archived: 0,
    };
  }

  const emails = data ?? [];

  return {
    total: emails.length,

    unread: emails.filter(
      (email) => email.status === "Unread"
    ).length,

    read: emails.filter(
      (email) => email.status === "Read"
    ).length,

    replied: emails.filter(
      (email) => email.status === "Replied"
    ).length,

    sent: emails.filter(
      (email) => email.status === "Sent"
    ).length,

    archived: emails.filter(
      (email) => email.status === "Archived"
    ).length,
  };
}