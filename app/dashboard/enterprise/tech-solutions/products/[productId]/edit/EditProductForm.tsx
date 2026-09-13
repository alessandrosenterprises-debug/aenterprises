
"use client";

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ImagePlus,
  Save,
  Upload,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

interface Business {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  business_id: string;
  item_type: string;
  category: string | null;
  name: string;
  description: string | null;
  base_price: number | null;
  quantity: number | null;
  status: string;
  image_url: string | null;
  attributes: Record<string, unknown> | null;
}

interface Props {
  business: Business;
  product: Product;
}

const categories = [
  "Computers & Laptops",
  "Phones & Accessories",
  "IT Support",
  "Networking",
  "CCTV & Security",
  "Printers",
  "Web Development",
  "Graphic Design",
  "Software & Systems",
  "Data & Backup",
  "Cybersecurity",
  "Other",
];

const statuses = ["Active", "Inactive", "Draft"];

function attributesToText(
  attributes: Record<string, unknown> | null
): string {
  if (!attributes) {
    return "";
  }

  try {
    return JSON.stringify(attributes, null, 2);
  } catch {
    return "";
  }
}

export default function EditProductForm({
  business,
  product,
}: Props) {
  const [name, setName] = useState(product.name ?? "");
  const [category, setCategory] = useState(
    product.category ?? ""
  );
  const [description, setDescription] = useState(
    product.description ?? ""
  );

  const [basePrice, setBasePrice] = useState(
    product.base_price !== null &&
      product.base_price !== undefined
      ? String(product.base_price)
      : ""
  );

  const [quantity, setQuantity] = useState(
    product.quantity !== null &&
      product.quantity !== undefined
      ? String(product.quantity)
      : ""
  );

  const [status, setStatus] = useState(
    product.status ?? "Active"
  );

  const [imageUrl, setImageUrl] = useState(
    product.image_url ?? ""
  );

  const [attributes, setAttributes] = useState(
    attributesToText(product.attributes)
  );

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) {
      return imageUrl || null;
    }

    return URL.createObjectURL(imageFile);
  }, [imageFile, imageUrl]);

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      setImageFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      setImageFile(null);
      return;
    }

    setImageFile(file);
    setError(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) {
      return imageUrl.trim() || null;
    }

    setUploadingImage(true);

    try {
      const fileExtension =
        imageFile.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const fileName = `${product.id}-${Date.now()}.${fileExtension}`;

      const filePath =
        `tech-solutions/products/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("business-assets")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: true,
          });

      if (uploadError) {
        throw new Error(
          `Image upload failed: ${uploadError.message}`
        );
      }

      const { data } = supabase.storage
        .from("business-assets")
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error(
          "Image uploaded, but the public image URL could not be generated."
        );
      }

      return data.publicUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (saving || uploadingImage) {
      return;
    }

    setError(null);

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Product name is required.");
      return;
    }

    const parsedPrice =
      basePrice.trim() === ""
        ? null
        : Number(basePrice);

    if (
      parsedPrice !== null &&
      (!Number.isFinite(parsedPrice) ||
        parsedPrice < 0)
    ) {
      setError("Enter a valid product price.");
      return;
    }

    const parsedQuantity =
      quantity.trim() === ""
        ? null
        : Number(quantity);

    if (
      parsedQuantity !== null &&
      (!Number.isInteger(parsedQuantity) ||
        parsedQuantity < 0)
    ) {
      setError(
        "Quantity must be a whole number greater than or equal to 0."
      );
      return;
    }

    let parsedAttributes:
      | Record<string, unknown>
      | null = null;

    if (attributes.trim()) {
      try {
        const parsed = JSON.parse(attributes);

        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          setError(
            "Additional attributes must be a JSON object."
          );
          return;
        }

        parsedAttributes =
          parsed as Record<string, unknown>;
      } catch {
        setError(
          "Additional attributes contain invalid JSON."
        );
        return;
      }
    }

    setSaving(true);

    try {
      const finalImageUrl = await uploadImage();

      const { error: updateError } =
        await supabase
          .from("enterprise_catalog")
          .update({
            name: trimmedName,
            category: trimmedCategory || null,
            description:
              trimmedDescription || null,
            base_price: parsedPrice,
            quantity: parsedQuantity,
            status,
            image_url: finalImageUrl,
            attributes: parsedAttributes,
          })
          .eq("id", product.id)
          .eq("business_id", business.id)
          .eq("item_type", "product");

      if (updateError) {
        throw new Error(
          `Product update failed: ${updateError.message}`
        );
      }

      window.location.href =
        `/dashboard/enterprise/tech-solutions/products/${product.id}`;
    } catch (err) {
      console.error(
        "AEOS Tech Solutions product update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the product."
      );

      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/dashboard/enterprise/tech-solutions/products/${product.id}`}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product
        </Link>

        <div className="text-sm text-slate-500">
          {business.name}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#03162F]">
                Product Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Customer-facing information for this
                Technology Shop item.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Product Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. HP EliteBook 840 G8"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  >
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={6}
                  placeholder="Describe the product, specifications, condition, features, and customer benefits."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Price (ZMW)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={basePrice}
                    onChange={(event) =>
                      setBasePrice(event.target.value)
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Leave blank if quantity is not tracked.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#03162F]">
                Additional Attributes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Store additional product specifications as
                a JSON object.
              </p>
            </div>

            <textarea
              value={attributes}
              onChange={(event) =>
                setAttributes(event.target.value)
              }
              rows={10}
              spellCheck={false}
              placeholder={`{
  "brand": "HP",
  "model": "EliteBook 840 G8",
  "ram": "16GB",
  "storage": "512GB SSD",
  "warranty": "3 months"
}`}
              className="w-full resize-y rounded-xl border border-slate-300 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </section>
        </div>

        <div>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#03162F]">
                Product Image
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Upload an image customers will see in the
                Technology Shop.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt={name || "Product"}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center text-slate-400">
                  <ImagePlus className="h-12 w-12" />

                  <p className="mt-3 text-sm font-medium">
                    No product image
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <Upload className="h-4 w-4" />

                {imageFile
                  ? "Choose Different Image"
                  : "Choose New Image"}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {imageFile && (
                <p className="mt-3 break-all text-xs text-slate-500">
                  Selected: {imageFile.name}
                </p>
              )}
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Image URL
              </label>

              <input
                type="url"
                value={imageUrl}
                onChange={(event) =>
                  setImageUrl(event.target.value)
                }
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />

              <p className="mt-2 text-xs text-slate-400">
                Upload an image or provide an existing public
                image URL.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#08264D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />

              {uploadingImage
                ? "Uploading Image..."
                : saving
                  ? "Saving Product..."
                  : "Save Product"}
            </button>
          </section>
        </div>
      </div>
    </form>
  );
}
