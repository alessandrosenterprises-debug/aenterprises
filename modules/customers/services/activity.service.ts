import { createClient } from "@/lib/supabase/server";

export type CustomerActivityType = "booking" | "loan";

export interface CustomerActivityItem {
  id: string;
  type: CustomerActivityType;
  title: string;
  description: string;
  created_at: string;
  status: string | null;
  href: string | null;
  business_name: string | null;
  amount: number | null;
}

interface AuthenticatedCustomer {
  id: string;
  full_name: string;
  phone: string;
}

async function getAuthenticatedCustomer() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(
      "Customer activity auth error:",
      userError
    );

    return {
      supabase,
      customer: null as AuthenticatedCustomer | null,
    };
  }

  if (!user) {
    return {
      supabase,
      customer: null as AuthenticatedCustomer | null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Customer activity profile lookup error:",
      profileError
    );
  }

  let customer: AuthenticatedCustomer | null = null;

  if (profile?.email) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("email", profile.email)
      .maybeSingle();

    customer = data;
  }

  if (!customer && user.email) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("email", user.email)
      .maybeSingle();

    customer = data;
  }

  if (!customer && profile?.phone) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("phone", profile.phone)
      .maybeSingle();

    customer = data;
  }

  return {
    supabase,
    customer,
  };
}

export async function getCustomerActivity(
  limit = 50
): Promise<CustomerActivityItem[]> {
  const { supabase, customer } =
    await getAuthenticatedCustomer();

  if (!customer) {
    return [];
  }

  const [
    bookingsResult,
    loansResult,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select(`
        id,
        created_at,
        status,
        booking_date,
        booking_time,
        business_id,
        catalog_item_id,

        businesses (
          id,
          name
        ),

        enterprise_catalog (
          id,
          name,
          item_type
        )
      `)
      .eq("customer_id", customer.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(limit),

    supabase
      .from("customer_loan_applications")
      .select(`
        id,
        created_at,
        application_number,
        application_source,
        status,
        requested_amount,
        loan_product_id,

        loan_products (
          id,
          name
        )
      `)
      .eq("customer_id", customer.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(limit),
  ]);

  if (bookingsResult.error) {
    console.error(
      "Customer booking activity error:",
      bookingsResult.error
    );
  }

  if (loansResult.error) {
    console.error(
      "Customer loan activity error:",
      loansResult.error
    );
  }

  const bookingActivity: CustomerActivityItem[] =
    (bookingsResult.data ?? []).map((booking) => {
      const business = Array.isArray(booking.businesses)
        ? booking.businesses[0]
        : booking.businesses;

      const catalogItem = Array.isArray(
        booking.enterprise_catalog
      )
        ? booking.enterprise_catalog[0]
        : booking.enterprise_catalog;

      return {
        id: booking.id,
        type: "booking",
        title: "Booking created",
        description: [
          business?.name ?? "Business",
          catalogItem?.name ?? null,
        ]
          .filter(Boolean)
          .join(" · "),
        created_at: booking.created_at,
        status: booking.status ?? null,
        href: `/customer/bookings/${booking.id}`,
        business_name: business?.name ?? null,
        amount: null,
      };
    });

  const loanActivity: CustomerActivityItem[] =
    (loansResult.data ?? []).map((loan) => {
      const loanProduct = Array.isArray(
        loan.loan_products
      )
        ? loan.loan_products[0]
        : loan.loan_products;

      return {
        id: loan.id,
        type: "loan",
        title: "Loan application submitted",
        description:
          loanProduct?.name ??
          loan.application_number ??
          "Customer loan",
        created_at: loan.created_at,
        status: loan.status ?? null,
        href: null,
        business_name: null,
        amount:
          typeof loan.requested_amount === "number"
            ? loan.requested_amount
            : Number(loan.requested_amount ?? 0),
      };
    });

  return [
    ...bookingActivity,
    ...loanActivity,
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}