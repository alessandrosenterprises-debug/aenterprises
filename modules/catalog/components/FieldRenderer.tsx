"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

import { CatalogField } from "../types/catalog";

interface FieldRendererProps {
  field: CatalogField;

  register: any;
}

export default function FieldRenderer({
  field,
  register,
}: FieldRendererProps) {
  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          label={field.label}
          placeholder={field.placeholder}
          {...register(field.key)}
        />
      );

    case "select":
      return (
        <Select
          label={field.label}
          placeholder={field.placeholder}
          options={field.options ?? []}
          {...register(field.key)}
        />
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            {...register(field.key)}
          />

          <span>{field.label}</span>
        </label>
      );

    case "number":
      return (
        <Input
          type="number"
          label={field.label}
          placeholder={field.placeholder}
          {...register(field.key)}
        />
      );

    case "currency":
      return (
        <Input
          type="number"
          label={field.label}
          placeholder="0.00"
          {...register(field.key)}
        />
      );

    case "date":
      return (
        <Input
          type="date"
          label={field.label}
          {...register(field.key)}
        />
      );

    case "image":
      return (
        <Input
          label={field.label}
          placeholder="Image URL"
          {...register(field.key)}
        />
      );

    default:
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder}
          {...register(field.key)}
        />
      );
  }
}