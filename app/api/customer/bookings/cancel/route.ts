import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be signed in.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const bookingId = body?.bookingId;

    if (!bookingId) {
      return NextResponse.json(
        {
          error: "Booking ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Find the customer connected to this authenticated user.
     */
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, phone")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    let customerId: string | null = null;

    if (profile?.email) {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", profile.email)
        .maybeSingle();

      customerId = customer?.id ?? null;
    }

    if (!customerId && user.email) {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      customerId = customer?.id ?? null;
    }

    if (!customerId && profile?.phone) {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", profile.phone)
        .maybeSingle();

      customerId = customer?.id ?? null;
    }

    if (!customerId) {
      return NextResponse.json(
        {
          error: "Customer profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Make sure this booking belongs to this customer.
     */
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, customer_id, status")
      .eq("id", bookingId)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (bookingError) {
      console.error(
        "Booking lookup error:",
        bookingError
      );

      return NextResponse.json(
        {
          error: "Unable to find booking.",
        },
        {
          status: 500,
        }
      );
    }

    if (!booking) {
      return NextResponse.json(
        {
          error: "Booking not found.",
        },
        {
          status: 404,
        }
      );
    }

    const currentStatus =
      booking.status?.toLowerCase();

    /*
     * Only pending and confirmed bookings
     * can be cancelled by the customer.
     */
    if (
      currentStatus !== "pending" &&
      currentStatus !== "confirmed"
    ) {
      return NextResponse.json(
        {
          error:
            "This booking can no longer be cancelled.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Update the booking.
     */
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
      })
      .eq("id", bookingId)
      .eq("customer_id", customerId);

    if (updateError) {
      console.error(
        "Booking cancellation error:",
        updateError
      );

      return NextResponse.json(
        {
          error: "Unable to cancel booking.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully.",
    });
  } catch (error) {
    console.error(
      "Cancel booking API error:",
      error
    );

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}