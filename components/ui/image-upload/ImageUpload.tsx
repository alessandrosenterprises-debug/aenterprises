"use client";

import { ChangeEvent, useState } from "react";

import { supabase } from "@/lib/supabase/client";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({
  value,
  onChange,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const extension =
        file.name.split(".").pop();

      const fileName =
        `${Date.now()}.${extension}`;

      const filePath =
        `catalog/${fileName}`;

      const result = await supabase.storage
  .from("enterprise-images")
  .upload(filePath, file);

console.log("Upload Result:", result);

if (result.error) {
  throw result.error;
}

      const { data } = supabase.storage
        .from("enterprise-images")
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
    } catch (error: any) {
  console.error("Upload Error:", error);

  alert(
    error?.message ??
    JSON.stringify(error) ??
    "Image upload failed."
  );
}
  }

  return (
  <div className="space-y-4">

    <label
      htmlFor="image-upload"
      className="
        flex
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
      "
    >
      {value ? (
        <>
          <img
            src={value}
            alt="Preview"
            className="mb-4 h-48 w-48 rounded-xl border object-cover shadow"
          />

          <p className="font-semibold text-[#03162F]">
            Change Image
          </p>

          <p className="text-sm text-slate-500">
            Click to upload another image
          </p>
        </>
      ) : (
        <>
          <div className="mb-4 text-6xl">
            🖼️
          </div>

          <p className="text-lg font-semibold text-[#03162F]">
            Upload Product Image
          </p>

          <p className="mt-2 text-sm text-slate-500">
            PNG, JPG or WEBP
          </p>

          <p className="text-xs text-slate-400">
            Maximum 5 MB
          </p>
        </>
      )}
    </label>

    <input
      id="image-upload"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={handleUpload}
      className="hidden"
    />

    {uploading && (
      <div className="space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#D4AF37]" />
        </div>

        <p className="text-center text-sm text-slate-500">
          Uploading image...
        </p>
      </div>
    )}

  </div>
);
}