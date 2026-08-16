"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import ImageUpload from "@/components/ui/image-upload/ImageUpload";

import { ConfigurationSchema } from "../types/configuration";

interface ConfigurationFormProps {
  schema: ConfigurationSchema;

  defaultValues?: Record<string, any>;

  onSubmit: (
    values: Record<string, any>
  ) => Promise<void>;
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
    reset,
    formState: { isSubmitting },
  } = useForm<Record<string, any>>({
    defaultValues: defaultValues ?? {},
  });

  /*
   * When switching between Create and Edit, make sure
   * react-hook-form receives the correct record.
   */
  useEffect(() => {
    reset(defaultValues ?? {});
  }, [defaultValues, reset]);

  const values = watch();

  function handleFormSubmit(
    submittedValues: Record<string, any>
  ) {
    const cleanedValues: Record<string, any> = {
      ...submittedValues,
    };

    /*
     * Convert empty numeric fields to null instead of
     * sending empty strings to PostgreSQL numeric columns.
     */
    for (const field of schema.fields) {
      if (
        (field.type === "number" ||
          field.type === "currency") &&
        cleanedValues[field.key] === ""
      ) {
        cleanedValues[field.key] = null;
      }

      /*
       * Convert number inputs from strings into numbers.
       */
      if (
        (field.type === "number" ||
          field.type === "currency") &&
        cleanedValues[field.key] !== "" &&
        cleanedValues[field.key] !== null &&
        cleanedValues[field.key] !== undefined
      ) {
        const numberValue = Number(
          cleanedValues[field.key]
        );

        cleanedValues[field.key] = Number.isNaN(
          numberValue
        )
          ? null
          : numberValue;
      }
    }

    return onSubmit(cleanedValues);
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-8"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {schema.fields.map((field) => {
          switch (field.type) {
            /*
             * --------------------------------------------------
             * TEXT
             * --------------------------------------------------
             */
            case "text":
              return (
                <Input
                  key={field.key}
                  label={field.label}
                  type="text"
                  placeholder={field.placeholder}
                  required={field.required}
                  {...register(field.key)}
                />
              );

            /*
             * --------------------------------------------------
             * EMAIL
             * --------------------------------------------------
             */
            case "email":
              return (
                <Input
                  key={field.key}
                  label={field.label}
                  type="email"
                  placeholder={
                    field.placeholder ??
                    "example@email.com"
                  }
                  required={field.required}
                  {...register(field.key)}
                />
              );

            /*
             * --------------------------------------------------
             * PHONE
             * --------------------------------------------------
             */
            case "phone":
              return (
                <Input
                  key={field.key}
                  label={field.label}
                  type="tel"
                  placeholder={
                    field.placeholder ??
                    "+260 XXX XXX XXX"
                  }
                  required={field.required}
                  {...register(field.key)}
                />
              );

            /*
             * --------------------------------------------------
             * NUMBER / CURRENCY
             * --------------------------------------------------
             */
            case "number":
            case "currency":
              return (
                <Input
                  key={field.key}
                  label={field.label}
                  type="number"
                  placeholder={field.placeholder}
                  required={field.required}
                  step={
                    field.type === "currency"
                      ? "0.01"
                      : "any"
                  }
                  {...register(field.key)}
                />
              );

            /*
             * --------------------------------------------------
             * TEXTAREA
             * --------------------------------------------------
             */
            case "textarea":
              return (
                <Textarea
                  key={field.key}
                  label={field.label}
                  placeholder={field.placeholder}
                  required={field.required}
                  {...register(field.key)}
                />
              );

            /*
             * --------------------------------------------------
             * SELECT
             * --------------------------------------------------
             */
            case "select":
              return (
                <Select
                  key={field.key}
                  label={field.label}
                  options={field.options ?? []}
                  required={field.required}
                  {...register(field.key)}
                />
              );

            /*
             * --------------------------------------------------
             * CHECKBOX
             * --------------------------------------------------
             */
            case "checkbox":
            case "boolean":
              return (
                <label
                  key={field.key}
                  className="flex min-h-[58px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300"
                    {...register(field.key)}
                  />

                  <span className="text-sm font-semibold text-slate-700">
                    {field.label}
                  </span>
                </label>
              );

            /*
             * --------------------------------------------------
             * DATE
             * --------------------------------------------------
             */
            case "date":
              return (
                <Input
                  key={field.key}
                  label={field.label}
                  type="date"
                  required={field.required}
                  {...register(field.key)}
                />
              );

            /*
             * --------------------------------------------------
             * IMAGE
             * --------------------------------------------------
             */
            case "image":
              return (
                <div
                  key={field.key}
                  className="md:col-span-2"
                >
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {field.label}
                  </label>

                  <ImageUpload
                    value={values[field.key] ?? ""}
                    onChange={(url) =>
                      setValue(
                        field.key,
                        url,
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        }
                      )
                    }
                  />
                </div>
              );

            /*
             * --------------------------------------------------
             * UNKNOWN FIELD TYPE
             * --------------------------------------------------
             */
            default:
              return null;
          }
        })}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
        <SubmitButton loading={isSubmitting}>
          Save {schema.title}
        </SubmitButton>
      </div>
    </form>
  );
}