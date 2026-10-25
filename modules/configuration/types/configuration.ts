export type ConfigurationFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "select"
  | "checkbox"
  | "boolean"
  | "date"
  | "email"
  | "phone"
  | "image";

// React Hook Form's FieldValues is the shared indexable shape used by the
// schema-driven configuration forms and their table rows.
export type ConfigurationValues = import("react-hook-form").FieldValues;

export interface ConfigurationField {
  key: string;

  label: string;

  type: ConfigurationFieldType;

  required?: boolean;

  placeholder?: string;

  min?: number;

  step?: number | "any";

  options?: {
    label: string;
    value: string;
  }[];
}

export interface ConfigurationSchema {
  table: string;

  title: string;

  description?: string;

  fields: ConfigurationField[];
}
