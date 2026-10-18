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
                  {column.key === "map_location" ? (
                    row.latitude != null && row.longitude != null ? (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${row.latitude}&mlon=${row.longitude}#map=17/${row.latitude}/${row.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-col text-xs font-semibold text-blue-700 hover:underline"
                      >
                        <span>View map location</span>
                        <span className="mt-0.5 font-normal text-slate-500">{Number(row.latitude).toFixed(5)}, {Number(row.longitude).toFixed(5)}</span>
                      </a>
                    ) : <span className="text-slate-400">Not pinned</span>
                  ) : column.key === "loan_readiness" ? (
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row[column.key] === "Ready" ? "bg-emerald-50 text-emerald-700" : row[column.key] === "Needs active terms" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                      {String(row[column.key] ?? "-")}
                    </span>
                  ) : column.key === "logo_url" && row[column.key] ? (
                    <img src={String(row[column.key])} alt={`${row.name ?? "Business"} logo`} className="h-10 w-10 rounded-lg border border-slate-200 bg-white object-contain p-1" />
                  ) : typeof row[column.key] === "boolean" ? (
                    <span className={row[column.key] ? "font-semibold text-emerald-700" : "text-slate-500"}>
                      {row[column.key] ? "Yes" : "No"}
                    </span>
                  ) : String(row[column.key] ?? "-")}
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
