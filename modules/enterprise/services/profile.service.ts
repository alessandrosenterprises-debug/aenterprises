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

  const { data: effectiveProfiles, error: profileError } = await supabase.rpc("get_effective_profile");
  const profile = effectiveProfiles?.[0];

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

  const roleName = profile.role_name ?? "";

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
