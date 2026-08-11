import { getCatalogSchema } from "../schemas";
import { BusinessCatalogSchema } from "../types/catalog";

export function resolveBusinessSchema(
  businessName: string
): BusinessCatalogSchema | null {
  const key = businessName
    .toLowerCase()
    .replace("alessandro", "")
    .trim()
    .replace(/\s+/g, "-");

  return getCatalogSchema(key);
}