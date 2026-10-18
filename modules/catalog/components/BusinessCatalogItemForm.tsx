"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createEnterpriseCatalogItem, updateEnterpriseCatalogItem, type EnterpriseCatalogPayload } from "../services/enterprise-catalog.client";
import type { BusinessCatalogRecord, BusinessCatalogBusiness } from "../services/business-catalog-admin.service";
import { resolveCatalogSchema } from "../utils/schema-resolver";
import DynamicCatalogFields from "./DynamicCatalogFields";

interface FormData {
  business_id: string;
  item_type: string;
  category: string;
  name: string;
  description: string;
  base_price: number;
  quantity: number;
  status: string;
  image_url: string;
  [key: string]: unknown;
}

export default function BusinessCatalogItemForm({
  business,
  collectionUrl,
  item,
  categories = [],
}: {
  business: BusinessCatalogBusiness;
  collectionUrl: string;
  item?: BusinessCatalogRecord;
  categories?: string[];
}) {
  const router = useRouter();
  const schema = useMemo(() => resolveCatalogSchema(business.slug), [business.slug]);
  const itemType = item?.item_type || schema?.itemType || "product";
  const isService = itemType === "service";
  const isEdit = Boolean(item);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      ...(item?.attributes ?? {}),
      business_id: business.id,
      item_type: itemType,
      name: item?.name ?? "",
      category: item?.category ?? "",
      description: item?.description ?? "",
      base_price: item?.base_price ?? (isService ? 0 : undefined),
      quantity: item?.quantity ?? undefined,
      status: item?.status?.toLowerCase() ?? "active",
      image_url: item?.image_url ?? "",
    },
  });

  async function onSubmit(values: FormData) {
    const payload: EnterpriseCatalogPayload = {
      business_id: business.id,
      item_type: itemType,
      category: values.category?.trim() || null,
      name: values.name?.trim() || "",
      description: values.description?.trim() || null,
      base_price: values.base_price === undefined || Number.isNaN(values.base_price) ? null : Number(values.base_price),
      quantity: isService || values.quantity === undefined || Number.isNaN(values.quantity) ? null : Number(values.quantity),
      status: values.status || "active",
      image_url: values.image_url?.trim() || null,
      attributes: schema ? Object.fromEntries(schema.fields.map((field) => [field.key, values[field.key] ?? null])) : {},
    };
    try {
      const saved = isEdit && item
        ? await updateEnterpriseCatalogItem(item.id, payload)
        : await createEnterpriseCatalogItem(payload);
      toast.success(isEdit ? `${isService ? "Service" : "Product"} updated successfully.` : `${isService ? "Service" : "Product"} created successfully.`);
      router.push(`${collectionUrl}/${saved.id}`);
      router.refresh();
    } catch (error) {
      console.error("Business catalog save failed:", error);
      toast.error(error instanceof Error ? error.message : `Unable to ${isEdit ? "update" : "create"} this ${isService ? "service" : "product"}.`);
    }
  }

  return <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
    <input type="hidden" {...register("business_id")} />
    <input type="hidden" {...register("item_type")} />
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#03162F] text-white">{isService ? "S" : "P"}</div><div><h2 className="text-xl font-black text-[#03162F]">{isService ? "Service Information" : "Product Information"}</h2><p className="mt-1 text-sm text-slate-500">{isService ? `Enter the details customers and staff use for this ${business.name} service.` : `Enter the basic information for this ${business.name} product.`}</p></div></div></div>
      <div className="grid gap-6 p-6 md:grid-cols-2">
        <div className="md:col-span-2"><label htmlFor="name" className="mb-2 block text-sm font-bold text-[#03162F]">{isService ? "Service Name" : "Product Name"}{isService && " *"}</label><input id="name" required {...register("name", { required: true })} placeholder={isService ? "e.g. Haircut" : "e.g. Classic Denim Jacket"} className={fieldClass} /></div>
        <div><label htmlFor="category" className="mb-2 block text-sm font-bold text-[#03162F]">Category</label><input id="category" list={`catalog-categories-${business.id}`} {...register("category")} placeholder={isService ? "e.g. Haircut" : "e.g. Clothing"} className={fieldClass} /><datalist id={`catalog-categories-${business.id}`}>{categories.map((category) => <option key={category} value={category} />)}</datalist><p className="mt-1.5 text-xs text-slate-500">Choose a managed category or enter a new one.</p></div>
        <div><label htmlFor="status" className="mb-2 block text-sm font-bold text-[#03162F]">Status</label><select id="status" {...register("status")} className={fieldClass}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <div><label htmlFor="base_price" className="mb-2 block text-sm font-bold text-[#03162F]">{isService ? "Service Price (ZMW) *" : "Price"}</label><div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ZMW</span><input id="base_price" type="number" min="0" step="0.01" required={isService} {...register("base_price", { valueAsNumber: true })} placeholder="0.00" className={`${fieldClass} pl-16`} /></div><p className="mt-2 text-xs text-slate-400">{isService ? "Enter the standard customer price in Zambian Kwacha." : "Leave empty if the price has not been set."}</p></div>
        {!isService && <div><label htmlFor="quantity" className="mb-2 block text-sm font-bold text-[#03162F]">Quantity</label><input id="quantity" type="number" min="0" step="1" {...register("quantity", { valueAsNumber: true })} placeholder="e.g. 25" className={fieldClass} /><p className="mt-2 text-xs text-slate-400">Enter the available stock quantity.</p></div>}
        <div className="md:col-span-2"><label htmlFor="description" className="mb-2 block text-sm font-bold text-[#03162F]">Description</label><textarea id="description" rows={5} {...register("description")} placeholder={isService ? "Describe the service for customers." : "Describe the product, its features, or other useful information."} className={`${fieldClass} resize-y leading-6`} /></div>
        <div className="md:col-span-2"><label htmlFor="image_url" className="mb-2 block text-sm font-bold text-[#03162F]">{isService ? "Service Image URL" : "Product Image URL"}</label><input id="image_url" type="url" {...register("image_url")} placeholder="https://example.com/image.jpg" className={fieldClass} /><p className="mt-2 text-xs text-slate-400">Optional. Use a publicly accessible image URL.</p></div>
      </div>
    </section>
    {schema?.fields.length ? <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><DynamicCatalogFields schema={schema} register={register} /></section> : null}
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => router.push(collectionUrl)} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#03162F]">Cancel</button><button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl bg-[#03162F] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0A2852] disabled:opacity-60">{isSubmitting ? "Saving…" : isEdit ? `Save ${isService ? "Service" : "Product"}` : `Create ${isService ? "Service" : "Product"}`}</button></div>
  </form>;
}

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";
