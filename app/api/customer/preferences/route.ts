import { NextResponse } from "next/server";
import {
  getCustomerPreferences,
  updateCustomerPreferences,
  type CustomerPreferencesUpdate,
} from "@/modules/customers/services/customer-preferences.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const preferences = await getCustomerPreferences();

    return NextResponse.json({
      preferences,
    });
  } catch (error) {
    console.error("GET /api/customer/preferences error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load customer preferences.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const updates: CustomerPreferencesUpdate = {};

    if (typeof body.email_notifications === "boolean") {
      updates.email_notifications = body.email_notifications;
    }

    if (typeof body.push_notifications === "boolean") {
      updates.push_notifications = body.push_notifications;
    }

    if (typeof body.booking_reminders === "boolean") {
      updates.booking_reminders = body.booking_reminders;
    }

    if (typeof body.message_notifications === "boolean") {
      updates.message_notifications = body.message_notifications;
    }

    if (typeof body.promotional_notifications === "boolean") {
      updates.promotional_notifications =
        body.promotional_notifications;
    }

    if (body.language === "en") {
      updates.language = body.language;
    }

    if (
      body.appearance === "system" ||
      body.appearance === "light" ||
      body.appearance === "dark"
    ) {
      updates.appearance = body.appearance;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          error: "No valid preference changes were supplied.",
        },
        { status: 400 }
      );
    }

    const preferences = await updateCustomerPreferences(updates);

    return NextResponse.json({
      preferences,
    });
  } catch (error) {
    console.error("PATCH /api/customer/preferences error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save customer preferences.",
      },
      { status: 500 }
    );
  }
}