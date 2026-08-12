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
  rows,
  columns,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: ConfigurationTableProps) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase();

    if (!query) return rows;

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
            onClick={onCreate}
            className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
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
        {filteredRows.map((row) => (
          <tr
            key={row.id}
            className="border-b hover:bg-slate-50"
          >
            {columns.map((column) => (
              <td
                key={column.key}
                className="px-6 py-4"
              >
                {String(row[column.key] ?? "-")}
              </td>
            ))}

            <td className="px-6 py-4">
              <div className="flex justify-center">
                <AERowActions
                  onView={() => onView?.(row)}
                  onEdit={() => onEdit?.(row)}
                  onDelete={() => onDelete?.(row)}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </AEDataTable>
  );
}