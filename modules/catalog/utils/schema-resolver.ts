import { getCatalogSchema } from "../schemas";
import { BusinessCatalogSchema } from "../types/catalog";

export function resolveCatalogSchema(
  businessName: string
): BusinessCatalogSchema | null {
  const normalized = businessName
    .toLowerCase()
    .replace("alessandro", "")
    .trim()
    .replace(/\s+/g, "-");

  return getCatalogSchema(normalized);
}