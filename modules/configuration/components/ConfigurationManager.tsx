
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import ConfigurationTable from "./ConfigurationTable";
import ConfigurationForm from "./ConfigurationForm";

import {
  createConfigurationAction,
  updateConfigurationAction,
  deleteConfigurationAction,
} from "@/app/dashboard/configuration/actions";

import {
  saveCompanySettingsAction,
} from "@/app/dashboard/configuration/actions";

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

  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] =
    useState<Record<string, any> | null>(null);
  const [viewingRow, setViewingRow] =
    useState<Record<string, any> | null>(null);

  const isCompanySettings =
    schema.table === "company_settings";

  const displayRows =
    schema.table === "businesses"
      ? initialRows.map((row) => ({
          ...row,
          status: row.active ? "Active" : "Inactive",
        }))
      : initialRows;

  function handleCreate() {
    setViewingRow(null);

    /*
     * Company Settings is a singleton record.
     *
     * There should only ever be one company settings
     * record, so "Add Company Settings" becomes an
     * edit of the existing record when one already exists.
     */
    if (isCompanySettings && initialRows.length > 0) {
      setEditingRow(initialRows[0]);
    } else {
      setEditingRow(null);
    }

    setShowForm(true);
  }

  function handleView(row: Record<string, any>) {
    setShowForm(false);
    setEditingRow(null);

    if (schema.table === "businesses") {
      setViewingRow({
        ...row,
        status: row.active ? "Active" : "Inactive",
      });
    } else {
      setViewingRow(row);
    }
  }

  function handleEdit(row: Record<string, any>) {
    setViewingRow(null);

    if (schema.table === "businesses") {
      setEditingRow({
        ...row,
        status: row.active ? "Active" : "Inactive",
      });
    } else {
      setEditingRow(row);
    }

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingRow(null);
  }

  function closeView() {
    setViewingRow(null);
  }

  function formatValue(value: unknown): string {
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
        return JSON.stringify(value, null, 2);
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
      /*
       * ======================================================
       * COMPANY SETTINGS
       * ======================================================
       *
       * Company Settings is a singleton configuration record.
       * It must never be handled through the generic
       * create/update configuration actions.
       */
      if (isCompanySettings) {
        await saveCompanySettingsAction(values);

        toast.success(
          editingRow
            ? "Company Settings updated successfully."
            : "Company Settings saved successfully."
        );

        closeForm();
        router.refresh();

        return;
      }

      // Only submit fields that belong to this configuration form. Some
      // pages enrich table rows with calculated display-only values (for
      // example loan_products.active_term_count and loan_readiness). Those
      // values are not database columns and must never reach Supabase.
      const editableKeys = new Set(schema.fields.map((field) => field.key));
      const payload = Object.fromEntries(
        Object.entries(values).filter(([key]) => editableKeys.has(key)),
      ) as Record<string, any>;

      /*
       * loan_product_name is a UI-only display field.
       * loan_product_terms stores loan_product_id instead.
       */
      if (schema.table === "loan_product_terms") {
        delete payload.loan_product_name;
      }

      /*
       * Businesses:
       * UI uses status.
       * Database uses active.
       */
      if (schema.table === "businesses") {
        payload.active =
          payload.status === "Active";

        delete payload.status;
      }

      if (editingRow?.id) {
        const result = await updateConfigurationAction(
          schema.table,
          editingRow.id,
          payload
        );

        if ("error" in result) {
          toast.error(result.error);
          return;
        }

        toast.success(
          `${schema.title} updated successfully.`
        );
      } else {
        const result = await createConfigurationAction(
          schema.table,
          payload
        );

        if ("error" in result) {
          toast.error(result.error);
          return;
        }

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
    /*
     * Company Settings is the enterprise singleton.
     * Do not allow it to be deleted accidentally.
     */
    if (isCompanySettings) {
      toast.error(
        "Company Settings cannot be deleted."
      );
      return;
    }

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

    const confirmed = window.confirm(
      recordName
        ? `Are you sure you want to delete "${recordName}"?`
        : `Are you sure you want to delete this ${itemName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteConfigurationAction(
        schema.table,
        row.id
      );

      if (viewingRow?.id === row.id) {
        setViewingRow(null);
      }

      if (editingRow?.id === row.id) {
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

    fields: schema.fields.map((field) => {
      if (
        schema.table === "branches" &&
        field.key === "business_id"
      ) {
        return {
          ...field,
          options: businesses.map(
            (business) => ({
              label: business.name,
              value: business.id,
            })
          ),
        };
      }

      return field;
    }),
  };

  const formDefaultValues = editingRow ?? (
    schema.table === "loan_products"
      ? { status: "Inactive", requires_collateral: false }
      : schema.table === "loan_product_terms"
        ? { active: true }
        : undefined
  );

  return (
    <>
      <ConfigurationTable
        title={schema.title}
        rows={displayRows}
        columns={columns}
        onCreate={handleCreate}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {viewingRow && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/50 px-3 pb-4 pt-[88px] sm:px-4 sm:pt-[112px]"
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
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {column.label}
                    </p>

                    <div className="whitespace-pre-wrap break-words text-sm font-medium text-slate-900">
                      {column.key === "logo_url" && viewingRow[column.key] ? (
                        <img src={String(viewingRow[column.key])} alt={`${viewingRow.name ?? "Business"} logo`} className="h-20 w-20 rounded-xl border border-slate-200 bg-white object-contain p-2" />
                      ) : formatValue(viewingRow[column.key])}
                    </div>
                  </div>
                ))}
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
                    const row = viewingRow;

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
          <div className="flex max-h-[70dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6 sm:py-5">
              <div>
                <h2 className="text-xl font-bold text-[#03162F] sm:text-2xl">
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

            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              <ConfigurationForm
                schema={formSchema}
                defaultValues={formDefaultValues}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
