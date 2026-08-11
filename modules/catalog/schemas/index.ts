import { fashionSchema } from "./fashion";
import { BusinessCatalogSchema } from "../types/catalog";

export const catalogSchemas: Record<
  string,
  BusinessCatalogSchema
> = {
  fashion: fashionSchema,
};

export function getCatalogSchema(
  business: string
): BusinessCatalogSchema | null {
  return catalogSchemas[business] ?? null;
}