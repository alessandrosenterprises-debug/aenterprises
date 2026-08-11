import { BusinessCatalogSchema } from "../types/catalog";

const COMMON_FIELDS = [
  "business_id",
  "item_type",
  "category",
  "name",
  "description",
  "base_price",
  "quantity",
  "status",
  "image_url",
];

export function buildCatalogPayload(
  formData: Record<string, any>,
  schema: BusinessCatalogSchema | null
) {
  const payload: Record<string, any> = {};

  // Copy common fields
  COMMON_FIELDS.forEach((field) => {
    payload[field] = formData[field];
  });

  // Build dynamic attributes
  const attributes: Record<string, any> = {};

  if (schema) {
    schema.fields.forEach((field) => {
      attributes[field.key] = formData[field.key] ?? null;
    });
  }

  payload.attributes = attributes;

  return payload;
}