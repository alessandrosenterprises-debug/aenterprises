import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface CreateBookingBody {
  catalog_item_id?: string;
  business_id?: string;
  branch_id?: string | null;
  employee_id?: string | null;
  booking_date?: string;
  booking_time?: string | null;
  notes?: string | null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // =========================================================
    // 1. AUTHENTICATED USER
    // =========================================================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in to make a booking.",
        },
        { status: 401 }
      );
    }

    // =========================================================
    // 2. READ REQUEST BODY
    // =========================================================

    let body: CreateBookingBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const {
      catalog_item_id,
      business_id,
      branch_id = null,
      employee_id = null,
      booking_date,
      booking_time = null,
      notes = null,
    } = body;

    // =========================================================
    // 3. REQUIRED FIELDS
    // =========================================================

    if (!catalog_item_id) {
      return NextResponse.json(
        {
          success: false,
          error: "A service must be selected.",
        },
        { status: 400 }
      );
    }

    if (!booking_date) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking date is required.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 4. FIND CUSTOMER
    //
    // Same lookup strategy used by the customer bookings pages.
    // =========================================================

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, phone")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    let customer: {
      id: string;
      full_name: string;
      phone: string;
    } | null = null;

    // Try profile email first.
    if (profile?.email) {
      const { data } = await supabase
        .from("customers")
        .select("id, full_name, phone")
        .eq("email", profile.email)
        .maybeSingle();

      customer = data;
    }

    // Try authenticated user's email.
    if (!customer && user.email) {
      const { data } = await supabase
        .from("customers")
        .select("id, full_name, phone")
        .eq("email", user.email)
        .maybeSingle();

      customer = data;
    }

    // Try profile phone.
    if (!customer && profile?.phone) {
      const { data } = await supabase
        .from("customers")
        .select("id, full_name, phone")
        .eq("phone", profile.phone)
        .maybeSingle();

      customer = data;
    }

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No customer profile is connected to your account. Please complete your customer profile before making a booking.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 5. LOAD THE SELECTED CATALOG ITEM
    //
    // The booking must reference an ACTIVE SERVICE.
    // Products, financial items, and other catalog types
    // cannot be booked through this endpoint.
    // =========================================================

    const { data: service, error: serviceError } = await supabase
      .from("enterprise_catalog")
      .select(
        `
        id,
        business_id,
        item_type,
        category,
        name,
        description,
        base_price,
        quantity,
        status
        `
      )
      .eq("id", catalog_item_id)
      .maybeSingle();

    if (serviceError) {
      console.error("Customer booking service lookup error:", serviceError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify the selected service.",
        },
        { status: 500 }
      );
    }

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected service could not be found.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 6. VERIFY ITEM IS A SERVICE
    // =========================================================

    if (service.item_type?.toLowerCase() !== "service") {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected catalogue item is not a bookable service.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 7. VERIFY SERVICE IS ACTIVE
    // =========================================================

    if (service.status?.toLowerCase() !== "active") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This service is currently unavailable for booking.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 8. VERIFY BUSINESS
    //
    // The business_id from the request is optional because the
    // service itself already contains the authoritative
    // business_id.
    //
    // If the frontend sends one, it must match the service.
    // =========================================================

    if (business_id && business_id !== service.business_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected service does not belong to the selected business.",
        },
        { status: 400 }
      );
    }

    const finalBusinessId = service.business_id;

    // =========================================================
    // 9. VERIFY DATE
    // =========================================================

    const parsedDate = new Date(`${booking_date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid booking date.",
        },
        { status: 400 }
      );
    }

    // Prevent booking dates in the past.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedDate < today) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot make a booking for a past date.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 10. VERIFY TIME FORMAT
    // =========================================================

    if (booking_time) {
      const timePattern = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

      if (!timePattern.test(booking_time)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid booking time. Please use HH:MM format.",
          },
          { status: 400 }
        );
      }
    }

    // =========================================================
    // 11. VERIFY BRANCH
    //
    // Branch is optional in the bookings table.
    // If supplied, make sure it belongs to the selected business.
    // =========================================================

    if (branch_id) {
      const { data: branch, error: branchError } = await supabase
        .from("branches")
        .select("id, business_id, name, active")
        .eq("id", branch_id)
        .maybeSingle();

      if (branchError) {
        console.error(
          "Customer booking branch lookup error:",
          branchError
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to verify the selected branch.",
          },
          { status: 500 }
        );
      }

      if (!branch) {
        return NextResponse.json(
          {
            success: false,
            error: "The selected branch could not be found.",
          },
          { status: 404 }
        );
      }

      if (branch.business_id !== finalBusinessId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The selected branch does not belong to this business.",
          },
          { status: 400 }
        );
      }

      if (!branch.active) {
        return NextResponse.json(
          {
            success: false,
            error: "The selected branch is currently inactive.",
          },
          { status: 400 }
        );
      }
    }

    // =========================================================
    // 12. VERIFY EMPLOYEE
    //
    // Employee is optional.
    // If supplied, make sure the employee belongs to the
    // selected business and is active.
    // =========================================================

    if (employee_id) {
      const { data: employee, error: employeeError } =
        await supabase
          .from("employees")
          .select(
            `
            id,
            business_id,
            full_name,
            is_active,
            status
            `
          )
          .eq("id", employee_id)
          .maybeSingle();

      if (employeeError) {
        console.error(
          "Customer booking employee lookup error:",
          employeeError
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to verify the selected staff member.",
          },
          { status: 500 }
        );
      }

      if (!employee) {
        return NextResponse.json(
          {
            success: false,
            error: "The selected staff member could not be found.",
          },
          { status: 404 }
        );
      }

      if (employee.business_id !== finalBusinessId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The selected staff member does not belong to this business.",
          },
          { status: 400 }
        );
      }

      if (employee.is_active === false) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The selected staff member is currently unavailable.",
          },
          { status: 400 }
        );
      }

      if (
        employee.status &&
        employee.status.toLowerCase() !== "active"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The selected staff member is currently unavailable.",
          },
          { status: 400 }
        );
      }
    }

    // =========================================================
    // 13. CALCULATE AMOUNT
    //
    // The authoritative booking amount comes from the service
    // catalogue item.
    //
    // Do NOT trust an amount supplied by the browser.
    // =========================================================

    const amount = Number(service.base_price ?? 0);

    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected service has an invalid booking price.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 14. CREATE BOOKING
    // =========================================================

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        business_id: finalBusinessId,
        customer_id: customer.id,
        employee_id: employee_id || null,
        branch_id: branch_id || null,
        catalog_item_id: service.id,
        booking_date,
        booking_time: booking_time || null,
        status: "Pending",
        payment_status: "Pending",
        amount,
        notes: notes?.trim() || null,
      })
      .select(
        `
        id,
        business_id,
        customer_id,
        employee_id,
        branch_id,
        catalog_item_id,
        booking_date,
        booking_time,
        status,
        payment_status,
        amount,
        notes,
        created_at,
        updated_at
        `
      )
      .single();

    if (bookingError) {
      console.error(
        "Customer booking creation error:",
        bookingError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "We could not create your booking. Please try again.",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 15. SUCCESS
    // =========================================================

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully.",
        booking,
        service: {
          id: service.id,
          name: service.name,
          business_id: service.business_id,
          amount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Customer booking API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while creating the booking.",
      },
      { status: 500 }
    );
  }
}