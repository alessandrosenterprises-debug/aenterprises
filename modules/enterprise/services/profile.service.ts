import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, email, role_id")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !profile) {
    console.error(error);
    return null;
  }

  const { data: role } = await supabase
    .from("roles")
    .select("name")
    .eq("id", profile.role_id)
    .single();

  return {
    display_name: profile.display_name,
    email: profile.email,
    role: role?.name ?? "Enterprise Overview",
  };
}