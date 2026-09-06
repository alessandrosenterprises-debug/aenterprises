import { createClient } from "@/lib/supabase/server";

export type CustomerEmailDirection = "received" | "sent";

export type CustomerEmailRecord = {
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

  status: "Unread" | "Read" | "Replied" | "Sent" | "Archived";
  priority: "Low" | "Normal" | "High" | "Urgent";

  created_at: string;
  read_at: string | null;
  replied_at: string | null;
  archived_at: string | null;
  updated_at: string;

  /**
   * Customer-facing direction.
   *
   * sent     = customer sent the email to AEOS
   * received = AEOS sent the email to the customer
   */
  direction: CustomerEmailDirection;

  businesses?: {
    id: string;
    name: string;
  } | null;
};

type AuthenticatedCustomer = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
};

/**
 * ------------------------------------------------------------
 * EMAIL NORMALIZATION
 * ------------------------------------------------------------
 */
function normalizeEmail(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  const angleMatch = value.match(/<([^>]+)>/);

  const email =
    angleMatch?.[1] ?? value;

  return email
    .trim()
    .toLowerCase();
}

/**
 * ------------------------------------------------------------
 * CUSTOMER-FACING DIRECTION
 * ------------------------------------------------------------
 *
 * Customer perspective:
 *
 * customer -> AEOS = sent
 * AEOS -> customer = received
 */
function getCustomerEmailDirection(
  email: {
    sender_email: string | null;
    recipient_email: string | null;
  },
  customerEmail: string | null
): CustomerEmailDirection {
  const customerAddress =
    normalizeEmail(customerEmail);

  const senderAddress =
    normalizeEmail(email.sender_email);

  const recipientAddress =
    normalizeEmail(email.recipient_email);

  /**
   * Customer is the sender.
   */
  if (
    customerAddress &&
    senderAddress === customerAddress
  ) {
    return "sent";
  }

  /**
   * Customer is the recipient.
   */
  if (
    customerAddress &&
    recipientAddress === customerAddress
  ) {
    return "received";
  }

  /**
   * Older records may not have recipient_email.
   *
   * Since the query is already restricted to this customer,
   * anything not clearly sent by the customer is treated
   * as received.
   */
  return "received";
}

/**
 * ------------------------------------------------------------
 * AUTHENTICATED CUSTOMER
 * ------------------------------------------------------------
 */
async function getAuthenticatedCustomer(): Promise<{
  supabase: Awaited<
    ReturnType<typeof createClient>
  >;
  customer: AuthenticatedCustomer | null;
}> {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(
      "Customer email auth error:",
      JSON.stringify(
        userError,
        null,
        2
      )
    );

    return {
      supabase,
      customer: null,
    };
  }

  if (!user) {
    return {
      supabase,
      customer: null,
    };
  }

  const {
    data: customer,
    error: customerError,
  } = await supabase
    .from("customers")
    .select(
      "id, full_name, email, phone"
    )
    .eq(
      "auth_user_id",
      user.id
    )
    .maybeSingle();

  if (customerError) {
    console.error(
      "Customer email customer lookup error:",
      JSON.stringify(
        customerError,
        null,
        2
      )
    );
  }

  return {
    supabase,
    customer:
      customer ?? null,
  };
}

/**
 * ------------------------------------------------------------
 * EMAIL SELECT
 * ------------------------------------------------------------
 */
const CUSTOMER_EMAIL_SELECT = `
  id,
  business_id,
  customer_id,
  assigned_to,
  parent_email_id,
  gmail_message_id,
  gmail_thread_id,
  gmail_message_date,
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
  businesses (
    id,
    name
  )
`;

/**
 * ------------------------------------------------------------
 * ADD CUSTOMER-FACING DIRECTION
 * ------------------------------------------------------------
 */
function mapCustomerEmail(
  email: any,
  customerEmail: string | null
): CustomerEmailRecord {
  const business =
    Array.isArray(email.businesses)
      ? email.businesses[0] ?? null
      : email.businesses ?? null;

  return {
    ...email,
    businesses: business,
    direction:
      getCustomerEmailDirection(
        {
          sender_email:
            email.sender_email,
          recipient_email:
            email.recipient_email,
        },
        customerEmail
      ),
  } as CustomerEmailRecord;
}

/**
 * ------------------------------------------------------------
 * MARK CUSTOMER EMAIL AS READ
 * ------------------------------------------------------------
 *
 * Only received/unread emails should be changed.
 *
 * Sent emails are never changed to Read because they are
 * already outgoing/customer-sent messages.
 */
export async function markCustomerEmailAsRead(
  emailId: string
): Promise<boolean> {
  const {
    supabase,
    customer,
  } =
    await getAuthenticatedCustomer();

  if (!customer) {
    return false;
  }

  /**
   * First get the email so we can determine whether it is
   * actually a customer-received message.
   */
  const {
    data: email,
    error: emailError,
  } = await supabase
    .from("emails")
    .select(
      `
        id,
        customer_id,
        sender_email,
        recipient_email,
        status
      `
    )
    .eq(
      "id",
      emailId
    )
    .eq(
      "customer_id",
      customer.id
    )
    .maybeSingle();

  if (emailError) {
    console.error(
      "Mark email read lookup error:",
      JSON.stringify(
        emailError,
        null,
        2
      )
    );

    return false;
  }

  if (!email) {
    return false;
  }

  /**
   * Never mark outgoing/customer-sent emails as read.
   */
  const direction =
    getCustomerEmailDirection(
      {
        sender_email:
          email.sender_email,
        recipient_email:
          email.recipient_email,
      },
      customer.email
    );

  if (direction !== "received") {
    return true;
  }

  /**
   * Nothing to do if it is already read/replied/etc.
   */
  if (email.status !== "Unread") {
    return true;
  }

  /**
   * Change Unread -> Read.
   */
  const {
    error: updateError,
  } = await supabase
    .from("emails")
    .update({
      status: "Read",
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq(
      "id",
      emailId
    )
    .eq(
      "customer_id",
      customer.id
    )
    .eq(
      "status",
      "Unread"
    );

  if (updateError) {
    console.error(
      "Mark customer email read update error:",
      JSON.stringify(
        updateError,
        null,
        2
      )
    );

    return false;
  }

  console.log(
    "CUSTOMER EMAIL MARKED READ:",
    {
      emailId,
      customerId: customer.id,
    }
  );

  return true;
}

/**
 * ------------------------------------------------------------
 * GET CUSTOMER EMAILS
 * ------------------------------------------------------------
 */
export async function getCustomerEmails(
  limit = 100
): Promise<CustomerEmailRecord[]> {
  const {
    supabase,
    customer,
  } =
    await getAuthenticatedCustomer();

  if (!customer) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from("emails")
    .select(
      CUSTOMER_EMAIL_SELECT
    )
    .eq(
      "customer_id",
      customer.id
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(limit);

  if (error) {
    console.error(
      "Customer email query error:",
      JSON.stringify(
        error,
        null,
        2
      )
    );

    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((email) =>
    mapCustomerEmail(
      email,
      customer.email
    )
  );
}

/**
 * ------------------------------------------------------------
 * CUSTOMER EMAIL STATS
 * ------------------------------------------------------------
 */
export async function getCustomerEmailStats() {
  const emails =
    await getCustomerEmails(1000);

  const receivedEmails =
    emails.filter(
      (email) =>
        email.direction ===
        "received"
    );

  const sentEmails =
    emails.filter(
      (email) =>
        email.direction ===
        "sent"
    );

  const unreadReceivedEmails =
    receivedEmails.filter(
      (email) =>
        email.status ===
        "Unread"
    );

  return {
    total: emails.length,

    inbox:
      receivedEmails.length,

    unread:
      unreadReceivedEmails.length,

    received:
      receivedEmails.length,

    sent:
      sentEmails.length,
  };
}

/**
 * ------------------------------------------------------------
 * GET SINGLE CUSTOMER EMAIL
 * ------------------------------------------------------------
 */
export async function getCustomerEmailById(
  emailId: string
): Promise<CustomerEmailRecord | null> {
  const {
    supabase,
    customer,
  } =
    await getAuthenticatedCustomer();

  if (!customer) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from("emails")
    .select(
      CUSTOMER_EMAIL_SELECT
    )
    .eq(
      "id",
      emailId
    )
    .eq(
      "customer_id",
      customer.id
    )
    .maybeSingle();

  if (error) {
    console.error(
      "Customer email lookup error:",
      JSON.stringify(
        error,
        null,
        2
      )
    );

    return null;
  }

  if (!data) {
    return null;
  }

  return mapCustomerEmail(
    data,
    customer.email
  );
}

/**
 * ------------------------------------------------------------
 * AUTHENTICATED CUSTOMER ID
 * ------------------------------------------------------------
 */
export async function getAuthenticatedCustomerId(): Promise<
  string | null
> {
  const {
    customer,
  } =
    await getAuthenticatedCustomer();

  return customer?.id ?? null;
}