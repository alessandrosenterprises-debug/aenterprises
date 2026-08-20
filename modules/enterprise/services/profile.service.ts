import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      auth_user_id,
      first_name,
      last_name,
      display_name,
      email,
      phone,
      avatar_url,
      role_id,
      active
    `)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Failed to load current profile:",
      profileError
    );

    return null;
  }

  if (!profile) {
    return null;
  }

  let roleName = "";

  if (profile.role_id) {
    const {
      data: role,
      error: roleError,
    } = await supabase
      .from("roles")
      .select("name")
      .eq("id", profile.role_id)
      .maybeSingle();

    if (roleError) {
      console.error(
        "Failed to load current role:",
        roleError
      );
    }

    roleName = role?.name ?? "";
  }

  return {
    id: profile.id,
    auth_user_id: profile.auth_user_id,

    first_name:
      profile.first_name ?? "",

    last_name:
      profile.last_name ?? "",

    display_name:
      profile.display_name ||
      `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
      user.email?.split("@")[0] ||
      "User",

    email:
      profile.email ||
      user.email ||
      "",

    phone:
      profile.phone ?? "",

    avatar_url:
      profile.avatar_url ?? "",

    role: roleName,

    active:
      profile.active ?? true,
  };
}