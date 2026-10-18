"use client";
import {
  createEnterpriseCatalogItem,
  updateEnterpriseCatalogItem,
  EnterpriseCatalogPayload,
} from "../services/enterprise-catalog.client";
import ImageUpload from "@/components/ui/image-upload/ImageUpload";
import { buildCatalogPayload } from "../utils/build-catalog-payload";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

import DynamicCatalogFields from "./DynamicCatalogFields";

import { resolveCatalogSchema } from "../utils/schema-resolver";
import { BusinessCatalogSchema } from "../types/catalog";
import type { EnterpriseCatalogItem } from "../types/enterprise-catalog";

interface Business {
  id: string;
  name: string;
  slug?: string;
}

interface EnterpriseCatalogFormProps {
  businesses: Business[];
  categories?: string[];
  mode?: "create" | "edit";
  item?: EnterpriseCatalogItem;
  lockedBusinessId?: string;
  onSuccess?: (savedItemId: string) => void;
}

interface CatalogFormData {
  business_id: string;
  item_type: string;
  category: string;
  name: string;
  description: string;
  base_price: number;
  quantity: number;
  status: string;
  image_url: string;
}

export default function EnterpriseCatalogForm({
  businesses,
  categories = [],
  mode = "create",
  item,
  lockedBusinessId,
  onSuccess,
}: EnterpriseCatalogFormProps) {
  const router = useRouter();

  const [schema, setSchema] =
    useState<BusinessCatalogSchema | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<CatalogFormData>({
    defaultValues: {
      ...((item?.attributes && typeof item.attributes === "object") ? item.attributes : {}),
      business_id: item?.business_id ?? lockedBusinessId ?? "",
      item_type: item?.item_type ?? "",
      category: item?.category ?? "",
      name: item?.name ?? "",
      description: item?.description ?? "",
      base_price: item?.base_price ?? 0,
      quantity: item?.quantity ?? 0,
      status: item?.status ?? "Active",
      image_url: item?.image_url ?? "",
    },
  });

  const businessId = watch("business_id");
  const itemType = watch("item_type");
  const imageUrl = watch("image_url");

  useEffect(() => {
    reset({
      ...((item?.attributes && typeof item.attributes === "object") ? item.attributes : {}),
      business_id: item?.business_id ?? lockedBusinessId ?? "",
      item_type: item?.item_type ?? "",
      category: item?.category ?? "",
      name: item?.name ?? "",
      description: item?.description ?? "",
      base_price: item?.base_price ?? 0,
      quantity: item?.quantity ?? 0,
      status: item?.status ?? "Active",
      image_url: item?.image_url ?? "",
    });
  }, [item, lockedBusinessId, reset]);

  useEffect(() => {
    const business =
      businesses.find((b) => b.id === businessId);

    if (!business) {
      setSchema(null);
      return;
    }

    const resolvedSchema =
      resolveCatalogSchema(business.slug ?? business.name);

    setSchema(resolvedSchema);

    if (resolvedSchema && !(mode === "edit" && item?.business_id === businessId)) {
      setValue("item_type", resolvedSchema.itemType);
    }
  }, [businessId, businesses, item?.business_id, mode, setValue]);

  const businessOptions = useMemo(
    () =>
      businesses.map((business) => ({
        label: business.name,
        value: business.id,
      })),
    [businesses]
  );

  const itemTypeOptions = useMemo(() => {
    const selectedBusiness = businesses.find((business) => business.id === businessId);
    const selectedSchema = selectedBusiness
      ? resolveCatalogSchema(selectedBusiness.slug ?? selectedBusiness.name)
      : null;
    if (!selectedSchema) return [];
    // Tech Solutions provides both retail products and bookable services.
    if (selectedSchema.business === "tech-solutions") {
      return [
        { label: "Product", value: "product" },
        { label: "Service", value: "service" },
      ];
    }
    return [{
      label: selectedSchema.itemType === "financial" ? "Financial offer" : selectedSchema.itemType,
      value: selectedSchema.itemType,
    }];
  }, [businessId, businesses]);

  async function onSubmit(data: CatalogFormData) {
  try {
  if (!data.business_id || !data.name.trim()) {
    toast.error("Choose a business and enter an item name.");
    return;
  }
  const matchingSchema = schema?.itemType === data.item_type ? schema : null;
  const payload: EnterpriseCatalogPayload = buildCatalogPayload(
    data as unknown as Record<string, unknown>,
    matchingSchema,
  );

    let savedItemId = item?.id as string | undefined;
    if (mode === "create") {
      const createdItem = await createEnterpriseCatalogItem(payload);
      savedItemId = createdItem.id;
    } else if (item?.id) {
      const updatedItem = await updateEnterpriseCatalogItem(
        item.id,
        payload
      );
      savedItemId = updatedItem.id;
    }

    toast.success(
      mode === "create"
        ? "Catalog item created successfully."
        : "Catalog item updated successfully."
    );

    router.refresh();

    if (savedItemId) onSuccess?.(savedItemId);
  } catch (error) {
    console.error(error);

    toast.error(
      mode === "create"
        ? "Failed to create catalog item."
        : "Failed to update catalog item."
    );
  }
}

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {lockedBusinessId ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Business</p>
            <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-[#03162F]">
              {businesses.find((business) => business.id === lockedBusinessId)?.name ?? "Selected business"}
            </div>
            <input type="hidden" {...register("business_id")} />
          </div>
        ) : (
          <Select
            label="Business"
            placeholder="Select Business"
            options={businessOptions}
            {...register("business_id")}
          />
        )}

        <Select
          label="Item Type"
          options={itemTypeOptions}
          required
          {...register("item_type")}
        />

        <Input
          label="Category"
          placeholder="Category"
          list="enterprise-catalog-categories"
          {...register("category")}
        />
        <datalist id="enterprise-catalog-categories">
          {categories.map((category) => <option key={category} value={category} />)}
        </datalist>

        <Input
          label="Name"
          placeholder="Item Name"
          required
          {...register("name")}
        />

        <Input
          type="number"
          label={itemType === "service" ? "Service Price (ZMW)" : itemType === "financial" ? "Starting Amount (ZMW)" : "Unit Price (ZMW)"}
          placeholder="0.00"
          min={0}
          step="0.01"
          {...register("base_price", {
            valueAsNumber: true,
          })}
        />

        {itemType === "product" && <Input
          type="number"
          label="Quantity"
          placeholder="0"
          min={0}
          step="1"
          {...register("quantity", {
            valueAsNumber: true,
          })}
        />}

        <Select
          label="Status"
          options={[
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ]}
          required
          {...register("status")}
        />

        <div className="md:col-span-2">
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    {itemType === "service" ? "Service Image" : itemType === "financial" ? "Financial Offer Image" : "Product Image"}
  </label>

  <ImageUpload
    value={imageUrl}
    onChange={(url) =>
      setValue("image_url", url, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  />
</div>
      </div>

      <Textarea
        label="Description"
        placeholder="Item description..."
        {...register("description")}
      />

      {schema && schema.itemType === itemType && (
        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#03162F]">
            {schema.title} Details
          </h3>

          <DynamicCatalogFields
  schema={schema}
  register={register}
/>
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton loading={isSubmitting}>
          {mode === "create"
            ? "Create Catalog Item"
            : "Update Catalog Item"}
        </SubmitButton>
      </div>
    </form>
  );
}
