"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";

import { CatalogField } from "../types/catalog";

interface FieldRendererProps<TFieldValues extends FieldValues> {
  field: CatalogField;

  register: UseFormRegister<TFieldValues>;
}

export default function FieldRenderer<TFieldValues extends FieldValues>({
  field,
  register,
}: FieldRendererProps<TFieldValues>) {
  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          label={field.label}
          placeholder={field.placeholder}
          {...register(field.key as FieldPath<TFieldValues>)}
        />
      );

    case "select":
      return (
        <Select
          label={field.label}
          placeholder={field.placeholder}
          options={field.options ?? []}
          {...register(field.key as FieldPath<TFieldValues>)}
        />
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            {...register(field.key as FieldPath<TFieldValues>)}
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
          {...register(field.key as FieldPath<TFieldValues>)}
        />
      );

    case "currency":
      return (
        <Input
          type="number"
          label={field.label}
          placeholder="0.00"
          {...register(field.key as FieldPath<TFieldValues>)}
        />
      );

    case "date":
      return (
        <Input
          type="date"
          label={field.label}
          {...register(field.key as FieldPath<TFieldValues>)}
        />
      );

    case "image":
      return (
        <Input
          label={field.label}
          placeholder="Image URL"
          {...register(field.key as FieldPath<TFieldValues>)}
        />
      );

    default:
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder}
          {...register(field.key as FieldPath<TFieldValues>)}
        />
      );
  }
}
