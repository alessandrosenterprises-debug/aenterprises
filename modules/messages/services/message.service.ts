import { createClient } from "@/lib/supabase/server";

export type MessageStatus =
  | "Unread"
  | "Read"
  | "Replied"
  | "Archived";

export type MessagePriority =
  | "Low"
  | "Normal"
  | "High"
  | "Urgent";

export interface Message {
  id: string;

  business_id: string | null;
  customer_id: string | null;
  assigned_to: string | null;
  parent_message_id: string | null;

  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;

  subject: string | null;
  body: string;

  source: string;
  status: MessageStatus;
  priority: MessagePriority;

  created_at: string;
  read_at: string | null;
  replied_at: string | null;
  archived_at: string | null;
  updated_at: string;

  businesses?: {
    id: string;
    name: string;
  }[] | null;

  customers?: {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
  }[] | null;
}

export async function getMessages(): Promise<Message[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      business_id,
      customer_id,
      assigned_to,
      parent_message_id,
      sender_name,
      sender_email,
      sender_phone,
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
      "Messages query error:",
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  return (data ?? []) as unknown as Message[];
}

export async function getMessageStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("status");

  if (error) {
    console.error(
      "Message statistics error:",
      JSON.stringify(error, null, 2)
    );

    return {
      total: 0,
      unread: 0,
      read: 0,
      replied: 0,
      archived: 0,
    };
  }

  const messages = data ?? [];

  return {
    total: messages.length,

    unread: messages.filter(
      (message) => message.status === "Unread"
    ).length,

    read: messages.filter(
      (message) => message.status === "Read"
    ).length,

    replied: messages.filter(
      (message) => message.status === "Replied"
    ).length,

    archived: messages.filter(
      (message) => message.status === "Archived"
    ).length,
  };
}