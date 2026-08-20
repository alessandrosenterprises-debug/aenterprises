"use client";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  User,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

/* ============================================================
   TYPES
============================================================ */

interface Profile {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  role_id: string;
  active: boolean;
}

interface Role {
  id: string;
  name: string;
}

/* ============================================================
   DEFAULT PROFILE
============================================================ */

const emptyProfile: Profile = {
  id: "",
  auth_user_id: "",
  first_name: "",
  last_name: "",
  display_name: "",
  email: "",
  phone: "",
  avatar_url: "",
  role_id: "",
  active: true,
};

/* ============================================================
   PAGE
============================================================ */

export default function MyProfilePage() {
  const [profile, setProfile] =
    useState<Profile>(emptyProfile);

  const [role, setRole] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  /* ==========================================================
     LOAD CURRENT USER PROFILE
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        /*
         * Get the currently authenticated Supabase user.
         */
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error(
            "No authenticated user was found."
          );
        }

        /*
         * Load the matching profile.
         */
        const {
          data,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, auth_user_id, first_name, last_name, display_name, email, phone, avatar_url, role_id, active"
          )
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!data) {
          throw new Error(
            "Your user profile could not be found."
          );
        }

        if (!mounted) {
          return;
        }

        const loadedProfile: Profile = {
          id: data.id ?? "",
          auth_user_id:
            data.auth_user_id ?? user.id,
          first_name:
            data.first_name ?? "",
          last_name:
            data.last_name ?? "",
          display_name:
            data.display_name ??
            user.email?.split("@")[0] ??
            "",
          email:
            data.email ??
            user.email ??
            "",
          phone:
            data.phone ?? "",
          avatar_url:
            data.avatar_url ?? "",
          role_id:
            data.role_id ?? "",
          active:
            data.active ?? true,
        };

        setProfile(loadedProfile);

        /*
         * Only look up the role when one exists.
         *
         * The role is displayed conditionally below.
         */
        if (loadedProfile.role_id) {
          const {
            data: roleData,
            error: roleError,
          } = await supabase
            .from("roles")
            .select("id, name")
            .eq(
              "id",
              loadedProfile.role_id
            )
            .maybeSingle();

          if (roleError) {
            console.error(
              "Failed to load user role:",
              roleError
            );
          }

          if (mounted) {
            setRole(
              roleData?.name ?? ""
            );
          }
        }
      } catch (loadError) {
        console.error(
          "Failed to load profile:",
          loadError
        );

        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your profile."
          );
        }
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

  /* ==========================================================
     PROFILE FIELD UPDATE
  ========================================================== */

  function updateField(
    field: keyof Profile,
    value: string | boolean
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* ==========================================================
     PROFILE PHOTO UPLOAD
  ========================================================== */

  async function handleAvatarUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Basic validation.
     */
    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Profile pictures must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      /*
       * Get authenticated user.
       */
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          "You are not logged in."
        );
      }

      /*
       * Keep profile images separated by user.
       */
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const filePath =
        `profiles/${user.id}/avatar-${Date.now()}.${extension}`;

      /*
       * Upload to the existing enterprise-images bucket.
       */
      const {
        error: uploadError,
      } = await supabase.storage
        .from("enterprise-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      /*
       * Get public URL.
       */
      const {
        data: publicUrlData,
      } = supabase.storage
        .from("enterprise-images")
        .getPublicUrl(filePath);

      const avatarUrl =
        publicUrlData.publicUrl;

      /*
       * Save avatar URL directly into profiles.
       */
      const {
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile((current) => ({
        ...current,
        avatar_url: avatarUrl,
      }));

      setSuccess(
        "Profile photo updated successfully."
      );
    } catch (uploadError) {
      console.error(
        "Profile image upload failed:",
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Profile photo upload failed."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  /* ==========================================================
     SAVE PROFILE
  ========================================================== */

  async function saveProfile() {
    try {
      setSaving(true);
      setSaved(false);
      setError("");
      setSuccess("");

      if (!profile.display_name.trim()) {
        throw new Error(
          "Display name is required."
        );
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          "You are not logged in."
        );
      }

      const {
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          first_name:
            profile.first_name.trim(),
          last_name:
            profile.last_name.trim(),
          display_name:
            profile.display_name.trim(),
          email:
            profile.email.trim(),
          phone:
            profile.phone.trim() || null,
          updated_at:
            new Date().toISOString(),
        })
        .eq("auth_user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      setSaved(true);
      setSuccess(
        "Your profile has been saved successfully."
      );

      window.setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (saveError) {
      console.error(
        "Failed to save profile:",
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     CHANGE PASSWORD
  ========================================================== */

  async function changePassword() {
    try {
      setError("");
      setSuccess("");

      if (!currentPassword) {
        throw new Error(
          "Enter your current password."
        );
      }

      if (!newPassword) {
        throw new Error(
          "Enter a new password."
        );
      }

      if (newPassword.length < 6) {
        throw new Error(
          "The new password must contain at least 6 characters."
        );
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        throw new Error(
          "The new passwords do not match."
        );
      }

      /*
       * First verify the current password
       * by signing in again.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user?.email) {
        throw new Error(
          "Your authenticated email could not be found."
        );
      }

      const {
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error(
          "Your current password is incorrect."
        );
      }

      /*
       * Update password.
       */
      const {
        error: passwordError,
      } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordError) {
        throw passwordError;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        "Your password has been changed successfully."
      );
    } catch (passwordError) {
      console.error(
        "Password change failed:",
        passwordError
      );

      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Unable to change your password."
      );
    }
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#03162F]" />

          <p className="text-sm text-slate-500">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white">
            <UserRound className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#03162F]">
              My Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your personal information
              and account settings.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <Check className="mt-0.5 h-5 w-5 shrink-0" />

          <p className="font-semibold">
            {success}
          </p>
        </div>
      )}

      {/* =====================================================
          PROFILE + ACCOUNT
      ===================================================== */}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* ===================================================
            PROFILE CARD
        =================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            {/* AVATAR */}

            <div className="relative mx-auto h-32 w-32">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#03162F] text-4xl font-bold text-white shadow-xl ring-4 ring-[#D4AF37]/30">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={
                      profile.display_name ||
                      "Profile photo"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile.display_name
                    ?.charAt(0)
                    ?.toUpperCase() || (
                    <User className="h-12 w-12" />
                  )
                )}
              </div>

              {/* ONLINE DOT */}

              <span className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white bg-emerald-500" />
            </div>

            {/* UPLOAD */}

            <label
              htmlFor="profile-photo"
              className={`mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#03162F] transition hover:border-[#D4AF37] hover:bg-slate-50 ${
                uploading
                  ? "pointer-events-none opacity-60"
                  : ""
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Change Photo
                </>
              )}
            </label>

            <input
              id="profile-photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={
                handleAvatarUpload
              }
              className="hidden"
            />

            <p className="mt-2 text-xs text-slate-400">
              JPG, PNG or WEBP · Maximum 5 MB
            </p>

            {/* NAME */}

            <h2 className="mt-6 text-xl font-bold text-[#03162F]">
              {profile.display_name ||
                "Your Profile"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {profile.email}
            </p>

            {/* ROLE — ONLY SUPER ADMIN */}

            {role ===
              "Super Administrator" && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#8A6A00]">
                <ShieldCheck className="h-4 w-4" />

                Super Administrator
              </div>
            )}

            {/* STATUS */}

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  profile.active
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
              />

              {profile.active
                ? "Account Active"
                : "Account Inactive"}
            </div>
          </div>
        </section>

        {/* ===================================================
            PERSONAL INFORMATION
        =================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#03162F]">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update the information associated
              with your account.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* FIRST NAME */}

            <ProfileInput
              label="First Name"
              value={profile.first_name}
              placeholder="First name"
              onChange={(value) =>
                updateField(
                  "first_name",
                  value
                )
              }
            />

            {/* LAST NAME */}

            <ProfileInput
              label="Last Name"
              value={profile.last_name}
              placeholder="Last name"
              onChange={(value) =>
                updateField(
                  "last_name",
                  value
                )
              }
            />

            {/* DISPLAY NAME */}

            <ProfileInput
              label="Display Name"
              value={
                profile.display_name
              }
              placeholder="Display name"
              onChange={(value) =>
                updateField(
                  "display_name",
                  value
                )
              }
            />

            {/* EMAIL */}

            <ProfileInput
              label="Email"
              type="email"
              value={profile.email}
              placeholder="Email address"
              icon={
                <Mail className="h-4 w-4" />
              }
              onChange={(value) =>
                updateField(
                  "email",
                  value
                )
              }
            />

            {/* PHONE */}

            <ProfileInput
              label="Phone"
              value={profile.phone}
              placeholder="+260..."
              icon={
                <Phone className="h-4 w-4" />
              }
              onChange={(value) =>
                updateField(
                  "phone",
                  value
                )
              }
            />

            {/* ACCOUNT ID */}

            <ProfileInput
              label="Account ID"
              value={profile.auth_user_id}
              disabled
            />
          </div>

          {/* ROLE ONLY FOR SUPER ADMIN */}

          {role ===
            "Super Administrator" && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03162F] text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Role
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#03162F]">
                    Super Administrator
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          SIMPLE SETTINGS
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#03162F]">
            Account Security
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Keep your account secure by regularly
            updating your password.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <PasswordField
            label="Current Password"
            value={currentPassword}
            type={
              showCurrentPassword
                ? "text"
                : "password"
            }
            onChange={
              setCurrentPassword
            }
            show={
              showCurrentPassword
            }
            onToggle={() =>
              setShowCurrentPassword(
                (value) => !value
              )
            }
          />

          <PasswordField
            label="New Password"
            value={newPassword}
            type={
              showNewPassword
                ? "text"
                : "password"
            }
            onChange={setNewPassword}
            show={showNewPassword}
            onToggle={() =>
              setShowNewPassword(
                (value) => !value
              )
            }
          />

          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            type={
              showConfirmPassword
                ? "text"
                : "password"
            }
            onChange={
              setConfirmPassword
            }
            show={
              showConfirmPassword
            }
            onToggle={() =>
              setShowConfirmPassword(
                (value) => !value
              )
            }
          />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={changePassword}
            className="inline-flex items-center gap-2 rounded-xl border border-[#03162F] bg-white px-5 py-3 text-sm font-semibold text-[#03162F] transition hover:bg-[#03162F] hover:text-white"
          >
            <KeyRound className="h-4 w-4" />
            Change Password
          </button>
        </div>
      </section>

      {/* =====================================================
          ACCOUNT INFORMATION
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#03162F] shadow-sm">
            <User className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-[#03162F]">
              Your account
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              This page only controls the profile
              of the person currently signed in.
              Enterprise branding and company
              information remain in Enterprise
              Settings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   PROFILE INPUT
============================================================ */

function ProfileInput({
  label,
  value,
  placeholder,
  type = "text",
  disabled = false,
  icon,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#03162F]">
        {label}
      </span>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value ?? ""}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) =>
            onChange?.(
              event.target.value
            )
          }
          className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-yellow-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
            icon ? "pl-11" : ""
          }`}
        />
      </div>
    </label>
  );
}

/* ============================================================
   PASSWORD FIELD
============================================================ */

function PasswordField({
  label,
  value,
  type,
  show,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  type: string;
  show: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#03162F]">
        {label}
      </span>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-yellow-50"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#03162F]"
          aria-label={
            show
              ? `Hide ${label}`
              : `Show ${label}`
          }
        >
          {show ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </label>
  );
}