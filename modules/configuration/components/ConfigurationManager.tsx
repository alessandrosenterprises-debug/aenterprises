"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import ConfigurationTable from "./ConfigurationTable";
import ConfigurationForm from "./ConfigurationForm";

import {
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
} from "../services/configuration.service";

import { ConfigurationSchema } from "../types/configuration";

interface Business {
  id: string;
  name: string;
}

interface ConfigurationManagerProps {
  schema: ConfigurationSchema;

  initialRows: Record<string, any>[];

  columns: {
    key: string;
    label: string;
  }[];

  businesses?: Business[];
}

export default function ConfigurationManager({
  schema,
  initialRows,
  columns,
  businesses = [],
}: ConfigurationManagerProps) {
  const router = useRouter();

  const [showForm, setShowForm] =
    useState(false);

  const [editingRow, setEditingRow] =
    useState<Record<string, any> | null>(null);

  const [viewingRow, setViewingRow] =
    useState<Record<string, any> | null>(null);

  function handleCreate() {
    setViewingRow(null);
    setEditingRow(null);
    setShowForm(true);
  }

  function handleView(
    row: Record<string, any>
  ) {
    setShowForm(false);
    setEditingRow(null);
    setViewingRow(row);
  }

  function handleEdit(
    row: Record<string, any>
  ) {
    setViewingRow(null);
    setEditingRow(row);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingRow(null);
  }

  function closeView() {
    setViewingRow(null);
  }

  function formatValue(
    value: unknown
  ): string {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(
          value,
          null,
          2
        );
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  async function handleSubmit(
    values: Record<string, any>
  ) {
    try {
      if (editingRow?.id) {
        await updateConfiguration(
          schema.table,
          editingRow.id,
          values
        );

        toast.success(
          `${schema.title} updated successfully.`
        );
      } else {
        await createConfiguration(
          schema.table,
          values
        );

        toast.success(
          `${schema.title} created successfully.`
        );
      }

      closeForm();

      router.refresh();
    } catch (error: any) {
      console.error(
        "Configuration save error:",
        error
      );

      toast.error(
        error?.message ??
          `Failed to save ${schema.title}.`
      );
    }
  }

  async function handleDelete(
    row: Record<string, any>
  ) {
    if (!row.id) {
      toast.error(
        "This record has no ID."
      );

      return;
    }

    const recordName =
      row.name ??
      row.company_name ??
      row.title ??
      row.code ??
      "";

    const itemName =
      schema.title
        .toLowerCase()
        .replace(/s$/, "");

    const confirmed =
      window.confirm(
        recordName
          ? `Are you sure you want to delete "${recordName}"?`
          : `Are you sure you want to delete this ${itemName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteConfiguration(
        schema.table,
        row.id
      );

      if (
        viewingRow?.id === row.id
      ) {
        setViewingRow(null);
      }

      if (
        editingRow?.id === row.id
      ) {
        closeForm();
      }

      toast.success(
        `${schema.title} deleted successfully.`
      );

      router.refresh();
    } catch (error: any) {
      console.error(
        "Configuration delete error:",
        error
      );

      toast.error(
        error?.message ??
          `Failed to delete ${schema.title}.`
      );
    }
  }

  const formSchema = {
    ...schema,

    fields: schema.fields.map(
      (field) => {
        if (
          schema.table === "branches" &&
          field.key === "business_id"
        ) {
          return {
            ...field,

            options:
              businesses.map(
                (business) => ({
                  label: business.name,
                  value: business.id,
                })
              ),
          };
        }

        return field;
      }
    ),
  };

  return (
    <>
      <ConfigurationTable
        title={schema.title}
        rows={initialRows}
        columns={columns}
        onCreate={handleCreate}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {viewingRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeView();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-[#03162F]">
                  View {schema.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  View the details of this record.
                </p>
              </div>

              <button
                type="button"
                onClick={closeView}
                aria-label="Close"
                className="rounded-lg px-3 py-2 text-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {columns.map(
                  (column) => (
                    <div
                      key={column.key}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {column.label}
                      </p>

                      <div className="whitespace-pre-wrap break-words text-sm font-medium text-slate-900">
                        {formatValue(
                          viewingRow[
                            column.key
                          ]
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeView}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const row =
                      viewingRow;

                    if (!row) {
                      return;
                    }

                    closeView();
                    handleEdit(row);
                  }}
                  className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-[#03162F]">
                  {editingRow
                    ? `Edit ${schema.title}`
                    : `Add ${schema.title}`}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {schema.description}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
                className="rounded-lg px-3 py-2 text-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <ConfigurationForm
                schema={formSchema}
                defaultValues={
                  editingRow ??
                  undefined
                }
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}