import type { EnterpriseCatalogPayload } from "../services/enterprise-catalog.client";
import type { BusinessCatalogSchema } from "../types/catalog";

export function buildCatalogPayload(
  formData: Record<string, any>,
  schema: BusinessCatalogSchema | null
): EnterpriseCatalogPayload {
  const attributes: Record<string, any> = {};

  if (schema) {
    schema.fields.forEach((field) => {
      attributes[field.key] =
        formData[field.key] ?? null;
    });
  }

  return {
    business_id: String(
      formData.business_id ?? ""
    ),
    item_type: String(
      formData.item_type ?? ""
    ),
    category:
      formData.category ?? null,
    name: String(
      formData.name ?? ""
    ),
    description:
      formData.description ?? null,
    base_price: Number(
      formData.base_price ?? 0
    ),
    quantity: Number(
      formData.quantity ?? 0
    ),
    status: String(
      formData.status ?? "Active"
    ),
    image_url:
      formData.image_url ?? null,
    attributes,
  };
}