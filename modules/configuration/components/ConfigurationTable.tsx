"use client";

import { useMemo, useState } from "react";

import {
  AEDataTable,
  AEDataTableToolbar,
} from "@/components/enterprise/data-table";

import { AERowActions } from "@/components/enterprise/actions";

interface ConfigurationTableProps {
  title: string;

  rows: Record<string, any>[];

  columns: {
    key: string;
    label: string;
  }[];

  onCreate?: () => void;

  onView?: (row: Record<string, any>) => void;

  onEdit?: (row: Record<string, any>) => void;

  onDelete?: (row: Record<string, any>) => void;
}

export default function ConfigurationTable({
  title,
  rows,
  columns,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: ConfigurationTableProps) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [rows, search]);

  return (
    <AEDataTable
      toolbar={
        <AEDataTableToolbar
          search={search}
          setSearch={setSearch}
        >
          <button
            type="button"
            onClick={onCreate}
            disabled={!onCreate}
            className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-50"
          >
            + New
          </button>
        </AEDataTableToolbar>
      }
    >
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              className="px-6 py-4 text-left"
            >
              {column.label}
            </th>
          ))}

          <th className="px-6 py-4 text-center">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        {filteredRows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length + 1}
              className="px-6 py-12 text-center text-slate-400"
            >
              No {title.toLowerCase()} found.
            </td>
          </tr>
        ) : (
          filteredRows.map((row) => (
            <tr
              key={row.id}
              className="border-b hover:bg-slate-50"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4"
                >
                  {String(
                    row[column.key] ?? "-"
                  )}
                </td>
              ))}

              <td className="px-6 py-4">
                <div className="flex justify-center">
                  <AERowActions
                    onView={
                      onView
                        ? () => onView(row)
                        : undefined
                    }
                    onEdit={
                      onEdit
                        ? () => onEdit(row)
                        : undefined
                    }
                    onDelete={
                      onDelete
                        ? () => onDelete(row)
                        : undefined
                    }
                  />
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </AEDataTable>
  );
}