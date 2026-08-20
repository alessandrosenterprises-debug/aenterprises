"use client";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

export default function ImageUpload({
  value,
  onChange,
}: ImageUploadProps) {
  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const inputRef =
    useRef<HTMLInputElement>(null);

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    /* --------------------------------------------------------
       VALIDATE TYPE
    -------------------------------------------------------- */

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(
        "Please upload a PNG, JPG or WEBP image."
      );

      event.target.value = "";
      return;
    }

    /* --------------------------------------------------------
       VALIDATE SIZE
    -------------------------------------------------------- */

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "Image must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      /* ------------------------------------------------------
         CREATE UNIQUE FILE PATH
      ------------------------------------------------------ */

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const fileName =
        `${crypto.randomUUID()}.${extension}`;

      const filePath =
        `catalog/${fileName}`;

      /* ------------------------------------------------------
         UPLOAD
      ------------------------------------------------------ */

      const {
        error: uploadError,
      } = await supabase.storage
        .from("enterprise-images")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          }
        );

      if (uploadError) {
        throw uploadError;
      }

      /* ------------------------------------------------------
         PUBLIC URL
      ------------------------------------------------------ */

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("enterprise-images")
        .getPublicUrl(
          filePath
        );

      const publicUrl =
        publicUrlData.publicUrl;

      if (!publicUrl) {
        throw new Error(
          "The image was uploaded but a public URL could not be created."
        );
      }

      /* ------------------------------------------------------
         SEND URL TO PARENT
      ------------------------------------------------------ */

      onChange(publicUrl);
    } catch (uploadError) {
      console.error(
        "Image upload error:",
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed."
      );
    } finally {
      /* ------------------------------------------------------
         THIS IS THE IMPORTANT FIX

         Your old component never turned uploading
         back to false.
      ------------------------------------------------------ */

      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function openFilePicker() {
    if (!uploading) {
      inputRef.current?.click();
    }
  }

  return (
    <div className="space-y-4">
      {/* =====================================================
          UPLOAD AREA
      ===================================================== */}

      <button
        type="button"
        onClick={openFilePicker}
        disabled={uploading}
        className="
          flex
          w-full
          cursor-pointer
          flex-col
          items-center
          justify-center
          rounded-2xl
          border-2
          border-dashed
          border-slate-300
          bg-slate-50
          p-8
          transition
          hover:border-[#D4AF37]
          hover:bg-slate-100
          disabled:cursor-not-allowed
          disabled:opacity-70
        "
      >
        {value ? (
          <>
            {/* IMAGE PREVIEW */}

            <div
              className="
                mb-4
                flex
                h-48
                w-48
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                bg-white
                shadow
              "
            >
              <img
                src={value}
                alt="Uploaded preview"
                className="
                  h-full
                  w-full
                  object-contain
                "
              />
            </div>

            <p className="font-semibold text-[#03162F]">
              {uploading
                ? "Uploading..."
                : "Change Image"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Click to upload another image
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 text-6xl">
              🖼️
            </div>

            <p className="text-lg font-semibold text-[#03162F]">
              Upload Image
            </p>

            <p className="mt-2 text-sm text-slate-500">
              PNG, JPG or WEBP
            </p>

            <p className="text-xs text-slate-400">
              Maximum 5 MB
            </p>
          </>
        )}
      </button>

      {/* =====================================================
          HIDDEN FILE INPUT
      ===================================================== */}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUpload}
        className="hidden"
      />

      {/* =====================================================
          UPLOADING
      ===================================================== */}

      {uploading && (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="
                h-full
                w-full
                animate-pulse
                rounded-full
                bg-[#D4AF37]
              "
            />
          </div>

          <p className="text-center text-sm font-medium text-slate-500">
            Uploading image...
          </p>
        </div>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          "
        >
          {error}
        </div>
      )}
    </div>
  );
}