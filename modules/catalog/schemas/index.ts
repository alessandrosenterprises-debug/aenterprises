import { fashionSchema } from "./fashion";
import { techSchema } from "./tech-solutions";
import { barbershopSchema } from "./barbershop";
import { mobileMoneySchema } from "./mobile-money";
import { softLoansSchema } from "./soft-loans";

import { BusinessCatalogSchema } from "../types/catalog";

export const catalogSchemas: Record<
  string,
  BusinessCatalogSchema
> = {
  fashion: fashionSchema,
  "tech-solutions": techSchema,
  "classic-barbershop": barbershopSchema,
  "mobile-money": mobileMoneySchema,
  "soft-loans": softLoansSchema,
};

export function getCatalogSchema(
  business: string
): BusinessCatalogSchema | null {
  return catalogSchemas[business] ?? null;
}