"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CustomerProfileSettingsProps {
  userId: string;
  initialFirstName: string;
  initialLastName: string;
  initialDisplayName: string;
  initialEmail: string;
  initialPhone: string;
  initialAvatarUrl: string;
}

export default function CustomerProfileSettings({
  userId,
  initialFirstName,
  initialLastName,
  initialDisplayName,
  initialEmail,
  initialPhone,
  initialAvatarUrl,
}: CustomerProfileSettingsProps) {
  const router = useRouter();

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phone, setPhone] = useState(initialPhone);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          displayName,
          phone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      setMessage("Profile updated successfully.");

      /*
       * Refresh the Server Components.
       *
       * This is important because CustomerNavigation
       * reads the profile from Supabase on the server.
       *
       * After refresh:
       * - header first name updates
       * - dropdown first name updates
       * - profile information updates
       */
      router.refresh();
    } catch (error) {
      console.error("Profile update error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* PROFILE PREVIEW */}

      <div className="rounded-2xl border border-slate-200 bg-[#03162F] p-5 text-white">
        <div className="flex items-center gap-4">

          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]">
            {initialAvatarUrl ? (
              <img
                src={initialAvatarUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-black text-[#03162F]">
                {(firstName || "C").charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <p className="text-lg font-bold">
              {displayName || firstName || "Customer"}
            </p>

            <p className="text-xs text-slate-300">
              Customer account
            </p>
          </div>
        </div>
      </div>

      {/* ACCOUNT INFORMATION */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-5">
          <h2 className="text-base font-bold text-[#03162F]">
            Account Settings
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Update your customer account information.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          {/* FIRST NAME */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#03162F]">
              First Name
            </label>

            <input
              value={firstName}
              onChange={(event) =>
                setFirstName(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>

          {/* LAST NAME */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#03162F]">
              Last Name
            </label>

            <input
              value={lastName}
              onChange={(event) =>
                setLastName(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>

          {/* DISPLAY NAME */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#03162F]">
              Display Name
            </label>

            <input
              value={displayName}
              onChange={(event) =>
                setDisplayName(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>

          {/* PHONE */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#03162F]">
              Phone Number
            </label>

            <input
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>

          {/* EMAIL */}

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-[#03162F]">
              Email Address
            </label>

            <input
              value={initialEmail}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500"
            />

            <p className="mt-1 text-[10px] text-slate-400">
              Your login email cannot be changed here.
            </p>
          </div>
        </div>

        {/* STATUS */}

        {message && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-[#03162F]">
            {message}
          </div>
        )}

        {/* SAVE */}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-[#03162F] px-5 py-3 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0a274d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}