"use client";

import { useForm } from "react-hook-form";
import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import ImageUpload from "@/components/ui/image-upload/ImageUpload";

import { ConfigurationSchema } from "../types/configuration";

interface ConfigurationFormProps {
  schema: ConfigurationSchema;

  defaultValues?: Record<string, any>;

  onSubmit: (values: Record<string, any>) => Promise<void>;
}

export default function ConfigurationForm({
  schema,
  defaultValues,
  onSubmit,
}: ConfigurationFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    defaultValues,
  });

  const values = watch();

  const fields = useMemo(() => schema.fields, [schema]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
    >
      <div className="grid gap-6 md:grid-cols-2">

        {fields.map((field) => {

          switch (field.type) {

            case "text":
            case "number":
            case "currency":
              return (
                <Input
                  key={field.key}
                  label={field.label}
                  type={
                    field.type === "text"
                      ? "text"
                      : "number"
                  }
                  placeholder={field.placeholder}
                  {...register(field.key)}
                />
              );

            case "textarea":
              return (
                <Textarea
                  key={field.key}
                  label={field.label}
                  placeholder={field.placeholder}
                  {...register(field.key)}
                />
              );

            case "select":
              return (
                <Select
                  key={field.key}
                  label={field.label}
                  options={field.options ?? []}
                  {...register(field.key)}
                />
              );

            case "checkbox":
case "boolean":
              return (
                <label
                  key={field.key}
                  className="flex items-center gap-3 rounded-xl border p-4"
                >
                  <input
                    type="checkbox"
                    {...register(field.key, {
  valueAsNumber: true,
})}
                  />

                  {field.label}
                </label>
              );

            case "image":
              return (
                <div
                  key={field.key}
                  className="md:col-span-2"
                >
                  <label className="mb-2 block text-sm font-semibold">
                    {field.label}
                  </label>

                  <ImageUpload
                    value={values[field.key]}
                    onChange={(url) =>
                      setValue(field.key, url)
                    }
                  />
                </div>
              );

            default:
              return null;
          }
        })}

      </div>

      <div className="flex justify-end">
        <SubmitButton loading={isSubmitting}>
          Save {schema.title}
        </SubmitButton>
      </div>
    </form>
  );
}