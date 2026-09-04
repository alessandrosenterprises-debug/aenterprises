import type { CatalogItem } from "../types/catalog";

export function formatCatalogPrice(
  item: CatalogItem,
): string | null {
  if (
    item.base_price === null ||
    item.base_price === undefined
  ) {
    return null;
  }

  return `K${Number(item.base_price).toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getCatalogAttribute(
  item: CatalogItem,
  key: string,
): string | null {
  const value = item.attributes?.[key];

  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}