import { EnterpriseCatalogPayload } from "../services/enterprise-catalog.client";
import { BusinessCatalogSchema } from "../types/catalog";

export function buildCatalogPayload(
  values: Record<string, any>,
  schema: BusinessCatalogSchema | null
): EnterpriseCatalogPayload {
  const attributes: Record<string, any> = {};

  if (schema) {
    schema.fields.forEach((field) => {
      attributes[field.key] = values[field.key];
    });
  }

  return {
    business_id: values.business_id,
    item_type: values.item_type,
    category: values.category,
    name: values.name,
    description: values.description,
    base_price: Number(values.base_price),
    quantity: Number(values.quantity),
    status: values.status,
    image_url: values.image_url,
    attributes,
  };
}