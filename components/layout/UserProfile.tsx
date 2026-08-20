"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  UserCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

interface UserProfileData {
  display_name: string;
  email: string;
  avatar_url: string;
  role: string;
}

const defaultProfile: UserProfileData = {
  display_name: "User",
  email: "",
  avatar_url: "",
  role: "Administrator",
};

export default function UserProfile() {
  const [open, setOpen] = useState(false);

  const [profile, setProfile] =
    useState<UserProfileData>(
      defaultProfile
    );

  const [loading, setLoading] =
    useState(true);

  const containerRef =
    useRef<HTMLDivElement>(null);

  /* ============================================================
     LOAD CURRENT LOGGED-IN USER
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);

        /*
         * Get the currently authenticated
         * Supabase user.
         */
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error(
            "Failed to get authenticated user:",
            authError
          );

          return;
        }

        if (!user) {
          console.warn(
            "No authenticated user found."
          );

          return;
        }

        /*
         * Load the user's profile.
         *
         * auth_user_id connects the profiles
         * table to Supabase Auth.
         */
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            `
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
            `
          )
          .eq(
            "auth_user_id",
            user.id
          )
          .maybeSingle();

        if (profileError) {
          console.error(
            "Failed to load user profile:",
            profileError
          );
        }

        /*
         * --------------------------------------------------------
         * LOAD ROLE
         * --------------------------------------------------------
         *
         * role_id in profiles points to the roles table.
         *
         * We deliberately load it separately so this works
         * regardless of whether a foreign-key relationship has
         * been configured for Supabase's generated relationship
         * syntax.
         */
        let roleName =
          "Administrator";

        if (profileData?.role_id) {
          const {
            data: roleData,
            error: roleError,
          } = await supabase
            .from("roles")
            .select("id,name")
            .eq(
              "id",
              profileData.role_id
            )
            .maybeSingle();

          if (roleError) {
            console.error(
              "Failed to load user role:",
              roleError
            );
          }

          if (roleData?.name) {
            roleName =
              roleData.name;
          }
        }

        if (!mounted) {
          return;
        }

        /*
         * Use profile email first.
         *
         * If the profile email is empty, fall back
         * to the authenticated Supabase email.
         */
        const email =
          profileData?.email ||
          user.email ||
          "";

        /*
         * Prefer display_name.
         *
         * If display_name is empty, build the name
         * from first_name + last_name.
         */
        const displayName =
          profileData?.display_name?.trim() ||
          [
            profileData?.first_name,
            profileData?.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          email.split("@")[0] ||
          "User";

        setProfile({
          display_name:
            displayName,

          email,

          avatar_url:
            profileData?.avatar_url ||
            "",

          role: roleName,
        });
      } catch (error) {
        console.error(
          "Unexpected profile loading error:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  ============================================================ */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* ============================================================
     CLOSE DROPDOWN WITH ESCAPE
  ============================================================ */

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* ============================================================
     INITIALS
  ============================================================ */

  function getInitials(
    name: string
  ) {
    const words =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) {
      return "U";
    }

    if (words.length === 1) {
      return words[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  }

  /* ============================================================
     CLOSE MENU
  ============================================================ */

  function closeMenu() {
    setOpen(false);
  }

  /* ============================================================
     SIGN OUT
  ============================================================ */

  async function handleSignOut() {
    try {
      closeMenu();

      const {
        error,
      } = await supabase.auth.signOut();

      if (error) {
        console.error(
          "Sign out failed:",
          error
        );

        alert(
          error.message ||
            "Unable to sign out."
        );

        return;
      }

      window.location.href =
        "/login";
    } catch (error) {
      console.error(
        "Unexpected sign out error:",
        error
      );

      alert(
        "Unable to sign out."
      );
    }
  }

  /* ============================================================
     PROFILE AVATAR
  ============================================================ */

  function ProfileAvatar({
    size = "normal",
    gold = false,
  }: {
    size?: "normal" | "large";
    gold?: boolean;
  }) {
    const sizeClasses =
      size === "large"
        ? "h-12 w-12 text-sm"
        : "h-11 w-11 text-sm";

    return (
      <div
        className={`flex ${sizeClasses} shrink-0 items-center justify-center overflow-hidden rounded-full font-bold shadow-sm ${
          gold
            ? "bg-[#D4AF37] text-[#03162F]"
            : "bg-[#03162F] text-white"
        }`}
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={`${profile.display_name} profile`}
            className="h-full w-full object-cover"
          />
        ) : (
          getInitials(
            profile.display_name
          )
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* ========================================================
          PROFILE BUTTON
      ======================================================== */}

      <button
        type="button"
        onClick={() =>
          setOpen(
            (value) => !value
          )
        }
        className={`flex items-center gap-3 rounded-2xl p-2 transition ${
          open
            ? "bg-slate-100"
            : "hover:bg-slate-100"
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* AVATAR */}

        <ProfileAvatar />

        {/* NAME + ROLE */}

        <div className="hidden min-w-0 text-left lg:block">
          {loading ? (
            <>
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />

              <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-slate-100" />
            </>
          ) : (
            <>
              <p className="max-w-[170px] truncate font-semibold text-[#03162F]">
                {profile.display_name}
              </p>

              <p className="max-w-[170px] truncate text-xs text-slate-500">
                {profile.role}
              </p>
            </>
          )}
        </div>

        <ChevronDown
          className={`hidden h-4 w-4 shrink-0 text-slate-500 transition-transform lg:block ${
            open
              ? "rotate-180"
              : ""
          }`}
        />
      </button>

      {/* ========================================================
          PROFILE DROPDOWN
      ======================================================== */}

      {open && (
        <div className="absolute right-0 top-14 z-[300] w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

          {/* ====================================================
              PROFILE HEADER
          ==================================================== */}

          <div className="border-b border-white/10 bg-gradient-to-br from-[#03162F] to-[#0A2852] p-5 text-white">
            <div className="flex items-center gap-3">

              {/* REAL USER PHOTO */}

              <ProfileAvatar
                size="large"
                gold
              />

              {/* REAL USER INFORMATION */}

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {loading
                    ? "Loading..."
                    : profile.display_name}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-300">
                  {loading
                    ? "Loading role..."
                    : profile.role}
                </p>

                {profile.email && (
                  <p className="mt-1 truncate text-[11px] text-slate-400">
                    {profile.email}
                  </p>
                )}

                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />

                  Online
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================
              MENU
          ==================================================== */}

          <div className="p-2">

            {/* MY PROFILE */}

            <a
              href="/dashboard/profile"
              onClick={closeMenu}
              className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-[#03162F] group-hover:text-white">
                <UserCircle className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#03162F]">
                  My Profile
                </p>

                <p className="truncate text-xs text-slate-500">
                  View your account profile
                </p>
              </div>
            </a>

            {/* ACCOUNT SETTINGS */}

            <a
              href="/dashboard/settings"
              onClick={closeMenu}
              className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-[#03162F] group-hover:text-white">
                <Settings className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#03162F]">
                  Account Settings
                </p>

                <p className="truncate text-xs text-slate-500">
                  Manage your preferences
                </p>
              </div>
            </a>

            {/* NOTIFICATIONS */}

            <a
              href="/dashboard/notifications"
              onClick={closeMenu}
              className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-[#03162F] group-hover:text-white">
                <Bell className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#03162F]">
                  Notifications
                </p>

                <p className="truncate text-xs text-slate-500">
                  View your latest alerts
                </p>
              </div>

              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                2
              </span>
            </a>
          </div>

          {/* ====================================================
              SIGN OUT
          ==================================================== */}

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-red-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 transition group-hover:bg-red-100">
                <LogOut className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-600">
                  Sign Out
                </p>

                <p className="text-xs text-slate-500">
                  End your current session
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}