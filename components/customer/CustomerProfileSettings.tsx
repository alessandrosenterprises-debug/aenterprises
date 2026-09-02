"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";

interface CustomerProfileSettingsProps {
  userId: string;
  initialFirstName: string;
  initialLastName: string;
  initialDisplayName: string;
  initialEmail: string;
  initialPhone: string;
  initialAvatarUrl: string;
}

const AVATAR_BUCKET = "avatars";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

  const uploadInputRef = useRef<HTMLInputElement | null>(
    null
  );

  const cameraInputRef = useRef<HTMLInputElement | null>(
    null
  );

  const [firstName, setFirstName] =
    useState(initialFirstName);

  const [lastName, setLastName] =
    useState(initialLastName);

  const [displayName, setDisplayName] =
    useState(initialDisplayName);

  const [phone, setPhone] = useState(initialPhone);

  const [avatarUrl, setAvatarUrl] =
    useState(initialAvatarUrl);

  const [previewUrl, setPreviewUrl] =
    useState(initialAvatarUrl);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [saving, setSaving] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const [removingAvatar, setRemovingAvatar] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * Clean up temporary preview URLs when the
   * component is removed.
   */
  useEffect(() => {
    return () => {
      if (
        previewUrl &&
        previewUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const initials = (
    displayName ||
    firstName ||
    "C"
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  /*
   * Handle image selection from either:
   * - Gallery
   * - Camera
   */
  const handleFileSelect = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    /*
     * Validate file type.
     */
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      event.target.value = "";
      return;
    }

    /*
     * Validate file size.
     */
    if (file.size > MAX_FILE_SIZE) {
      setError(
        "Your profile photo must be smaller than 5 MB."
      );
      event.target.value = "";
      return;
    }

    /*
     * Remove the previous temporary preview.
     */
    if (
      previewUrl &&
      previewUrl.startsWith("blob:")
    ) {
      URL.revokeObjectURL(previewUrl);
    }

    /*
     * Create instant local preview.
     */
    const localPreview =
      URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(localPreview);
  };

  /*
   * Cancel a photo that has been selected
   * but has not been uploaded yet.
   */
  const handleCancelPhoto = () => {
    if (
      previewUrl &&
      previewUrl.startsWith("blob:")
    ) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(avatarUrl);
    setMessage("");
    setError("");

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  /*
   * Upload selected profile photo.
   */
  const handleUploadAvatar = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setUploadingAvatar(true);
      setMessage("");
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      /*
       * Extra ownership protection.
       */
      if (user.id !== userId) {
        throw new Error(
          "You are not authorized to update this profile."
        );
      }

      const extension =
        selectedFile.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      /*
       * Give every upload a unique path.
       *
       * Example:
       * user-id/avatar-1723456789.jpg
       */
      const filePath =
        `${userId}/avatar-${Date.now()}.${extension}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(
          filePath,
          selectedFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedFile.type,
          }
        );

      if (uploadError) {
        throw uploadError;
      }

      /*
       * Get public URL.
       */
      const {
        data: { publicUrl },
      } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error(
          "Unable to create the profile photo URL."
        );
      }

      /*
       * Save URL to the customer's profile.
       */
      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
        })
        .eq("auth_user_id", userId);

      /*
       * If database update fails, remove
       * the newly uploaded file.
       */
      if (profileError) {
        await supabase.storage
          .from(AVATAR_BUCKET)
          .remove([filePath]);

        throw profileError;
      }

      /*
       * Update UI immediately.
       */
      setAvatarUrl(publicUrl);
      setPreviewUrl(publicUrl);
      setSelectedFile(null);

      /*
       * Reset both file inputs.
       */
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }

      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }

      setMessage(
        "Profile photo updated successfully."
      );

      /*
       * Refresh server components so:
       * - profile page updates
       * - CustomerNavigation updates
       * - avatar remains after navigation
       */
      router.refresh();
    } catch (err) {
      console.error(
        "Profile avatar upload error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload your profile photo."
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  /*
   * Remove existing profile photo.
   */
  const handleRemoveAvatar = async () => {
    if (!avatarUrl) {
      return;
    }

    try {
      setRemovingAvatar(true);
      setMessage("");
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      if (user.id !== userId) {
        throw new Error(
          "You are not authorized to update this profile."
        );
      }

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
        })
        .eq("auth_user_id", userId);

      if (profileError) {
        throw profileError;
      }

      setAvatarUrl("");
      setPreviewUrl("");
      setSelectedFile(null);

      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }

      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }

      setMessage("Profile photo removed.");

      router.refresh();
    } catch (err) {
      console.error(
        "Profile avatar removal error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove your profile photo."
      );
    } finally {
      setRemovingAvatar(false);
    }
  };

  /*
   * Save normal profile information.
   */
  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/customer/profile",
        {
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
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to update profile"
        );
      }

      setMessage(
        "Profile updated successfully."
      );

      router.refresh();
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* =====================================================
          PROFILE PHOTO
      ====================================================== */}

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#03162F] p-5 text-white shadow-xl sm:p-6">

        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative">

          {/* TITLE */}

          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              Profile Photo
            </p>

            <h2 className="mt-1 text-lg font-black">
              Your profile picture
            </h2>

            <p className="mt-1 max-w-md text-xs leading-5 text-white/50">
              Choose a photo from your device or
              take a new one with your camera.
            </p>
          </div>

          {/* PHOTO + DETAILS */}

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">

            {/* AVATAR */}

            <div className="relative shrink-0">

              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-[#D4AF37]/70 bg-gradient-to-br from-[#D4AF37] to-[#a9842e] p-1 shadow-2xl shadow-black/40">

                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#D4AF37]">

                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={
                        displayName ||
                        firstName ||
                        "Customer"
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-black text-[#03162F]">
                      {initials}
                    </span>
                  )}

                </div>
              </div>

              {/* CAMERA BADGE */}

              <div className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#03162F] bg-[#D4AF37] text-[#03162F] shadow-lg">
                <Camera size={16} />
              </div>
            </div>

            {/* DETAILS */}

            <div className="min-w-0 flex-1 text-center sm:text-left">

              <p className="text-base font-black">
                {displayName ||
                  firstName ||
                  "Customer"}
              </p>

              <p className="mt-1 text-xs text-white/45">
                Use a clear photo of yourself.
              </p>

              <p className="mt-1 text-[10px] text-white/30">
                JPG, PNG, WEBP • Maximum 5 MB
              </p>

              {/* ==========================================
                  HIDDEN INPUTS
              =========================================== */}

              {/* Gallery / file picker */}

              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Camera */}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* ==========================================
                  PHOTO ACTIONS
              =========================================== */}

              {!selectedFile ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">

                  {/* TAKE PHOTO */}

                  <button
                    type="button"
                    onClick={() =>
                      cameraInputRef.current?.click()
                    }
                    disabled={
                      uploadingAvatar ||
                      removingAvatar
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#f2d58b] px-4 py-3 text-xs font-black text-[#03162F] shadow-lg shadow-[#D4AF37]/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Camera size={16} />
                    Take Photo
                  </button>

                  {/* UPLOAD PHOTO */}

                  <button
                    type="button"
                    onClick={() =>
                      uploadInputRef.current?.click()
                    }
                    disabled={
                      uploadingAvatar ||
                      removingAvatar
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-bold text-white transition duration-300 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ImageIcon size={16} />
                    Upload Photo
                  </button>

                </div>
              ) : (
                <div className="mt-4">

                  {/* SELECTED PHOTO MESSAGE */}

                  <div className="mb-3 flex items-center justify-center gap-2 text-[10px] text-[#D9B65D] sm:justify-start">
                    <CheckCircle2 size={13} />

                    <span className="max-w-[220px] truncate">
                      {selectedFile.name}
                    </span>
                  </div>

                  {/* SAVE / CANCEL */}

                  <div className="flex flex-col gap-2 sm:flex-row">

                    <button
                      type="button"
                      onClick={handleUploadAvatar}
                      disabled={uploadingAvatar}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#f2d58b] px-4 py-3 text-xs font-black text-[#03162F] shadow-lg transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Save Photo
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelPhoto}
                      disabled={uploadingAvatar}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={15} />
                      Cancel
                    </button>

                  </div>
                </div>
              )}

              {/* REMOVE */}

              {avatarUrl && !selectedFile && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={removingAvatar}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[10px] font-bold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {removingAvatar ? (
                    <Loader2
                      size={13}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={13} />
                  )}

                  Remove current photo
                </button>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATUS
      ====================================================== */}

      {(message || error) && (
        <div
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ? (
            <X
              size={16}
              className="mt-0.5 shrink-0"
            />
          ) : (
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0"
            />
          )}

          <span>
            {error || message}
          </span>
        </div>
      )}

      {/* =====================================================
          ACCOUNT INFORMATION
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

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

        {/* SAVE ACCOUNT */}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-[#03162F] px-5 py-3 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0a274d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </section>
    </div>
  );
}