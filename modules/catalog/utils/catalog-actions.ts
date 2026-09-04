import type { CatalogItem } from "../types/catalog";

export type CatalogAction =
  | "ORDER"
  | "BOOK"
  | "APPLY";

export function getCatalogAction(
  item: CatalogItem,
): CatalogAction {
  switch (item.item_type) {
    case "product":
      return "ORDER";

    case "service":
      return "BOOK";

    case "financial":
      return "APPLY";

    default:
      return "ORDER";
  }
}