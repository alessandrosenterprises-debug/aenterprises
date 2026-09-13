import { createClient } from "@/lib/supabase/server";

export interface CustomerPreferences {
  id: string;
  customer_id: string;

  email_notifications: boolean;
  push_notifications: boolean;
  booking_reminders: boolean;
  message_notifications: boolean;
  promotional_notifications: boolean;

  language: string;
  appearance: "system" | "light" | "dark";

  created_at: string;
  updated_at: string;
}

export type CustomerPreferencesUpdate = Partial<
  Pick<
    CustomerPreferences,
    | "email_notifications"
    | "push_notifications"
    | "booking_reminders"
    | "message_notifications"
    | "promotional_notifications"
    | "language"
    | "appearance"
  >
>;

const DEFAULT_PREFERENCES: Omit<
  CustomerPreferences,
  "id" | "customer_id" | "created_at" | "updated_at"
> = {
  email_notifications: true,
  push_notifications: true,
  booking_reminders: true,
  message_notifications: true,
  promotional_notifications: false,
  language: "en",
  appearance: "system",
};

async function getAuthenticatedCustomer() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error("Auth session missing!");
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (!customer) {
    throw new Error("Customer profile not found.");
  }

  return customer;
}

/**
 * Gets the current customer's preferences.
 *
 * If the visitor is not authenticated or does not yet have
 * a customer profile, return safe defaults instead of crashing
 * the customer layout.
 */
export async function getCustomerPreferences(): Promise<CustomerPreferences> {
  const supabase = await createClient();

  try {
    const customer = await getAuthenticatedCustomer();

    const { data, error } = await supabase
      .from("customer_preferences")
      .select("*")
      .eq("customer_id", customer.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return data as CustomerPreferences;
    }

    const { data: created, error: createError } = await supabase
      .from("customer_preferences")
      .insert({
        customer_id: customer.id,
        ...DEFAULT_PREFERENCES,
      })
      .select("*")
      .single();

    if (createError) {
      throw new Error(createError.message);
    }

    return created as CustomerPreferences;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    /**
     * These are expected situations for public customer routes
     * such as /customer/login and /customer/register.
     */
    if (
      message === "Auth session missing!" ||
      message === "Customer profile not found."
    ) {
      return {
        id: "",
        customer_id: "",
        ...DEFAULT_PREFERENCES,
        created_at: "",
        updated_at: "",
      };
    }

    console.error("Customer preferences unavailable:", error);

    return {
      id: "",
      customer_id: "",
      ...DEFAULT_PREFERENCES,
      created_at: "",
      updated_at: "",
    };
  }
}

/**
 * Updates preferences.
 *
 * Unlike the read function above, this function requires
 * an authenticated customer.
 */
export async function updateCustomerPreferences(
  updates: CustomerPreferencesUpdate
): Promise<CustomerPreferences> {
  const supabase = await createClient();
  const customer = await getAuthenticatedCustomer();

  const allowedUpdates: CustomerPreferencesUpdate = {};

  if (updates.email_notifications !== undefined) {
    allowedUpdates.email_notifications = updates.email_notifications;
  }

  if (updates.push_notifications !== undefined) {
    allowedUpdates.push_notifications = updates.push_notifications;
  }

  if (updates.booking_reminders !== undefined) {
    allowedUpdates.booking_reminders = updates.booking_reminders;
  }

  if (updates.message_notifications !== undefined) {
    allowedUpdates.message_notifications =
      updates.message_notifications;
  }

  if (updates.promotional_notifications !== undefined) {
    allowedUpdates.promotional_notifications =
      updates.promotional_notifications;
  }

  if (updates.language !== undefined) {
    allowedUpdates.language = updates.language;
  }

  if (updates.appearance !== undefined) {
    allowedUpdates.appearance = updates.appearance;
  }

  const { data, error } = await supabase
    .from("customer_preferences")
    .upsert(
      {
        customer_id: customer.id,
        ...allowedUpdates,
      },
      {
        onConflict: "customer_id",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CustomerPreferences;
}