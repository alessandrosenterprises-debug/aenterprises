import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = [
  "Pending",
  "Contacted",
  "Scheduled",
  "Completed",
  "Cancelled",
] as const;

type ConsultationStatus = (typeof ALLOWED_STATUSES)[number];

const AEOS_ROLES = [
  "Super Admin",
  "Super Administrator",
  "System Admin",
  "Enterprise Manager",
  "Business Manager",
  "Department Manager",
  "Supervisor",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // ---------------------------------------------------------
    // 1. Authenticate the current user
    // ---------------------------------------------------------
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 2. Verify AEOS staff permissions
    // ---------------------------------------------------------
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        auth_user_id,
        active,
        role_id,
        roles:role_id (
          id,
          name,
          status
        )
      `
      )
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Consultation profile lookup error:", profileError);

      return NextResponse.json(
        { error: "Unable to verify your AEOS permissions." },
        { status: 500 }
      );
    }

    if (!profile || !profile.active) {
      return NextResponse.json(
        { error: "You do not have permission to update consultations." },
        { status: 403 }
      );
    }

    const role = Array.isArray(profile.roles)
      ? profile.roles[0]
      : profile.roles;

    if (
      !role ||
      !role.status ||
      role.status !== "Active" ||
      !AEOS_ROLES.includes(role.name)
    ) {
      return NextResponse.json(
        { error: "You do not have permission to update consultations." },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 3. Get consultation ID
    // ---------------------------------------------------------
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Consultation ID is required." },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 4. Read requested status
    // ---------------------------------------------------------
    const body = await request.json();
    const requestedStatus = body?.status as string | undefined;

    if (
      !requestedStatus ||
      !ALLOWED_STATUSES.includes(
        requestedStatus as ConsultationStatus
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid consultation status. Allowed statuses are Pending, Contacted, Scheduled, Completed and Cancelled.",
        },
        { status: 400 }
      );
    }

    const newStatus = requestedStatus as ConsultationStatus;

    // ---------------------------------------------------------
    // 5. Find Alessandro Tech Solutions
    // ---------------------------------------------------------
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .eq("slug", "tech-solutions")
      .eq("active", true)
      .maybeSingle();

    if (businessError) {
      console.error(
        "Consultation business lookup error:",
        businessError
      );

      return NextResponse.json(
        { error: "Unable to locate Tech Solutions." },
        { status: 500 }
      );
    }

    if (!business) {
      return NextResponse.json(
        { error: "Alessandro Tech Solutions could not be found." },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 6. Find the consultation
    // ---------------------------------------------------------
    const { data: consultation, error: consultationError } =
      await supabase
        .from("technology_consultation_requests")
        .select("id, status, business_id")
        .eq("id", id)
        .eq("business_id", business.id)
        .maybeSingle();

    if (consultationError) {
      console.error(
        "Consultation lookup error:",
        consultationError
      );

      return NextResponse.json(
        { error: "Unable to find this consultation." },
        { status: 500 }
      );
    }

    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found." },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 7. Prevent reopening completed/cancelled consultations
    // ---------------------------------------------------------
    if (
      (consultation.status === "Completed" ||
        consultation.status === "Cancelled") &&
      newStatus !== consultation.status
    ) {
      return NextResponse.json(
        {
          error: `This consultation is already ${consultation.status.toLowerCase()} and cannot be moved back to another status.`,
        },
        { status: 409 }
      );
    }

    // ---------------------------------------------------------
    // 8. Update consultation
    // ---------------------------------------------------------
    const { data: updatedConsultation, error: updateError } =
      await supabase
        .from("technology_consultation_requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", consultation.id)
        .eq("business_id", business.id)
        .select(
          "id, status, updated_at"
        )
        .single();

    if (updateError) {
      console.error(
        "Consultation status update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "The consultation could not be updated. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Consultation marked as ${newStatus}.`,
      consultation: updatedConsultation,
    });
  } catch (error) {
    console.error("Consultation PATCH error:", error);

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while updating the consultation.",
      },
      { status: 500 }
    );
  }
}