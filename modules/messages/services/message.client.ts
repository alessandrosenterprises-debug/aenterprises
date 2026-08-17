import { supabase } from "@/lib/supabase/client";

export interface CreateMessagePayload {
  business_id?: string | null;
  customer_id?: string | null;
  assigned_to?: string | null;
  parent_message_id?: string | null;

  sender_name: string;
  sender_email?: string | null;
  sender_phone?: string | null;

  subject?: string | null;
  body: string;

  source?: string;
  status?: "Unread" | "Read" | "Replied" | "Archived";
  priority?: "Low" | "Normal" | "High" | "Urgent";
}

export async function createMessage(
  message: CreateMessagePayload
) {
  const { data, error } = await supabase
    .from("messages")
    .insert(message)
    .select()
    .single();

  if (error) {
    console.error(
      "Create Message Error:",
      error
    );

    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${error.message}`
    );
  }

  return data;
}

export async function updateMessage(
  id: string,
  message: Partial<CreateMessagePayload>
) {
  const { data, error } = await supabase
    .from("messages")
    .update(message)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Update Message Error:",
      error
    );

    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${error.message}`
    );
  }

  return data;
}

export async function markMessageAsRead(
  id: string
) {
  const { data, error } = await supabase
    .from("messages")
    .update({
      status: "Read",
      read_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Mark Message Read Error:",
      error
    );

    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${error.message}`
    );
  }

  return data;
}

export async function archiveMessage(
  id: string
) {
  const { data, error } = await supabase
    .from("messages")
    .update({
      status: "Archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Archive Message Error:",
      error
    );

    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${error.message}`
    );
  }

  return data;
}

export async function deleteMessage(
  id: string
) {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Delete Message Error:",
      error
    );

    throw new Error(
      `${error.code ?? "UNKNOWN"}: ${error.message}`
    );
  }

  return true;
}