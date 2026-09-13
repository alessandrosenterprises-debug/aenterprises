"use client";

import {
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Save,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";

interface Service {
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
  service: Service;
  categories: string[];
}

export default function EditServiceForm({
  service,
  categories,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState(service.name);
  const [category, setCategory] = useState(
    service.category ?? ""
  );
  const [description, setDescription] = useState(
    service.description ?? ""
  );
  const [price, setPrice] = useState(
    service.base_price !== null
      ? String(service.base_price)
      : ""
  );
  const [status, setStatus] = useState(
    service.status || "Active"
  );
  const [quantity, setQuantity] = useState(
    service.quantity !== null
      ? String(service.quantity)
      : ""
  );
  const [imageUrl, setImageUrl] = useState(
    service.image_url ?? ""
  );

  const [attributesText, setAttributesText] =
    useState(() => {
      if (
        !service.attributes ||
        Object.keys(service.attributes).length === 0
      ) {
        return "";
      }

      try {
        return JSON.stringify(
          service.attributes,
          null,
          2
        );
      } catch {
        return "";
      }
    });

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );
  const [success, setSuccess] = useState(false);

  /*
   * ------------------------------------------------------------
   * IMAGE SELECTION
   * ------------------------------------------------------------
   */

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;

    setImageFile(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  }

  /*
   * ------------------------------------------------------------
   * SAVE
   * ------------------------------------------------------------
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Service name is required.");
      return;
    }

    let parsedAttributes:
      | Record<string, unknown>
      | null = service.attributes ?? null;

    if (attributesText.trim()) {
      try {
        const parsed = JSON.parse(attributesText);

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
    } else {
      parsedAttributes = null;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let finalImageUrl = service.image_url;

      /*
       * --------------------------------------------------------
       * IMAGE UPLOAD
       *
       * Uses the existing Supabase Storage setup.
       * The upload is attempted only when a new image
       * has actually been selected.
       * --------------------------------------------------------
       */

      if (imageFile) {
        const extension =
          imageFile.name.split(".").pop() || "jpg";

        const filePath = `tech-solutions/services/${service.id}-${Date.now()}.${extension}`;

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

        const {
          data: publicUrlData,
        } = supabase.storage
          .from("business-assets")
          .getPublicUrl(filePath);

        finalImageUrl =
          publicUrlData.publicUrl;
      }

      /*
       * --------------------------------------------------------
       * UPDATE ENTERPRISE CATALOG
       * --------------------------------------------------------
       */

      const numericPrice =
        price.trim() === ""
          ? null
          : Number(price);

      if (
        numericPrice !== null &&
        (!Number.isFinite(numericPrice) ||
          numericPrice < 0)
      ) {
        throw new Error(
          "Service price must be a valid positive number."
        );
      }

      const numericQuantity =
        quantity.trim() === ""
          ? null
          : Number(quantity);

      if (
        numericQuantity !== null &&
        (!Number.isFinite(numericQuantity) ||
          numericQuantity < 0)
      ) {
        throw new Error(
          "Quantity must be a valid positive number."
        );
      }

      const { error: updateError } =
        await supabase
          .from("enterprise_catalog")
          .update({
            name: name.trim(),
            category:
              category.trim() || null,
            description:
              description.trim() || null,
            base_price: numericPrice,
            quantity: numericQuantity,
            status,
            image_url: finalImageUrl,
            attributes: parsedAttributes,
          })
          .eq("id", service.id)
          .eq("business_id", service.business_id)
          .eq("item_type", "service");

      if (updateError) {
        throw new Error(
          `Unable to save service: ${updateError.message}`
        );
      }

      setSuccess(true);

      /*
       * Give the user a moment to see the success state,
       * then return to the real service page.
       */

      setTimeout(() => {
        router.push(
          `/dashboard/enterprise/tech-solutions/services/${service.id}`
        );

        router.refresh();
      }, 700);
    } catch (saveError) {
      console.error(
        "AEOS Tech Solutions service update error:",
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save service."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-7"
    >
      {/* --------------------------------------------------------
          ERROR
      --------------------------------------------------------- */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">
              Unable to save service
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------
          SUCCESS
      --------------------------------------------------------- */}

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />

          <div>
            <p className="font-bold">
              Service updated successfully
            </p>

            <p className="text-sm">
              Returning to the service workspace...
            </p>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------
          BASIC INFORMATION
      --------------------------------------------------------- */}

      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Basic Information
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#03162F]">
            Service Details
          </h2>
        </div>

        <div className="mt-7 grid gap-6">
          {/* NAME */}

          <div>
            <label
              htmlFor="service-name"
              className="text-sm font-bold text-[#03162F]"
            >
              Service Name
            </label>

            <input
              id="service-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              placeholder="Enter service name"
            />
          </div>

          {/* CATEGORY */}

          <div>
            <label
              htmlFor="service-category"
              className="text-sm font-bold text-[#03162F]"
            >
              Category
            </label>

            <select
              id="service-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
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

          {/* DESCRIPTION */}

          <div>
            <label
              htmlFor="service-description"
              className="text-sm font-bold text-[#03162F]"
            >
              Description
            </label>

            <textarea
              id="service-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={7}
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              placeholder="Describe this service..."
            />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------
          PRICE / AVAILABILITY
      --------------------------------------------------------- */}

      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Commercial Information
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#03162F]">
            Price & Availability
          </h2>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-3">
          {/* PRICE */}

          <div>
            <label
              htmlFor="service-price"
              className="text-sm font-bold text-[#03162F]"
            >
              Price (ZMW)
            </label>

            <input
              id="service-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) =>
                setPrice(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              placeholder="0.00"
            />

            <p className="mt-2 text-xs text-slate-400">
              Enter the customer-facing price in Zambian
              Kwacha.
            </p>
          </div>

          {/* QUANTITY */}

          <div>
            <label
              htmlFor="service-quantity"
              className="text-sm font-bold text-[#03162F]"
            >
              Quantity / Capacity
            </label>

            <input
              id="service-quantity"
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              placeholder="Optional"
            />

            <p className="mt-2 text-xs text-slate-400">
              Leave empty when quantity does not apply.
            </p>
          </div>

          {/* STATUS */}

          <div>
            <label
              htmlFor="service-status"
              className="text-sm font-bold text-[#03162F]"
            >
              Status
            </label>

            <select
              id="service-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            >
              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>

              <option value="Draft">
                Draft
              </option>
            </select>

            <p className="mt-2 text-xs text-slate-400">
              Active services are available to customers.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------
          IMAGE
      --------------------------------------------------------- */}

      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Service Media
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#03162F]">
            Service Image
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Add an image that represents this service on the
            customer-facing Tech Solutions experience.
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* PREVIEW */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Service preview"
                className="aspect-[4/3] h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />

                  <p className="mt-3 text-sm font-semibold text-slate-400">
                    No image
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* UPLOAD */}

          <div>
            <label
              htmlFor="service-image"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-[#D4AF37] hover:bg-white"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#03162F] text-white">
                <Upload className="h-6 w-6" />
              </div>

              <p className="mt-4 font-bold text-[#03162F]">
                Choose a new service image
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Select an image from your computer.
              </p>

              <span className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#03162F]">
                Browse Image
              </span>

              <input
                id="service-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {imageFile && (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Selected: {imageFile.name}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------
          ATTRIBUTES
      --------------------------------------------------------- */}

      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Advanced Information
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#03162F]">
            Additional Attributes
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Optional structured information stored with this
            service. Use valid JSON when adding attributes.
          </p>
        </div>

        <textarea
          value={attributesText}
          onChange={(event) =>
            setAttributesText(event.target.value)
          }
          rows={12}
          spellCheck={false}
          className="mt-7 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-mono text-sm leading-6 text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
          placeholder={`{
  "duration": "2 hours",
  "includes": "Installation and setup"
}`}
        />
      </section>

      {/* --------------------------------------------------------
          ACTIONS
      --------------------------------------------------------- */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/dashboard/enterprise/tech-solutions/services/${service.id}`
            )
          }
          disabled={saving}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-[#03162F] transition hover:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Service
            </>
          )}
        </button>
      </div>
    </form>
  );
}