"use client";

import { useForm } from "react-hook-form";

import { BusinessCatalogSchema } from "../types/catalog";
import FieldRenderer from "./FieldRenderer";

import { SubmitButton } from "@/components/ui/submit-button";

interface CatalogFormProps {
  schema: BusinessCatalogSchema;

  onSubmit: (data: any) => Promise<void>;
}

export default function CatalogForm({
  schema,
  onSubmit,
}: CatalogFormProps) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {schema.fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          register={register}
        />
      ))}

      <div className="flex justify-end">
        <SubmitButton loading={isSubmitting}>
          Save {schema.title}
        </SubmitButton>
      </div>
    </form>
  );
}