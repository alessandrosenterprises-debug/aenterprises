export type CatalogFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "select"
  | "date"
  | "checkbox"
  | "image";

export interface CatalogField {
  key: string;
  label: string;
  type: CatalogFieldType;
  required?: boolean;

  placeholder?: string;

  options?: {
    label: string;
    value: string;
  }[];
}

export interface BusinessCatalogSchema {
  business: string;

  title: string;

  itemType:
    | "product"
    | "service"
    | "financial";

  fields: CatalogField[];
}