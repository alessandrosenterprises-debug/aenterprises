"use client";

import { FieldValues, UseFormRegister } from "react-hook-form";

import { BusinessCatalogSchema } from "../types/catalog";
import FieldRenderer from "./FieldRenderer";

interface DynamicCatalogFieldsProps<TFieldValues extends FieldValues> {
  schema: BusinessCatalogSchema;

  register: UseFormRegister<TFieldValues>;
}

export default function DynamicCatalogFields<TFieldValues extends FieldValues>({
  schema,
  register,
}: DynamicCatalogFieldsProps<TFieldValues>) {
  if (!schema.fields.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="border-t border-slate-200 pt-6">
        <h3 className="mb-2 text-lg font-semibold text-[#03162F]">
          {schema.title} Details
        </h3>

        <p className="mb-6 text-sm text-slate-500">
          Complete the fields below for this business.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {schema.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              register={register}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
