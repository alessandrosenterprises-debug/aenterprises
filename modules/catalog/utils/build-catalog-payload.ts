import type { EnterpriseCatalogPayload } from "../services/enterprise-catalog.client";
import type { BusinessCatalogSchema } from "../types/catalog";

export function buildCatalogPayload(
  formData: Record<string, unknown>,
  schema: BusinessCatalogSchema | null
): EnterpriseCatalogPayload {
  const attributes: Record<string, unknown> = {};

  if (schema) {
    schema.fields.forEach((field) => {
      attributes[field.key] =
        formData[field.key] ?? null;
    });
  }

  const rawBasePrice = formData.base_price;
  const basePrice =
    rawBasePrice === "" ||
    rawBasePrice === undefined ||
    rawBasePrice === null ||
    Number.isNaN(Number(rawBasePrice))
      ? null
      : Number(rawBasePrice);

  const rawQuantity = formData.quantity;
  const quantity =
    rawQuantity === "" ||
    rawQuantity === undefined ||
    rawQuantity === null ||
    Number.isNaN(Number(rawQuantity))
      ? null
      : Number(rawQuantity);

  return {
    business_id: String(formData.business_id ?? ""),

    item_type: String(formData.item_type ?? ""),

    category: String(formData.category ?? "") || null,

    name: String(formData.name ?? ""),

    description: String(formData.description ?? "") || null,

    base_price: basePrice,

    quantity,

    status: String(formData.status ?? "Active"),

    image_url: String(formData.image_url ?? "") || null,

    attributes,
  };
}
