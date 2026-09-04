// modules/catalog/types/catalog.ts

export type CatalogFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "select"
  | "checkbox"
  | "date"
  | "time"
  | "email"
  | "phone"
  | "url"
  | "image";

export interface CatalogFieldOption {
  label: string;
  value: string;
}

export interface CatalogField {
  key: string;
  label: string;
  type: CatalogFieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  defaultValue?: string | number | boolean | null;
  options?: CatalogFieldOption[];
}

export interface BusinessCatalogSchema {
  business: string;
  title: string;
  itemType: string;
  fields: CatalogField[];
}

export interface CatalogItem {
  id: string;
  business_id: string;
  item_type: string;
  category: string | null;
  name: string;
  description: string | null;
  base_price: number | null;
  quantity: number | null;
  status: string | null;
  image_url: string | null;
  attributes: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogItemInsert {
  business_id: string;
  item_type: string;
  category?: string | null;
  name: string;
  description?: string | null;
  base_price?: number | null;
  quantity?: number | null;
  status?: string | null;
  image_url?: string | null;
  attributes?: Record<string, unknown> | null;
}

export interface CatalogItemUpdate {
  business_id?: string;
  item_type?: string;
  category?: string | null;
  name?: string;
  description?: string | null;
  base_price?: number | null;
  quantity?: number | null;
  status?: string | null;
  image_url?: string | null;
  attributes?: Record<string, unknown> | null;
}