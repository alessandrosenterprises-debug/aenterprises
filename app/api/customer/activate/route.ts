import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  let body: { firstName?: unknown; lastName?: unknown; phone?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Complete the required details." }, { status: 400 }); }
  const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 80) : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim().slice(0, 80) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
  const email = user.email?.trim().toLowerCase();
  if (!firstName || !lastName || !phone || !email) return NextResponse.json({ error: "Add your name and phone number to continue." }, { status: 400 });

  const admin = createAdminClient();
  const fullName = `${firstName} ${lastName}`;
  const { data: customerRole, error: roleLookupError } = await admin.from("roles").select("id").eq("name", "Customer").maybeSingle();
  if (roleLookupError || !customerRole) return NextResponse.json({ error: "Customer account setup is temporarily unavailable." }, { status: 503 });

  const { data: existingProfile, error: profileLookupError } = await admin.from("profiles").select("id,role_id,roles(name)").eq("auth_user_id", user.id).maybeSingle();
  if (profileLookupError) return NextResponse.json({ error: "Your account could not be checked." }, { status: 503 });
  const profileRole = Array.isArray(existingProfile?.roles) ? existingProfile.roles[0] : existingProfile?.roles;
  if (existingProfile?.role_id && profileRole?.name && !["Customer", "Customer Portal User"].includes(profileRole.name)) {
    return NextResponse.json({ error: "This account is not available for customer registration." }, { status: 403 });
  }

  const { data: existingCustomer, error: customerByUserError } = await admin.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (customerByUserError) return NextResponse.json({ error: "Your customer account could not be checked." }, { status: 503 });
  if (existingCustomer) return NextResponse.json({ success: true, next: "already-registered" });

  const { data: emailMatch, error: emailLookupError } = await admin.from("customers").select("id,auth_user_id").ilike("email", email).maybeSingle();
  if (emailLookupError) return NextResponse.json({ error: "Your customer details could not be checked." }, { status: 503 });
  if (emailMatch?.auth_user_id && emailMatch.auth_user_id !== user.id) return NextResponse.json({ error: "A customer record already uses this email. Please contact support to link it." }, { status: 409 });

  let profileCreated = false;
  if (existingProfile) {
    const { error } = await admin.from("profiles").update({ first_name: firstName, last_name: lastName, display_name: fullName, email, phone, role_id: customerRole.id, active: true }).eq("id", existingProfile.id);
    if (error) return NextResponse.json({ error: "Your customer profile could not be completed." }, { status: 503 });
  } else {
    const { error } = await admin.from("profiles").insert({ auth_user_id: user.id, first_name: firstName, last_name: lastName, display_name: fullName, email, phone, role_id: customerRole.id, active: true });
    if (error) return NextResponse.json({ error: "Your customer profile could not be created." }, { status: 503 });
    profileCreated = true;
  }

  let userRoleCreated = false;
  const { data: existingUserRole, error: userRoleLookupError } = await admin.from("user_roles").select("user_id").eq("user_id", user.id).eq("role_id", customerRole.id).maybeSingle();
  if (userRoleLookupError) {
    if (profileCreated) await admin.from("profiles").delete().eq("auth_user_id", user.id);
    return NextResponse.json({ error: "Your customer access could not be configured." }, { status: 503 });
  }
  if (!existingUserRole) {
    const { error } = await admin.from("user_roles").insert({ user_id: user.id, role_id: customerRole.id });
    if (error) {
      if (profileCreated) await admin.from("profiles").delete().eq("auth_user_id", user.id);
      return NextResponse.json({ error: "Your customer access could not be configured." }, { status: 503 });
    }
    userRoleCreated = true;
  }

  let customerId = emailMatch?.id;
  if (emailMatch) {
    const { error } = await admin.from("customers").update({ auth_user_id: user.id, full_name: fullName, phone, status: "Active", is_active: true }).eq("id", emailMatch.id);
    if (error) {
      if (userRoleCreated) await admin.from("user_roles").delete().eq("user_id", user.id).eq("role_id", customerRole.id);
      if (profileCreated) await admin.from("profiles").delete().eq("auth_user_id", user.id);
      return NextResponse.json({ error: "Your AEOS customer account could not be linked." }, { status: 503 });
    }
  } else {
    const { data: customer, error } = await admin.from("customers").insert({ auth_user_id: user.id, full_name: fullName, phone, email, business_id: null, status: "Active", is_active: true }).select("id").single();
    if (error || !customer) {
      if (userRoleCreated) await admin.from("user_roles").delete().eq("user_id", user.id).eq("role_id", customerRole.id);
      if (profileCreated) await admin.from("profiles").delete().eq("auth_user_id", user.id);
      return NextResponse.json({ error: "Your AEOS customer account could not be created." }, { status: 503 });
    }
    customerId = customer.id;
  }

  await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, first_name: firstName, last_name: lastName, full_name: fullName, display_name: fullName, phone } });
  return NextResponse.json({ success: true, customerId });
}
