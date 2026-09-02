import CustomerNavigation from "@/components/customer/CustomerNavigation";
import CustomerProfileSettings from "@/components/customer/CustomerProfileSettings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
  }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50">
        <CustomerNavigation />

        <section className="mx-auto max-w-3xl px-5 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-bold text-[#03162F]">
              Please sign in
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              You need to sign in to view your profile.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      first_name,
      last_name,
      display_name,
      email,
      phone,
      avatar_url
    `)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const params = await searchParams;

  const settingsActive = params.section === "settings";

  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Customer";

  const email = profile?.email || user.email || "";

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <CustomerNavigation />

      {/* HEADER */}

      <section className="bg-[#03162F] px-4 pb-10 pt-7 text-white sm:px-5">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Account
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-4xl">
            {settingsActive ? "Account Settings" : "My Profile"}
          </h1>

          <p className="mt-2 text-xs text-slate-300 sm:text-base">
            {settingsActive
              ? "Manage your customer account information."
              : "View and manage your customer account."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-5">

        {settingsActive ? (
          <CustomerProfileSettings
            userId={user.id}
            initialFirstName={profile?.first_name || ""}
            initialLastName={profile?.last_name || ""}
            initialDisplayName={profile?.display_name || ""}
            initialEmail={email}
            initialPhone={profile?.phone || ""}
            initialAvatarUrl={profile?.avatar_url || ""}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* PROFILE HEADER */}

            <div className="bg-gradient-to-r from-[#03162F] to-[#0a274d] p-6 text-white">
              <div className="flex items-center gap-4">

                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-[#D4AF37]"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37] text-2xl font-black text-[#03162F]">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="text-xl font-bold">
                    {displayName}
                  </p>

                  <p className="mt-1 text-xs text-slate-300">
                    Customer account
                  </p>
                </div>
              </div>
            </div>

            {/* PROFILE INFORMATION */}

            <div className="space-y-5 p-6">

              <ProfileField
                label="Name"
                value={displayName}
              />

              <ProfileField
                label="Email"
                value={email || "Not provided"}
              />

              <ProfileField
                label="Phone"
                value={profile?.phone || "Not provided"}
              />

              <div className="border-t border-slate-100 pt-5">
                <a
                  href="/customer/profile?section=settings"
                  className="inline-flex rounded-xl bg-[#03162F] px-5 py-3 text-xs font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Account Settings
                </a>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#03162F]">
        {value}
      </p>
    </div>
  );
}