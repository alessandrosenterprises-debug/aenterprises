export type ConfigurationFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "select"
  | "checkbox"
  | "date"
  | "image";

export interface ConfigurationField {
  key: string;

  label: string;

  type: ConfigurationFieldType;

  required?: boolean;

  placeholder?: string;

  options?: {
    label: string;
    value: string;
  }[];
}

export interface ConfigurationSchema {
  key: string;

  title: string;

  description?: string;

  fields: ConfigurationField[];
}