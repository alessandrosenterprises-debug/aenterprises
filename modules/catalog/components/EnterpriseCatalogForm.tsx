"use client";
import {
  createEnterpriseCatalogItem,
  updateEnterpriseCatalogItem,
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

interface Business {
  id: string;
  name: string;
}

interface EnterpriseCatalogFormProps {
  businesses: Business[];
  mode?: "create" | "edit";
  item?: any;
  onSuccess?: () => void;
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
  mode = "create",
  item,
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
    formState: { isSubmitting },
  } = useForm<CatalogFormData>({
    defaultValues: {
      business_id: item?.business_id ?? "",
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
  const imageUrl = watch("image_url");

  useEffect(() => {
    const business =
      businesses.find((b) => b.id === businessId);

    if (!business) {
      setSchema(null);
      return;
    }

    const resolvedSchema =
      resolveCatalogSchema(business.name);

    setSchema(resolvedSchema);

    if (resolvedSchema) {
      setValue("item_type", resolvedSchema.itemType);
    }
  }, [businessId, businesses, setValue]);

  const businessOptions = useMemo(
    () =>
      businesses.map((business) => ({
        label: business.name,
        value: business.id,
      })),
    [businesses]
  );

  async function onSubmit(data: CatalogFormData) {
  try {
    const payload = buildCatalogPayload(
      data as Record<string, any>,
      schema
    );

    if (mode === "create") {
      await createEnterpriseCatalogItem(payload);
    } else if (item?.id) {
      await updateEnterpriseCatalogItem(
        item.id,
        payload
      );
    }

    toast.success(
      mode === "create"
        ? "Catalog item created successfully."
        : "Catalog item updated successfully."
    );

    router.refresh();

    onSuccess?.();
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
        <Select
          label="Business"
          placeholder="Select Business"
          options={businessOptions}
          {...register("business_id")}
        />

        <Input
          label="Item Type"
          readOnly
          {...register("item_type")}
        />

        <Input
          label="Category"
          placeholder="Category"
          {...register("category")}
        />

        <Input
          label="Name"
          placeholder="Item Name"
          {...register("name")}
        />

        <Input
          type="number"
          label="Base Price (ZMW)"
          placeholder="0.00"
          {...register("base_price", {
            valueAsNumber: true,
          })}
        />

        <Input
          type="number"
          label="Quantity"
          placeholder="0"
          {...register("quantity", {
            valueAsNumber: true,
          })}
        />

        <Input
          label="Status"
          placeholder="Active"
          {...register("status")}
        />

        <div className="md:col-span-2">
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    Product Image
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

      {schema && (
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